// 港口地图资产回归：旧模型归档完整性、当前手工布局和运行时边界
// 运行：node tests/test_map_assets.js
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const builderSource = fs.readFileSync(path.join(root, 'tools', 'build-map-assets.js'), 'utf8');
const prepareSource = fs.readFileSync(path.join(root, 'tools', 'prepare-map-assets.ps1'), 'utf8');
const mapSource = fs.readFileSync(path.join(root, 'map.js'), 'utf8');
const environmentSource = fs.readFileSync(path.join(root, 'environment_materials.js'), 'utf8');
let pass = 0;
let fail = 0;
function ok(condition, name, extra = '') {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}${extra ? `  (${extra})` : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? `  (${extra})` : ''}`);
  }
}

const legacyMapDir = path.join(root, 'archive', 'assets', 'maps', 'container-port', 'legacy-runtime');
const modelPath = path.join(legacyMapDir, 'map_model.js');
const assetsPath = path.join(legacyMapDir, 'map_assets.js');
ok(fs.existsSync(modelPath) && fs.existsSync(assetsPath), '旧港口模型与 PBR 数据已移入归档，不进入当前入口');
const modelSource = fs.readFileSync(modelPath, 'utf8');
const modelMatch = modelSource.match(/root\.CS15_MAP_MODEL = (\{[\s\S]*\});\n\}\)\(window\);/);
ok(!!modelMatch, '地图几何脚本包含可解析的静态数据对象');
const model = modelMatch ? JSON.parse(modelMatch[1]) : {};
ok(model.vertexCount > 0 && model.vertexCount <= 65535, '地图顶点数适配移动端 Uint16 索引', `vertices=${model.vertexCount}`);
ok(model.triangleCount > 0 && model.triangleCount <= 60000, '地图三角形预算处于移动端目标范围', `triangles=${model.triangleCount}`);
ok([model.positions, model.normals, model.uvs, model.indices].every(value => typeof value === 'string' && value.length > 0), '位置、法线、UV、索引均以内嵌 base64 提供');
ok(model.bounds && model.bounds.min && model.bounds.max, '几何保留原始包围盒元数据');
const positionBytes = Buffer.from(model.positions || '', 'base64');
const normalBytes = Buffer.from(model.normals || '', 'base64');
const uvBytes = Buffer.from(model.uvs || '', 'base64');
const indexBytes = Buffer.from(model.indices || '', 'base64');
ok(positionBytes.length === model.vertexCount * 3 * 4 && normalBytes.length === model.vertexCount * 3 * 4 && uvBytes.length === model.vertexCount * 2 * 4 && indexBytes.length === model.triangleCount * 3 * 2, '模型 base64 解码长度与顶点/索引元数据一致');
const indices = new Uint16Array(indexBytes.buffer, indexBytes.byteOffset, indexBytes.byteLength / 2);
const normals = new Float32Array(normalBytes.buffer, normalBytes.byteOffset, normalBytes.byteLength / 4);
const validIndices = Array.from(indices).every(index => index < model.vertexCount);
const validNormals = Array.from(normals).every(value => Number.isFinite(value));
ok(validIndices && validNormals, '模型索引不越界且法线数值有限');

const collision = model.collision || {};
const collisionBoxes = Array.isArray(collision.boxes) ? collision.boxes : [];
ok(collision.version === 1 && collision.cellSize === 0.5 && collisionBoxes.length > 0, '模型同时内嵌构建期碰撞代理', `boxes=${collisionBoxes.length}`);
ok(collisionBoxes.length >= 100 && collisionBoxes.length <= 550, '碰撞代理数量处于移动端轻量预算', `boxes=${collisionBoxes.length}`);
const validCollisionBoxes = collisionBoxes.every(box => {
  const values = [box.minX, box.maxX, box.minZ, box.maxZ, box.minY, box.maxY];
  return values.every(Number.isFinite) && box.maxX > box.minX && box.maxZ > box.minZ && box.maxY > box.minY;
});
ok(validCollisionBoxes, '碰撞代理 AABB 数值有效且尺寸为正');
const collisionBounds = collision.bounds || {};
const insideCollisionBounds = collisionBoxes.every(box => (
  box.minX >= collisionBounds.minX && box.maxX <= collisionBounds.maxX &&
  box.minZ >= collisionBounds.minZ && box.maxZ <= collisionBounds.maxZ && box.minY >= 0
));
ok(insideCollisionBounds && collisionBoxes.some(box => box.maxY >= 1.55), '碰撞代理覆盖地图范围并保留高墙高度');
ok(collisionBoxes.some(box => box.minY === 0), '高位结构面碰撞从地面起算，避免白墙射线从下方穿透');

const assets = fs.readFileSync(assetsPath, 'utf8');
for (const key of ['portBase', 'portNormal', 'portMetallic', 'portRoughness']) {
  ok(new RegExp(`window\\.TEX\\.${key} = "data:image/(?:webp|png);base64,`).test(assets), `归档 PBR 贴图 ${key} 的 data URL 完整`);
}

