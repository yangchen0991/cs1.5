// First-stage hand payload, texture wrapper, and reproducible build checks.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'docs', 'hands-model-build.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const expectedSourceHash = '3b4d53b98dfa965c64543ae6a9d351a04576cd2357dabebbe2be2fd08eaf8266';
const maxRuntimeBytes = Math.floor(1.75 * 1024 * 1024);
let passed = 0;
let failed = 0;

function ok(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}${detail ? `  (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}${detail ? `  (${detail})` : ''}`);
  }
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function makeThreeStub() {
  class BufferAttribute {
    constructor(array, itemSize) {
      this.array = array;
      this.itemSize = itemSize;
      this.count = array.length / itemSize;
    }
  }
  class BufferGeometry {
    constructor() {
      this.attributes = {};
      this.index = null;
    }
    setAttribute(name, attribute) {
      this.attributes[name] = attribute;
    }
    setIndex(attribute) {
      this.index = attribute;
    }
    computeBoundingSphere() {}
  }
  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.userData = {};
      this.name = '';
    }
  }
  class Group {
    constructor() {
      this.children = [];
      this.userData = {};
      this.name = '';
    }
    add(...children) {
      this.children.push(...children);
    }
  }
  return { BufferAttribute, BufferGeometry, Mesh, Group };
}

function readScript(fileName) {
  return fs.readFileSync(path.join(root, fileName), 'utf8');
}

console.log('--- A. 构建清单、源指纹与输出哈希 ---');
ok(manifest.version === 1 && manifest.pipeline === 'hands-obj-quantized-rigid-v1', '清单声明第一阶段刚性双手管线');
ok(manifest.sourceHash === expectedSourceHash && manifest.sourceHashes.obj === expectedSourceHash,
  'OBJ 源哈希与固定归档一致', manifest.sourceHash);
ok(manifest.sourceStats.positions === 24979 && manifest.sourceStats.uvs === 34228 &&
  manifest.sourceStats.triangles === 49970 && manifest.sourceStats.normals === 0,
  '源 OBJ 统计与归档证据一致');
ok(manifest.componentEvidence.componentCount === 2 && manifest.componentEvidence.crossComponentFaces === 0 &&
  manifest.componentEvidence.left.faceCount === 24906 && manifest.componentEvidence.right.faceCount === 25064 &&
  manifest.componentEvidence.left.sign === 'negative' && manifest.componentEvidence.right.sign === 'positive',
  '左右手按正负 X 严格拆分且没有跨组件面');

for (const [key, record] of Object.entries(manifest.outputs)) {
  const filePath = path.join(root, record.path);
  ok(fs.existsSync(filePath), `${key} 输出文件存在`);
  if (fs.existsSync(filePath)) {
    ok(fs.statSync(filePath).size === record.bytes && sha256(filePath) === record.sha256,
      `${key} 字节数与 SHA256 匹配`, `${record.bytes} bytes`);
  }
}

console.log('--- B. 量化误差、三角形预算与运行时体积 ---');
const hands = manifest.model.hands;
const totalTriangles = hands.left.outputTriangleCount + hands.right.outputTriangleCount;
const totalVertices = hands.left.outputVertexCount + hands.right.outputVertexCount;
ok(totalTriangles <= 18000 && totalTriangles >= 17500, '双手三角形不超过 18000 且接近目标', `${totalTriangles}`);
ok(totalVertices < 65535 * 2, '两只手均满足 Uint16 顶点索引上限', `${totalVertices} vertices`);
for (const handedness of ['left', 'right']) {
  const item = hands[handedness];
  ok(item.quantization.position.encoding === 'uint16' && item.quantization.uv.encoding === 'uint16' &&
    item.quantization.normal.encoding === 'int8-snorm' && item.quantization.index === 'uint16',
  `${handedness} 使用约定的量化编码`);
  ok(item.quantization.position.maxError <= 0.00002 &&
    item.quantization.normal.maxAngleErrorDegrees <= 1.0,
  `${handedness} 位置/法线量化误差通过门限`,
  `pos=${item.quantization.position.maxError}, normal=${item.quantization.normal.maxAngleErrorDegrees}deg`);
  ok(item.simplification.method === 'deterministic-uv-aware-vertex-cluster' &&
    item.componentEvidence.allCornersSameSign === true,
  `${handedness} 简化保持 UV 感知与组件归属`);
}

const runtimeFiles = ['hands_model.js', 'hands_tex.js', 'hands_albedo.webp', 'hands_normal.webp', 'hands_mr.webp'];
const runtimeBytes = runtimeFiles.reduce((sum, fileName) => sum + fs.statSync(path.join(root, fileName)).size, 0);
ok(runtimeBytes <= maxRuntimeBytes, '双手运行时资产总量不超过 1.75 MiB', `${runtimeBytes} / ${maxRuntimeBytes} bytes`);
for (const fileName of ['hands_albedo.webp', 'hands_normal.webp', 'hands_mr.webp']) {
  const bytes = fs.readFileSync(path.join(root, fileName));
  ok(bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
    `${fileName} 是 WebP 文件`);
}
ok(manifest.textures['hands_albedo.webp'].dimensions.join('x') === '1024x1024' &&
  manifest.textures['hands_normal.webp'].dimensions.join('x') === '1024x1024' &&
  manifest.textures['hands_mr.webp'].dimensions.join('x') === '512x512' &&
  manifest.textures['hands_mr.webp'].channels.r === '255' &&
  manifest.textures['hands_mr.webp'].channels.g === 'roughness' &&
  manifest.textures['hands_mr.webp'].channels.b === 'metallic',
  '贴图尺寸为 1024/1024/512');

