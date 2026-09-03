// 平衡敌人共享骨骼/LOD/分段命中运行测试（Node + Three.js，无 DOM/WebGL）
'use strict';

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

global.window = {};
Object.defineProperty(global, 'navigator', { value: { userAgent: 'Android test runner' }, configurable: true });
window.navigator = global.navigator;
window.matchMedia = () => ({ matches: true });
window.CS15_LOWEND = true;
global.atob = global.atob || ((value) => Buffer.from(value, 'base64').toString('binary'));

const THREE = require('../three.min.js');
global.THREE = THREE;
window.THREE = THREE;
THREE.TextureLoader.prototype.load = function (path, onLoad) {
  const texture = new THREE.Texture();
  texture.name = path;
  if (onLoad) onLoad(texture);
  return texture;
};

require('../enemy_model.js');
const mobileLodTriangles = window.CS15_ENEMY_MODEL.lods.map(lod => lod.triangleCount);
require('../enemy_model_hd.js');
const completeLodTriangles = [
  window.CS15_ENEMY_MODEL_HD_LOD0,
  ...window.CS15_ENEMY_MODEL.lods,
].map(lod => lod.triangleCount);
require('../enemy_rig.js');

console.log('--- A. 共享骨骼实例与三档护甲 ---');
const normal = window.CS15EnemyRig.create({ tier: 0, name: 'Phantom' });
const elite = window.CS15EnemyRig.create({ tier: 1, name: 'Viper' });
const ace = window.CS15EnemyRig.create({ tier: 2, name: 'Raven' });
ok(!!normal && !!elite && !!ace, '三档敌人实例创建成功');
ok(normal.meshes.length === 2 && mobileLodTriangles.join(',') === '17990,3999' &&
  completeLodTriangles.join(',') === '50008,17990,3999',
  '移动端只解析中/远两档，桌面高模仍完整保存在独立载荷');
ok(normal.meshes[0].geometry === elite.meshes[0].geometry && normal.meshes[0].material === ace.meshes[0].material, '不同敌人共享几何与主体材质');
ok(normal.skeleton !== elite.skeleton && normal.rig.root !== elite.rig.root, '不同敌人保留独立骨骼姿态');
ok(normal.armor.length === 2 && elite.armor.length === 5 && ace.armor.length === 6, '三档护甲附件逐级增加', `${normal.armor.length}/${elite.armor.length}/${ace.armor.length}`);
const stats = window.CS15EnemyRig.stats();
ok(normal.rig.bones.length === 24 && stats.boneCount === 24, '混合重建使用 24 节共享骨架定义');
ok(stats.offlineSkinWeights && normal.meshes.every(mesh => mesh.geometry.userData.offlineSkinWeights), '三个 LOD 均使用离线语义蒙皮权重');
const skinWeight = normal.meshes[0].geometry.getAttribute('skinWeight');
let normalizedWeights = true;
for (let vertex = 0; vertex < Math.min(300, skinWeight.count); vertex++) {
  const total = skinWeight.getX(vertex) + skinWeight.getY(vertex) + skinWeight.getZ(vertex) + skinWeight.getW(vertex);
  if (Math.abs(total - 1) > 0.0001) normalizedWeights = false;
}
ok(normalizedWeights, '抽样蒙皮权重均归一化');