const currentModelPath = path.join(root, 'map_model.js');
const currentCollisionPath = path.join(root, 'map_collision.js');
const currentAssetsPath = path.join(root, 'map_assets.js');
ok(fs.existsSync(currentModelPath) && fs.existsSync(currentCollisionPath) && fs.existsSync(currentAssetsPath), '当前入口包含港口模型、独立碰撞数据与 PBR 数据');
const currentModelSource = fs.readFileSync(currentModelPath, 'utf8');
const currentModelMatch = currentModelSource.match(/root\.CS15_MAP_MODEL = (\{[\s\S]*\});\n\}\)\(window\);/);
const currentModel = currentModelMatch ? JSON.parse(currentModelMatch[1]) : {};
ok(currentModel.vertexCount === model.vertexCount && currentModel.triangleCount === model.triangleCount,
  '当前港口视觉模型保留移动端顶点/三角形预算', `vertices=${currentModel.vertexCount}, triangles=${currentModel.triangleCount}`);
ok([currentModel.positions, currentModel.normals, currentModel.uvs, currentModel.indices].every(value => typeof value === 'string' && value.length > 0) &&
  !currentModel.collision, '当前模型只提供视觉几何，不携带自动碰撞代理');
const currentPositionBytes = Buffer.from(currentModel.positions || '', 'base64');
const currentNormalBytes = Buffer.from(currentModel.normals || '', 'base64');
const currentUvBytes = Buffer.from(currentModel.uvs || '', 'base64');
const currentIndexBytes = Buffer.from(currentModel.indices || '', 'base64');
ok(currentModel.version === 2 && currentModel.encoding === 'u16-quantized' &&
  currentPositionBytes.length === currentModel.vertexCount * 3 * 2 &&
  currentNormalBytes.length === currentModel.vertexCount * 3 * 2 &&
  currentUvBytes.length === currentModel.vertexCount * 2 * 2 &&
  currentIndexBytes.length === currentModel.triangleCount * 3 * 2,
  '当前模型属性使用 Uint16 量化且索引拓扑长度不变');
const currentPositions = new Uint16Array(Uint8Array.from(currentPositionBytes).buffer);
const positionQuant = currentModel.quantization && currentModel.quantization.positions;
let maxWorldPositionError = 0;
if (positionQuant) {
  const archivedPositions = new Float32Array(Uint8Array.from(positionBytes).buffer);
  for (let i = 0; i < currentPositions.length; i++) {
    const component = i % 3;
    const decoded = positionQuant.min[component] + currentPositions[i] * positionQuant.scale[component];
    maxWorldPositionError = Math.max(maxWorldPositionError, Math.abs(decoded - archivedPositions[i]) * 64);
  }
}
ok(maxWorldPositionError > 0 && maxWorldPositionError < 0.0011,
  '量化后的港口世界坐标误差低于 1.1mm', `max=${maxWorldPositionError}`);
