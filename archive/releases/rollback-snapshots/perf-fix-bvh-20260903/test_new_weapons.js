// 新增 M249、M9 刺刀与 M26 手榴弹的资产、配置和战斗行为回归。
// 运行：node tests/test_new_weapons.js
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
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

global.window = { addEventListener() {} };
global.document = { getElementById() { return null; } };
global.performance = { now: () => 0 };
const THREE = require('../three.min.js');
global.THREE = THREE;
require('../config.js');
global.CONFIG = global.window.CONFIG;
require('../m249_model.js');
require('../m9_model.js');
require('../grenade_model.js');
require('../weapon.js');
require('../pickup.js');
require('../enemy.js');
const WeaponSystem = global.window.WeaponSystem;
const Pickup = global.window.PickupSystem;
const Enemy = global.window.Enemy;

console.log('--- A. 三套量化模型与包体预算 ---');
const buildManifest = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'new-weapons-model-build.json'), 'utf8'));
const releaseFiles = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'release-files.json'), 'utf8')).files;
const expectedFiles = [];
for (const id of ['m249', 'm9', 'grenade']) {
  expectedFiles.push(`${id}_model.js`, `${id}_tex.js`, `${id}_albedo.webp`, `${id}_normal.webp`, `${id}_mr.webp`);
}
ok(expectedFiles.every(file => releaseFiles.includes(file) && fs.existsSync(path.join(root, file))),
  '15 个新增运行时资源全部存在并进入统一发布清单');
ok(buildManifest.totals.runtimeBytes <= 2.5 * 1024 * 1024,
  '三套新增资产总量不超过 2.5 MiB', `${buildManifest.totals.runtimeBytes} B`);
ok(JSON.stringify(buildManifest.assets.map(asset => asset.output.triangleCount)) === JSON.stringify([17957, 10000, 7994]),
  '三套模型保持确定性移动端面数', buildManifest.assets.map(asset => asset.output.triangleCount).join(','));

const modelCases = [
  ['M249', window.M249Model, 'z'],
  ['M9 刺刀', window.M9Model, 'z'],
  ['M26', window.GrenadeModel, 'y'],
];
for (const [label, api, longAxis] of modelCases) {
  const mesh = api.build(null, new THREE.MeshBasicMaterial());
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  mesh.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(mesh);
  const size = bounds.getSize(new THREE.Vector3());
  ok(geometry.attributes.position.count === api.posCount && geometry.attributes.normal.count === api.posCount &&
    geometry.attributes.uv.count === api.posCount && geometry.index.count === api.idxCount,
  `${label} 量化载荷可直接构建完整 BufferGeometry`);
  const expectedAxis = longAxis === 'z' ? size.z : size.y;
  const otherAxes = longAxis === 'z' ? Math.max(size.x, size.y) : Math.max(size.x, size.z);
  ok(expectedAxis > otherAxes, `${label} 运行时主轴方向正确`, `size=${size.x.toFixed(3)},${size.y.toFixed(3)},${size.z.toFixed(3)}`);
}

console.log('--- B. 六槽位配置、HUD 与输入链 ---');
const weapons = CONFIG.weapons;
ok(['usp', 'ak47', 'awp', 'm249', 'm9', 'grenade'].every((id, index) => weapons[id].slot === index + 1),
  '六种武器槽位按 1–6 唯一排列');
ok(weapons.m249.kind === 'firearm' && weapons.m249.type === 'auto' && weapons.m249.magSize === 100 && weapons.m249.reserve === 200,
  'M249 使用 100/200 弹药与全自动重武器契约');
ok(weapons.m9.kind === 'melee' && weapons.m9.reloadable === false && weapons.m9.range <= 3,
  'M9 按实际刺刀资产接入近战且不可换弹');
ok(weapons.grenade.kind === 'grenade' && weapons.grenade.magSize === 2 && weapons.grenade.blastRadius === 7 && weapons.grenade.fuseTime > 2,
  'M26 每局两枚并配置延时范围爆炸');
const mainSource = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
ok(/\['usp', 'ak47', 'awp', 'm249', 'm9', 'grenade'\]/.test(mainSource) &&
  [1, 2, 3, 4, 5, 6].every(slot => indexSource.includes(`data-slot="${slot}"`)),
  '桌面数字键、HUD 直选与移动端循环均覆盖六槽位');