console.log('--- C. 经典脚本模型契约与双手组装 ---');
const modelSource = readScript('hands_model.js');
ok(!/\b(?:import|export|eval|Function|fetch|XMLHttpRequest|WebSocket)\b/.test(modelSource),
  '模型脚本没有模块、动态执行或联网依赖');
ok(/(?:window\.HandsModel|Object\.defineProperty\(window,\s*['"]HandsModel)/.test(modelSource) && /new Uint16Array/.test(modelSource) &&
  /new Int8Array/.test(modelSource) && /buildPair/.test(modelSource),
  '模型脚本暴露量化与双手工厂');

const three = makeThreeStub();
const modelSandbox = {
  window: { THREE: three },
  THREE: three,
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  Uint8Array,
  Uint16Array,
  Int8Array,
  Float32Array,
  Math,
  Object,
  Error,
};
vm.createContext(modelSandbox);
vm.runInContext(modelSource, modelSandbox, { filename: 'hands_model.js' });
const model = modelSandbox.window.HandsModel;
ok(!!model && typeof model.build === 'function' && typeof model.buildPair === 'function', 'HandsModel 工厂可用');
ok(model.metadata.quantized === true && model.metadata.sourceHash === expectedSourceHash &&
  Object.isFrozen(model.metadata) && Object.isFrozen(model), 'HandsModel metadata 只读且带源指纹');
const material = { name: 'hands-material' };
const left = model.build('left', material);
const right = model.build('right', material);
const pair = model.buildPair(material);
ok(left.name === 'hand-left' && right.name === 'hand-right', '单手 Mesh 名称符合契约');
ok(pair.name === 'hands-pair' && pair.children.length === 2 &&
  pair.children[0].name === 'hand-left' && pair.children[1].name === 'hand-right' &&
  pair.userData.leftHand === pair.children[0] && pair.userData.rightHand === pair.children[1],
  'buildPair 返回带左右引用的双手 Group');
ok(left.geometry === pair.children[0].geometry && right.geometry === pair.children[1].geometry,
  'build/buildPair 复用每只手的 BufferGeometry 缓存');
for (const mesh of [left, right]) {
  ok(mesh.geometry.attributes.position && mesh.geometry.attributes.normal && mesh.geometry.attributes.uv &&
    mesh.geometry.index && mesh.geometry.index.array.constructor.name === 'Uint16Array',
  `${mesh.name} 含 position/normal/uv 与 Uint16 index`);
  ok(mesh.geometry.attributes.position.count === model.metadata.hands[mesh.userData.handedness].vertexCount &&
    mesh.geometry.index.count === model.metadata.hands[mesh.userData.handedness].triangleCount * 3,
  `${mesh.name} 几何数量与只读 metadata 一致`);
}

console.log('--- D. 纹理加载器契约与低端分支 ---');
const texSource = readScript('hands_tex.js');
ok(!/data:image|base64,|createElement\(['"]canvas|fetch\(|XMLHttpRequest|WebSocket/.test(texSource),
  '纹理脚本不内嵌图片、不创建 Canvas、不联网');
ok(/ClampToEdgeWrapping/.test(texSource) && /SRGBColorSpace/.test(texSource) && /NoColorSpace/.test(texSource) &&
  /lowEnd/.test(texSource), '纹理脚本声明包内路径、色彩空间与低端选项');

const textureCalls = [];
class FakeTextureLoader {
  load(url, onLoad) {
    textureCalls.push(url);
    onLoad({ userData: {}, wrapS: null, wrapT: null, colorSpace: null, needsUpdate: false });
  }
}
const textureThree = {
  TextureLoader: FakeTextureLoader,
  ClampToEdgeWrapping: 'ClampToEdgeWrapping',
  SRGBColorSpace: 'SRGBColorSpace',
  NoColorSpace: 'NoColorSpace',
};
const textureSandbox = { window: { THREE: textureThree }, THREE: textureThree, Promise };
vm.createContext(textureSandbox);
vm.runInContext(texSource, textureSandbox, { filename: 'hands_tex.js' });

(async () => {
  const lowEnd = await textureSandbox.window.HandsTex.loadAll({ lowEnd: true });
  ok(textureCalls.length === 1 && textureCalls[0] === 'hands_albedo.webp' &&
    lowEnd.albedo && lowEnd.normal === null && lowEnd.mr === null &&
    lowEnd.metallic === null && lowEnd.roughness === null,
  'lowEnd 只加载 albedo 且其余纹理返回 null');
  ok(lowEnd.albedo.userData.cs15PersistentAsset === true &&
    lowEnd.albedo.wrapS === 'ClampToEdgeWrapping' && lowEnd.albedo.wrapT === 'ClampToEdgeWrapping' &&
    lowEnd.albedo.colorSpace === 'SRGBColorSpace', 'albedo 标记持久资产、ClampToEdge 与 sRGB');
  const full = await textureSandbox.window.HandsTex.loadAll();
  ok(textureCalls.length === 3 && full.albedo && full.normal && full.mr &&
    full.metallic === full.mr && full.roughness === full.mr, '默认模式加载三张纹理并复用 MR');
  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