const currentCollisionSource = fs.readFileSync(currentCollisionPath, 'utf8');
const currentCollisionMatch = currentCollisionSource.match(/root\.CS15_MAP_COLLISION = (\{[\s\S]*\});\n\}\)\(window\);/);
const currentCollision = currentCollisionMatch ? JSON.parse(currentCollisionMatch[1]) : {};
const currentWalkBoxes = Array.isArray(currentCollision.boxes) ? currentCollision.boxes : [];
ok(currentCollision.version === 2 && currentCollision.sourceVertexCount === currentModel.vertexCount &&
  currentCollision.sourceTriangleCount === currentModel.triangleCount && currentWalkBoxes.length > 0,
  '当前港口行走碰撞由同版本视觉模型独立生成', `boxes=${currentWalkBoxes.length}`);
ok(currentCollision.walkFilter && currentCollision.walkFilter.maxGroundY === 0.25 &&
  currentCollision.walkFilter.minBlockHeight === 0.5 && currentCollision.walkFilter.heightStep === 0.5 &&
  currentCollision.walkFilter.sourceBoxCount >= 450 && currentCollision.walkFilter.occupiedCellCount >= 4500 &&
  currentWalkBoxes.length >= 100 && currentWalkBoxes.length <= 180,
  '行走碰撞合并模型地面结构投影并保留窄墙覆盖',
  `boxes=${currentWalkBoxes.length}, cells=${currentCollision.walkFilter && currentCollision.walkFilter.occupiedCellCount}`);
ok(currentWalkBoxes.every(box => [box.minX, box.maxX, box.minZ, box.maxZ, box.minY, box.maxY].every(Number.isFinite) &&
  box.maxX > box.minX && box.maxZ > box.minZ && box.maxY > box.minY && box.minY === 0 &&
  box.maxY >= currentCollision.walkFilter.minBlockHeight),
  '当前行走碰撞盒从地面起算且结构高度有效');
const currentAssets = fs.readFileSync(currentAssetsPath, 'utf8');
ok(/window\.TEX\.portBase = 'port_base\.webp'/.test(currentAssets) &&
  /window\.TEX\.portNormal = 'port_normal\.webp'/.test(currentAssets) &&
  /window\.TEX\.portMR = 'port_mr\.webp'/.test(currentAssets) &&
  !/data:image\/|base64,/.test(currentAssets), '当前港口 PBR 使用三张包内图片路径，不再内嵌 Base64');
ok(/portMetallic = window\.TEX\.portMR/.test(currentAssets) &&
  /portRoughness = window\.TEX\.portMR/.test(currentAssets) && /mrKey: 'portMR'/.test(environmentSource),
  '港口金属度与粗糙度共享一张 G/B 通道贴图');