console.log('--- B. 八代号复用、移动端 LOD 与二维移动混合 ---');
ok(window.CS15EnemyRig.codenames.length === 8 && window.CS15EnemyRig.codenames.includes('Raven'), '八个代号复用同一套骨骼');
ok(normal.activeLod === 0, '普通安卓初始使用移动近景 LOD');
normal.update(1 / 60, { speed: 2, forward: 1, side: 0, state: 'engage', distance: 25, rushing: false });
ok(normal.activeLod === 1, '远距离切换到 3999 面移动远景 LOD');
normal.update(1 / 60, { speed: 2, forward: 1, side: 0, state: 'engage', distance: 5, rushing: false });
ok(normal.activeLod === 0, '近距离恢复 17990 面移动近景 LOD');
const beforeLeg = normal.rig.upperLegL.rotation.x;
for (let frame = 0; frame < 12; frame++) normal.update(1 / 60, { speed: 2, forward: 1, side: 0, state: 'engage', distance: 5, rushing: false });
ok(normal.rig.upperLegL.rotation.x !== beforeLeg, '共享骨骼行走姿态持续更新');
  const forwardLegZ = normal.rig.upperLegL.rotation.z;
  let maxSidePoseDelta = 0;
  let maxLegPose = 0;
  for (let frame = 0; frame < 60; frame++) {
    normal.update(1 / 60, { speed: 2, forward: 0, side: 1, state: 'engage', distance: 5, rushing: false });
    maxSidePoseDelta = Math.max(maxSidePoseDelta, Math.abs(normal.rig.upperLegL.rotation.z - forwardLegZ));
    maxLegPose = Math.max(maxLegPose, Math.abs(normal.rig.upperLegL.rotation.x));
  }
  ok(maxSidePoseDelta > 0.03 && normal.animationState.sideBlend > 0.5, '横移姿态与前进姿态可区分', `maxDelta=${maxSidePoseDelta.toFixed(3)}`);
  // 步相位会随机起始，不能用最后一帧的腿部角度断言；固定时间窗内取最大幅度。
  ok(normal.animationState.aimBlend > 0.7 && maxLegPose > 0.02, '移动时上半身瞄准与下半身步态同时生效', `maxLeg=${maxLegPose.toFixed(3)}`);

console.log('--- C. 射击、受击与死亡动作层 ---');
normal.triggerShot();
normal.update(1 / 60, { speed: 1.6, forward: 0, side: 1, state: 'engage', distance: 5 });
const flashWasVisible = normal.muzzleFlash.visible;
for (let frame = 0; frame < 6; frame++) normal.update(1 / 60, { speed: 1.6, forward: 0, side: 1, state: 'engage', distance: 5 });
ok(normal.rig.weapon.position.z > normal.rig.weapon.userData.bindPosition.z + 0.01, '射击后坐在 0.1 秒后仍清晰可读');
ok(flashWasVisible, '射击触发骨骼随动枪口火光');
normal.triggerHit('head');
normal.update(0.05, { speed: 0, forward: 0, side: 0, state: 'engage', distance: 5 });
ok(Math.abs(normal.rig.head.rotation.z) > 0.02 && normal.animationState.hitAge < 0.1, '命中部位触发一次性受击层');
normal.triggerDeath();
for (let frame = 0; frame < 16; frame++) normal.update(1 / 60, { speed: 0, forward: 0, side: 0, state: 'dead', distance: 5 });
ok(normal.animationState.deathBlend > 0.7 && Math.abs(normal.rig.spine1.rotation.x) > 0.1, '死亡骨骼姿态平滑进入');

console.log('--- D. 分段命中与共享资源释放 ---');
const parts = new Set(normal.hitMeshes.map(mesh => mesh.userData.part));
ok(['head', 'torso', 'arm', 'leg', 'gun'].every(part => parts.has(part)), '命中代理覆盖头/身/臂/腿/枪');
normal.root.updateMatrixWorld(true);
const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 1.72, 2), new THREE.Vector3(0, 0, -1));
raycaster.layers.enable(window.CS15EnemyRig.hitLayer);
const hits = raycaster.intersectObjects(normal.hitMeshes, false);
ok(hits.length > 0 && hits[0].object.userData.part === 'head', '骨骼命中代理可被 Raycaster 精确识别', hits[0] && hits[0].object.userData.part);
let sharedDisposed = 0;
normal.meshes[0].geometry.addEventListener('dispose', () => sharedDisposed++);
normal.dispose();
ok(sharedDisposed === 0, '销毁敌人实例不会销毁共享 GPU 几何');
elite.dispose();
ace.dispose();

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
