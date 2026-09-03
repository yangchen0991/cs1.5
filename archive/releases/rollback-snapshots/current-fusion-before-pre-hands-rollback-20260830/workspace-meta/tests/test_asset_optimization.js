// Geometry and texture packaging regression for the first-stage compression candidate.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const archived = path.join(root, 'archive', 'assets', 'runtime-pre-compression');
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

function bytes(encoded) {
  return Uint8Array.from(Buffer.from(encoded, 'base64'));
}

function u16(encoded) {
  return new Uint16Array(bytes(encoded).buffer);
}

function f32(encoded) {
  return new Float32Array(bytes(encoded).buffer);
}

function extractJson(source, expression) {
  const match = source.match(expression);
  return match ? JSON.parse(match[1]) : null;
}

function extractConstant(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*'([^']*)'`));
  return match ? match[1] : '';
}

function extractArray(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\[[^;]+\\])`));
  return match ? JSON.parse(match[1]) : null;
}

function decodeQuantized(packed, itemSize, minimum, scale) {
  const output = new Float32Array(packed.length);
  for (let i = 0; i < packed.length; i++) {
    const component = i % itemSize;
    output[i] = minimum[component] + packed[i] * scale[component];
  }
  return output;
}

function maxError(a, b) {
  if (a.length !== b.length) return Infinity;
  let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  return maximum;
}

console.log('--- A. 港口模型量化保持拓扑与毫米级位置 ---');
const archivedMapSource = fs.readFileSync(path.join(archived, 'map_model.js'), 'utf8');
const currentMapSource = fs.readFileSync(path.join(root, 'map_model.js'), 'utf8');
const archivedMap = extractJson(archivedMapSource, /root\.CS15_MAP_MODEL\s*=\s*(\{[\s\S]*\});\s*\}\)\(window\)/);
const currentMap = extractJson(currentMapSource, /root\.CS15_MAP_MODEL\s*=\s*(\{[\s\S]*\});\s*\}\)\(window\)/);
const decodedMapPositions = decodeQuantized(
  u16(currentMap.positions), 3,
  currentMap.quantization.positions.min,
  currentMap.quantization.positions.scale
);
const mapPositionError = maxError(f32(archivedMap.positions), decodedMapPositions) * 64;
ok(currentMap.encoding === 'u16-quantized' && currentMap.vertexCount === archivedMap.vertexCount &&
  currentMap.triangleCount === archivedMap.triangleCount, '港口顶点和三角形数量保持不变');
ok(Buffer.from(currentMap.indices, 'base64').equals(Buffer.from(archivedMap.indices, 'base64')),
  '港口索引字节逐字节保持不变');
ok(mapPositionError < 0.0011, '港口世界坐标最大误差低于 1.1mm', `max=${mapPositionError}`);
ok(fs.statSync(path.join(root, 'map_model.js')).size < fs.statSync(path.join(archived, 'map_model.js')).size * 0.60,
  '港口模型脚本原始体积至少减少 40%');

console.log('--- B. AK 融合握持 / AWP 量化模型 ---');
const akSource = fs.readFileSync(path.join(root, 'ak47_model.js'), 'utf8');
ok(/fusedViewModel/.test(akSource) && /ak47-fused-grip-viewmodel/.test(akSource),
  'AK 运行时使用专属整体握持模型');
ok(/new Uint16Array/.test(akSource) && /Uint32Array/.test(akSource) && /new Int8Array/.test(akSource) && /setAttribute\('uv'/.test(akSource),
  'AK 融合模型使用 Uint16/Int8 量化属性与 Uint32 索引');
const akBuild = JSON.parse(fs.readFileSync(path.join(root, 'output', 'ak47-grip-preview', 'ak47-grip-model-build.json'), 'utf8'));
ok(akBuild.source.sha256 === 'f785fcde1dd9d2ab42fa58ee2138f51707501a6b87462137c1661b284adfc769' &&
  akBuild.output.fusedViewModel === true, 'AK 融合模型绑定正确源 OBJ 指纹');
ok(akBuild.output.sourceForwardAxis === '+X' && akBuild.output.runtimeForwardAxis === '-Z' &&
  Math.abs(akBuild.output.viewRotationYRadians - Math.PI / 2) < 1e-12,
  'AK wz50 枪口轴契约固定为 +X 经 +PI/2 映射到视图 -Z');
ok(akBuild.qualityProfile === 'v1-v2-capacity-fusion' && akBuild.output.triangleCount === 39674 &&
  akBuild.output.vertexCount === 86131 && akBuild.output.indexFormat === 'I',
  'AK 融合容量档固定为约 4 万面与 Uint32 索引', `${akBuild.output.triangleCount} tris / ${akBuild.output.vertexCount} verts`);
ok(akBuild.textureDimensions.albedo === 1536 && akBuild.textureDimensions.normal === 1536 &&
  akBuild.textureDimensions.mr === 768, 'AK 融合容量档使用 1536/1536/768 PBR 贴图');
const akTextureSource = fs.readFileSync(path.join(root, 'ak47_tex.js'), 'utf8');
ok(/qualityProfile:'v1-v2-capacity-fusion'/.test(akTextureSource) && /Math\.min\(8,/.test(akTextureSource) &&
  /LinearMipmapLinearFilter/.test(akTextureSource), 'AK 融合容量档启用最高 8x 各向异性和三线性过滤');
for (const weapon of ['awp']) {
  const oldSource = fs.readFileSync(path.join(archived, `${weapon}_model.js`), 'utf8');
  const newSource = fs.readFileSync(path.join(root, `${weapon}_model.js`), 'utf8');
  const originalPositions = f32(extractConstant(oldSource, 'POS_B64'));
  const decodedPositions = decodeQuantized(
    u16(extractConstant(newSource, 'POS_B64')), 3,
    extractArray(newSource, 'POS_MIN'), extractArray(newSource, 'POS_SCALE')
  );
  const positionError = maxError(originalPositions, decodedPositions);
  ok(positionError < 0.00002, `${weapon} 位置最大误差低于 0.02mm`, `max=${positionError}`);
  ok(Buffer.from(extractConstant(newSource, 'IDX_B64'), 'base64')
    .equals(Buffer.from(extractConstant(oldSource, 'IDX_B64'), 'base64')),
  `${weapon} 索引字节逐字节保持不变`);
  ok(/setAttribute\('normal'/.test(newSource) && !/computeVertexNormals\(\)|uvArr\.slice/.test(newSource),
    `${weapon} 法线离线提供且不再启动时计算/复制 uv2`);
  ok(fs.statSync(path.join(root, `${weapon}_model.js`)).size <
    fs.statSync(path.join(archived, `${weapon}_model.js`)).size * 0.80,
  `${weapon} 模型脚本原始体积至少减少 20%`);
}

global.window = {};
global.atob = global.atob || (value => Buffer.from(value, 'base64').toString('binary'));
const THREE = require('../three.min.js');
global.THREE = THREE;
require('../ak47_model.js');
require('../awp_model.js');
const akMesh = window.Ak47Model.build(null, new THREE.MeshStandardMaterial());
ok(akMesh.geometry.getAttribute('position').count === 86131 &&
  akMesh.geometry.getAttribute('normal').count === 86131 &&
  akMesh.geometry.index.count === 119022 && akMesh.geometry.index.array instanceof Uint32Array &&
  window.Ak47Model.metadata.fusedViewModel === true,
  'AK 融合量化模型可直接构建为完整 BufferGeometry');
ok(Math.abs(akMesh.rotation.y - Math.PI / 2) < 1e-12,
  'AK 融合模型运行时使用 +PI/2，避免从枪口反向看向枪托');
akMesh.geometry.dispose();
akMesh.material.dispose();
for (const [name, model, vertexCount, indexCount] of [
  ['awp', window.AwpModel, 37465, 224994],
]) {
  const mesh = model.build(null, new THREE.MeshStandardMaterial());
  ok(mesh.geometry.getAttribute('position').count === vertexCount &&
    mesh.geometry.getAttribute('normal').count === vertexCount &&
    mesh.geometry.index.count === indexCount && model.quantized === true,
  `${name} 量化模型可直接构建为完整 BufferGeometry`);
  mesh.geometry.dispose();
  mesh.material.dispose();
}

console.log('--- C. 敌人移动载荷拆分但三档内容完整 ---');
const enemySandbox = { window: {} };
vm.createContext(enemySandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'enemy_model.js'), 'utf8'), enemySandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'enemy_model_hd.js'), 'utf8'), enemySandbox);
const mobileLods = enemySandbox.window.CS15_ENEMY_MODEL.lods;
const allLods = [enemySandbox.window.CS15_ENEMY_MODEL_HD_LOD0, ...mobileLods];
ok(mobileLods.map(lod => lod.triangleCount).join(',') === '17990,3999',
  '移动端载荷只含 17990/3999 面两档');
ok(allLods.map(lod => lod.triangleCount).join(',') === '50008,17990,3999' &&
  allLods.every(lod => lod.skinIndex && lod.skinWeight), '桌面高模和三档蒙皮数据仍完整');
ok(fs.statSync(path.join(root, 'enemy_model.js')).size <
  fs.statSync(path.join(archived, 'enemy_model.js')).size * 0.35,
  '移动端敌人首段脚本体积至少减少 65%');
ok(fs.statSync(path.join(root, 'enemy_model.js')).size + fs.statSync(path.join(root, 'enemy_model_hd.js')).size <=
  fs.statSync(path.join(archived, 'enemy_model.js')).size * 1.01,
  '拆分没有膨胀完整敌人几何载荷');

console.log('--- D. 外置贴图包装器不再携带 Base64/Canvas ---');
for (const file of ['textures.js', 'map_assets.js', 'ak47_tex.js', 'awp_tex.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  ok(!/data:image|base64,|createElement\(['"]canvas/.test(source), `${file} 不含内嵌图片或 Canvas 转存`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'release-files.json'), 'utf8'));
const optimizedImages = manifest.files.filter(file => /^(?:env_|port_|ak47_|awp_).+\.(?:webp|jpg)$/.test(file));
ok(optimizedImages.length === 12 && optimizedImages.every(file => fs.existsSync(path.join(root, file))),
  '12 张优化图片全部存在并进入发布清单', optimizedImages.join(','));

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