ok(/_buildPort\(\)/.test(mapSource) && /_buildImportedPortModel\(\)/.test(mapSource), 'GameMap 使用离线港口模型视觉层');
ok(/_portCollisionLayout\(\)/.test(mapSource) && /_addPortCollider\(/.test(mapSource), '港口地图维护独立 AABB 碰撞数据');
ok(/_buildExactPortCollision\(/.test(mapSource) && /visual-mesh-segments/.test(mapSource) &&
  /_raycastImportedPort\(/.test(mapSource) && /_portSupportBoxes/.test(mapSource) && /_portBoundary/.test(mapSource) &&
  /if \(blockMovement\) this\.boxes\.push\(box\)/.test(mapSource) &&
  /this\._portVisualSource = imported \? 'imported-model' : 'curated-fallback'/.test(mapSource) &&
  /CS15_MAP_MODEL/.test(mapSource) && /_applyPortTexture/.test(mapSource) &&
  !/_addPortModelColliders|layout\.low|data\.collision/.test(mapSource),
  '当前运行时移动与弹道均以可见模型为准，旧盒只保留高度支撑与失败回退');
ok(/sharedSurface/.test(environmentSource) && /textureKey: 'concrete'/.test(environmentSource) &&
  /_environmentAssets\(\)/.test(mapSource) && /surface\.textureKey/.test(mapSource) &&
  !/weapon(?:Palette|Color|\.js)/i.test(environmentSource), '地面/边界共用环境资产且环境词汇不引用武器配色');
ok(/_loadSharedTexture/.test(mapSource) && /CS15_SHARED_MAP_TEXTURES/.test(mapSource) &&
  /cs15PersistentAsset/.test(mapSource) && /_scaleGeometryUv/.test(mapSource),
  '相同环境贴图跨地图复用，平铺写入 UV 后不再逐墙 clone');
ok(/_buildCollisionGrid\(\)/.test(mapSource) && /_collisionCandidates\(/.test(mapSource), '移动碰撞使用局部空间分区，避免每步扫描全部盒子');
ok(/_raycastCandidates\(/.test(mapSource) && /rayAABBDetailed\(origin, direction, b\)/.test(mapSource) &&
  /intersectObject\(this\._portModel, false\)/.test(mapSource) && /if \(!b\._portBoundary\) continue/.test(mapSource),
  '经典射线使用空间分区，港口弹道只组合真实网格与外围边界');
ok(/moveCircle\(startX, startZ, endX, endZ, radius\)/.test(mapSource) && /typeof this\.map\.moveCircle/.test(fs.readFileSync(path.join(root, 'player.js'), 'utf8')) && /typeof this\.map\.moveCircle/.test(fs.readFileSync(path.join(root, 'enemy.js'), 'utf8')), '玩家与敌人均使用连续移动碰撞');
ok(/bounds = \{ minX: -30\.5, maxX: 30\.5, minZ: -30\.5, maxZ: 30\.5 \}/.test(mapSource) && /x: -31\.5/.test(mapSource), '外围边界与可玩区裁剪不重叠');
global.window = {};
global.THREE = require('../three.min.js');
require('../config.js');
global.CONFIG = global.window.CONFIG;
require('../map.js');
const Box = global.window.Box;
const GameMap = global.window.GameMap;
const portBranchStart = mapSource.indexOf('if (this.isContainerPort)');
const portBranchEnd = mapSource.indexOf('} else {', portBranchStart);
const portBranchSource = mapSource.slice(portBranchStart, portBranchEnd);
const portSpawnPoints = [...portBranchSource.matchAll(/new THREE\.Vector3\((-?[\d.]+), 0, (-?[\d.]+)\)/g)]
  .map(match => ({ x: Number(match[1]), z: Number(match[2]) }));
const currentCollisionHarness = Object.create(GameMap.prototype);
currentCollisionHarness.boxes = currentWalkBoxes.map(box =>
  new Box(box.minX, box.maxX, box.minZ, box.maxZ, box.minY, box.maxY));
currentCollisionHarness.bounds = { minX: -30.5, maxX: 30.5, minZ: -30.5, maxZ: 30.5 };
const validPortSpawns = portSpawnPoints.length === 7 && portSpawnPoints.every(point => {
  const resolved = currentCollisionHarness.collide(point.x, point.z, 0.6);
  return Math.abs(resolved.x - point.x) < 0.001 && Math.abs(resolved.z - point.z) < 0.001;
});
ok(validPortSpawns, '港口玩家与六个敌人固定出生点均位于新版碰撞层的可行走区',
  `spawns=${portSpawnPoints.length}`);
const collisionHarness = Object.create(GameMap.prototype);
collisionHarness.boxes = [new Box(-10, -9.5, -5, 5, 0, 8)];
collisionHarness.bounds = { minX: -30.5, maxX: 30.5, minZ: -30.5, maxZ: 30.5 };
const moved = collisionHarness.moveCircle(-12, 0, -7.4, 0, 0.4);
ok(moved.x <= -10.4 + 1e-6 && collisionHarness.boxes.every(box => !box.resolveCircle(moved.x, moved.z, 0.4)),
  '连续移动停在薄墙原侧且不与墙重叠', `resolved=(${moved.x.toFixed(2)},${moved.z.toFixed(2)})`);
const rayHarness = Object.create(GameMap.prototype);
rayHarness.boxes = [new Box(-10, -9.5, -5, 5, 0, 8)];
const firstRay = rayHarness.raycastDetailed(new THREE.Vector3(-12, 1.7, 0), new THREE.Vector3(1, 0, 0), 20);
rayHarness.boxes.push(new Box(20, 21, -5, 5, 0, 8));
const rebuiltRay = rayHarness.raycastDetailed(new THREE.Vector3(-12, 1.7, 0), new THREE.Vector3(1, 0, 0), 20);
ok(firstRay && rebuiltRay && Math.abs(firstRay.t - 2) < 1e-6 && Math.abs(rebuiltRay.t - 2) < 1e-6, '射线空间分区重建后仍命中旧碰撞盒', `first=${firstRay && firstRay.t}, rebuilt=${rebuiltRay && rebuiltRay.t}`);
const portRayHarness = Object.create(GameMap.prototype);
const portWalkWall = new Box(-10, -9.5, -1, 1, 0, 4);
portWalkWall._portWalk = true;
portRayHarness.isContainerPort = true;
portRayHarness._portModel = {};
portRayHarness._portBoundaryBoxes = [];
portRayHarness._raycastImportedPort = () => null;
portRayHarness._raycastCandidates = () => [portWalkWall];
const portFallbackRay = portRayHarness.raycastDetailed(
  new THREE.Vector3(-12, 1.7, 0), new THREE.Vector3(1, 0, 0), 20
);
ok(portFallbackRay && Math.abs(portFallbackRay.t - 20) < 1e-6,
  '港口移动代理不再在可见模型之外形成空气墙挡弹', `t=${portFallbackRay && portFallbackRay.t}`);
const boundaryHarness = Object.create(GameMap.prototype);
boundaryHarness.boxes = [new Box(-32, -31, -32, 32, 0, 5)];
boundaryHarness.bounds = { minX: -30.5, maxX: 30.5, minZ: -30.5, maxZ: 30.5 };
const edge = boundaryHarness.collide(-30.1, 0, 0.4);
ok(boundaryHarness.boxes.every(box => !box.resolveCircle(edge.x, edge.z, 0.4)), '外围边界裁剪后实体不被推回碰撞体内');
const layoutHarness = Object.create(GameMap.prototype);
const currentPortLayout = GameMap.prototype._portCollisionLayout.call(layoutHarness);
ok(Array.isArray(currentPortLayout.high) && currentPortLayout.high.length === 10 && !('low' in currentPortLayout),
  '港口手工布局只作为模型碰撞生成失败时的高位回退，不生成白色低掩体', `high=${currentPortLayout.high.length}`);
ok(/reservedPoints = \[\]/.test(mapSource) && /const occupied = this\.enemies/.test(mainSource) &&
  /W\.minSpawnDistance \|\| 16/.test(mainSource), '实际生成当帧同时复核玩家距离与场上敌人间距');
ok(/legacy-runtime/.test(prepareSource) && /--out \$outputPath/.test(prepareSource), '历史地图重建工具默认输出到归档目录');
ok(/activeMapId = 'classic'/.test(mainSource) && /港口地图加载失败，已切换经典竞技场/.test(mainSource) &&
  /游戏初始化失败，请重新加载页面/.test(mainSource), '延迟地图初始化失败时有经典地图与开局防崩兜底');
ok(/meshes\.length !== 1 \|\| primitives\.length !== 1/.test(builderSource) && /请先合并或拆分模型/.test(builderSource), '地图构建器拒绝静默丢弃多 primitive');
ok(/elevatedStructuralFace/.test(builderSource) && /verticalCells/.test(builderSource) && /structuralCells/.test(builderSource), '构建器同时覆盖垂直墙面与简化后残留的高位结构面');
ok(/this\.mapId = opts\.mapId/.test(mapSource) && /defaultId: 'container-port'/.test(fs.readFileSync(path.join(root, 'config.js'), 'utf8')), '默认地图 ID 与配置保持一致');
ok(!/\.obj|\.mtl|\.glb/i.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8')), '入口不直接加载原始模型格式');

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