console.log('--- C. M9 近战命中不消耗弹药并发出权威击杀事件 ---');
let meleeDamage = 0;
let meleeKill = null;
let meleeAudio = 0;
const meleeEnemy = {
  name: '近战目标', tier: 1, position: { x: 0, z: -1 },
  takeDamage(amount) { meleeDamage = amount; return true; },
};
const melee = Object.create(WeaponSystem.prototype);
melee.currentId = 'm9';
melee.state = { id: 'm9', mag: 0, reserve: 0 };
melee.fireCooldown = 0;
melee.player = { getAimRay() { return { origin: new THREE.Vector3(0, 1.7, 0), direction: new THREE.Vector3(0, 0, -1) }; } };
melee.map = { raycastDetailed() { return { t: Infinity, normal: null }; } };
melee.hud = {
  crosshairFire() {}, hitMarker() {}, worldToScreen() { return { x: 0, y: 0 }; },
  showDamageNumber() {}, killFeed() {},
};
melee.audio = { melee() { meleeAudio++; }, hit() {} };
melee._hitscan = () => ({
  enemy: meleeEnemy, part: 'torso', t: 1,
  point: new THREE.Vector3(0, 1, -1), normal: new THREE.Vector3(0, 0, 1),
});
melee._spawnHitSpark = () => {};
melee.onEnemyKilled = event => { meleeKill = event; };
WeaponSystem.prototype._fire.call(melee);
ok(meleeDamage === weapons.m9.damage && melee.state.mag === 0 && melee._meleeSwing === 1,
  'M9 命中使用近战伤害、启动挥砍动画且不消耗弹药');
ok(meleeAudio === 1 && meleeKill && meleeKill.weaponId === 'm9' && meleeKill.headshot === false,
  'M9 击杀通过统一事件进入计分与勋章链');

console.log('--- D. M26 投掷、遮挡、衰减与击杀链 ---');
const grenadeView = window.GrenadeModel.build(null, new THREE.MeshBasicMaterial());
const throwScene = new THREE.Scene();
let throwSound = 0;
const thrower = Object.create(WeaponSystem.prototype);
thrower.currentId = 'grenade';
thrower.state = { id: 'grenade', mag: 2, reserve: 0 };
thrower.fireCooldown = 0;
thrower._grenades = [];
thrower._viewGuns = { grenade: { userData: { projectileGeometry: grenadeView.geometry, projectileMaterial: grenadeView.material } } };
thrower.scene = throwScene;
thrower.player = { getAimRay() { return { origin: new THREE.Vector3(0, 1.7, 0), direction: new THREE.Vector3(0, 0, -1) }; } };
thrower.hud = { updateWeapon() {} };
thrower.audio = { grenadeThrow() { throwSound++; } };
WeaponSystem.prototype._fire.call(thrower);
ok(thrower.state.mag === 1 && thrower._grenades.length === 1 && thrower._throwAnim === 1 && throwSound === 1,
  '投掷 M26 消耗一枚并生成带速度、引信和投掷动画的世界物体');

const damageByName = {};
function target(name, x, z, killed) {
  return {
    name, tier: 0, alive: true, position: { x, y: 0, z },
    takeDamage(amount) { damageByName[name] = amount; return killed; },
  };
}
const near = target('近处目标', 1, 0, true);
const far = target('远处目标', 5.5, 0, false);
const blocked = target('墙后目标', 0, 3, false);
const blastScene = new THREE.Scene();
const blastMesh = new THREE.Mesh(grenadeView.geometry, grenadeView.material);
blastMesh.position.set(0, 0.11, 0);
blastScene.add(blastMesh);
let explosionSound = 0;
const blastKills = [];
const blast = Object.create(WeaponSystem.prototype);
blast.scene = blastScene;
blast._grenades = [{ mesh: blastMesh }];
blast._explosionPool = [];
blast._explosions = [];
blast.enemies = [near, far, blocked];
blast.map = {
  raycastDetailed(origin, direction, distance) {
    return { t: direction.z > 0.5 ? 0.5 : distance, normal: null };
  },
};
blast.hud = {
  hitMarker() {}, worldToScreen() { return { x: 0, y: 0 }; }, showDamageNumber() {}, killFeed() {},
};
blast.camera = {};
blast.audio = { explosion() { explosionSound++; } };
blast.onEnemyKilled = event => blastKills.push(event);
WeaponSystem.prototype._explodeGrenade.call(blast, 0, { mesh: blastMesh, weapon: weapons.grenade });
ok(damageByName['近处目标'] > damageByName['远处目标'] && !('墙后目标' in damageByName),
  'M26 伤害随距离衰减且墙后敌人不受伤', JSON.stringify(damageByName));
ok(explosionSound === 1 && blastKills.length === 1 && blastKills[0].weaponId === 'grenade' && blastKills[0].headshot === false,
  'M26 爆炸只播放一次声音并通过统一击杀事件计分');
ok(/moveCircle\([\s\S]*vertical/.test(fs.readFileSync(path.join(root, 'weapon.js'), 'utf8')) &&
  /_updateGrenades\(dt\)/.test(fs.readFileSync(path.join(root, 'weapon.js'), 'utf8')),
  'M26 飞行按小步长复用地图连续圆形碰撞并保留垂直高度');

console.log('--- E. 手榴弹补给包与敌人掉落 ---');
ok(CONFIG.pickup.grenadeAmount === 1 && Array.isArray(CONFIG.pickup.grenadeSpawns) && CONFIG.pickup.grenadeSpawns.length === 2,
  '手榴弹专用固定补给包配置为两处、每次补一枚');
ok(CONFIG.enemy.grenadeDropChance === 0.15,
  '敌人死亡手榴弹掉落概率独立配置为 15%');

const grenadier = Object.create(WeaponSystem.prototype);
grenadier.currentId = 'grenade';
grenadier.state = { id: 'grenade', mag: 0, reserve: 0 };
grenadier.hud = { updateWeapon() {} };
let refill = grenadier.addGrenades(3);
ok(refill.added && refill.amount === 2 && grenadier.state.mag === 2,
  '当前手榴弹库存可补满但不超过 2 枚');
refill = grenadier.addGrenades(1);
ok(!refill.added && grenadier.state.mag === 2,
  '手榴弹满库存时专用补给包不消耗');

const stashed = Object.create(WeaponSystem.prototype);
stashed.currentId = 'usp';
stashed.state = { id: 'usp', mag: 20, reserve: 120 };
stashed._stash = { grenade: { id: 'grenade', mag: 0, reserve: 0 } };
refill = stashed.addGrenades(1);
ok(refill.added && refill.amount === 1 && stashed._stash.grenade.mag === 1,
  '已暂存的手榴弹状态可被补给包恢复');
const untouched = Object.create(WeaponSystem.prototype);
untouched.currentId = 'usp';
untouched.state = { id: 'usp', mag: 20, reserve: 120 };
untouched._stash = {};
refill = untouched.addGrenades(1);
ok(!refill.added && refill.amount === 0,
  '从未切换过手榴弹时视为初始满库存，不错误消耗补给');

const pickupScene = new THREE.Scene();
const pickupSystem = Object.create(window.PickupSystem.prototype);
pickupSystem.scene = pickupScene;
pickupSystem.gameMap = { findNearestFree(x, z) { return new THREE.Vector3(x, 0, z); } };
pickupSystem.pickups = [];
pickupSystem.addDynamic = function addDynamic(pk) { this.pickups.push(pk); };
const bundle = pickupSystem.dropBundle({ x: 0, z: 0 }, ['ammo', 'health', 'armor', 'grenade']);
const bundleSeparated = bundle.every((pk, index) => bundle.every((other, otherIndex) => {
  if (index === otherIndex) return true;
  return Math.hypot(pk.pos.x - other.pos.x, pk.pos.z - other.pos.z) >= 0.72 - 1e-6;
}));
ok(bundle.length === 4 && bundleSeparated && bundle.some(pk => pk.type === 'grenade'),
  '爆头四件套（含手榴弹）使用错开位置且不重叠');

const fixedSystem = Object.create(window.PickupSystem.prototype);
fixedSystem.scene = new THREE.Scene();
fixedSystem.gameMap = { findNearestFree(x, z) { return new THREE.Vector3(x, 0, z); } };
fixedSystem.pickups = [];
fixedSystem._buildFixedPickups();
const fixedGrenades = fixedSystem.pickups.filter(pk => pk.type === 'grenade');
ok(fixedGrenades.length === 2 && fixedGrenades.every(pk => pk.respawnTime === CONFIG.pickup.respawnTime),
  '固定手榴弹补给包可构建并进入补给系统');
const fixedProbe = fixedGrenades[0];
let grantedGrenades = 0;
let grenadeToast = '';
fixedProbe.update(0.016, { position: { x: fixedProbe.pos.x, z: fixedProbe.pos.z } },
  { toast(message) { grenadeToast = message; } }, { heal() {} }, {
    addGrenades(amount) {
      grantedGrenades += amount;
      return { added: true, amount };
    },
  });
ok(!fixedProbe.active && grantedGrenades === 1 && grenadeToast === '手榴弹 +1',
  '玩家耗尽后走专用补给包拾取链恢复一枚手榴弹');
fixedSystem.dropBundle({ x: 3, z: 3 }, ['grenade']);
fixedSystem.reset();
ok(fixedSystem.pickups.filter(pk => pk.type === 'grenade').length === 2,
  '新局重置会清理动态手榴弹掉落并保留固定补给');

const dropEnemy = Object.create(Enemy.prototype);
dropEnemy.alive = false;
dropEnemy.position = new THREE.Vector3(1, 0, 1);
dropEnemy._barSprite = { visible: true };
dropEnemy._rigInstance = { triggerDeath() {} };
let deathTypes = null;
dropEnemy.pickups = { dropBundle(_pos, types) { deathTypes = types.slice(); } };
const savedRandom = Math.random;
try {
  Math.random = () => 0;
  Enemy.prototype._die.call(dropEnemy, 'head');
} finally {
  Math.random = savedRandom;
}
ok(deathTypes && deathTypes.join(',') === 'ammo,health,armor,grenade',
  '爆头三件套保留，并可独立追加手榴弹掉落');

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
