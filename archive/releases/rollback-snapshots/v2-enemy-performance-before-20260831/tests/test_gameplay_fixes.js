// 本轮玩法修复回归：箱顶落地、敌人安全出生/脱困、有限弹药/取弹/换弹、伤害范围。
'use strict';

const THREE = require('../three.min.js');
global.THREE = THREE;
global.window = {};
require('../config.js');
global.CONFIG = window.CONFIG;
global.clamp = window.clamp;
global.lerp = window.lerp;
require('../map.js');
require('../player.js');
require('../enemy.js');
require('../pickup.js');

const Box = window.Box;
const GameMap = window.GameMap;
const Player = window.Player;
const Enemy = window.Enemy;
const PickupSystem = window.PickupSystem;
let passed = 0;
let failed = 0;

function ok(condition, name, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}${detail ? `  (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`);
  }
}

function makeMap(boxes) {
  const map = Object.create(GameMap.prototype);
  map.boxes = boxes;
  map.bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  map._buildCollisionGrid();
  return map;
}

function makePlayer(map) {
  const player = Object.create(Player.prototype);
  player.alive = true;
  player.yaw = 0;
  player.pitch = 0;
  player.sensitivityScale = 1;
  player.aimSensitivityMul = 1;
  player.keys = {};
  player.moveTouch = { x: 0, y: 0 };
  player.proneToggle = false;
  player.crouchToggle = false;
  player._proneAmt = 0;
  player._crouchAmt = 0;
  player.weaponSpeedMul = 1;
  player.onGround = false;
  player.velocity = new THREE.Vector3();
  player.position = new THREE.Vector3();
  player.map = map;
  player._jumpRequested = false;
  player.viewBob = 0;
  player.viewBobAmount = 0;
  player.recoilOffset = 0;
  player.recoilRecover = 0.06;
  player._syncCamera = () => {};
  return player;
}

console.log('--- A. 3D 碰撞层：箱顶支撑与内部出生点解算 ---');
{
  const crateMap = makeMap([new Box(-1, 1, -2, -1, 0, 1.2)]);
  const falling = makePlayer(crateMap);
  falling.position.set(0, 2, -1.5);
  falling.velocity.y = -8;
  falling.update(0.1);
  ok(Math.abs(falling.position.y - 1.2) < 1e-6 && falling.onGround && falling.velocity.y === 0,
    '玩家下落穿过箱顶时落在箱顶，不回到地面', `y=${falling.position.y}`);

  const onCrate = makePlayer(crateMap);
  onCrate.onGround = true;
  onCrate.position.set(0, 1.2, -1.5);
  onCrate.moveTouch.x = 1;
  onCrate.update(0.1);
  ok(onCrate.position.x > 0 && Math.abs(onCrate.position.y - 1.2) < 1e-6,
    '站在箱顶仍可沿箱面移动，不被自己的箱体侧碰撞锁死', `x=${onCrate.position.x}, y=${onCrate.position.y}`);

  const blockedMap = makeMap([new Box(-1, 1, -1, 1, 0, 4)]);
  const safe = blockedMap.findNearestFree(0, 0, 0.4, 4);
  ok(!!safe && blockedMap.isCircleFree(safe.x, safe.z, 0.4),
    '从建筑内部出生点找到最近合法位置', safe && `${safe.x.toFixed(2)},${safe.z.toFixed(2)}`);

  const portMap = Object.create(GameMap.prototype);
  const segment = { x1: 0, z1: -2, x2: 0, z2: 2, minY: 0, maxY: 2, _segmentStamp: 0 };
  portMap._segmentCandidates = () => [segment];
  const exact = portMap._resolvePortSegments(0, 0, 0.4);
  ok(Number.isFinite(exact.x) && Number.isFinite(exact.z) && Math.hypot(exact.x, exact.z) >= 0.4,
    '港口敌人圆心恰在线段上时沿法向推出，不会反向拉进墙体', `${exact.x.toFixed(3)},${exact.z.toFixed(3)}`);

  const deepPortMap = Object.create(GameMap.prototype);
  deepPortMap.isContainerPort = true;
  deepPortMap.bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  deepPortMap.boxes = [];
  deepPortMap._portCollisionSegments = [];
  deepPortMap._portWalkBoxes = [new Box(-2, 2, -2, 2, 0, 3)];
  deepPortMap._buildCollisionGrid();
  ok(!deepPortMap.isCircleFree(0, 0, 0.4),
    '港口圆心完全进入大型实体深处时不会因远离墙线而误判为合法');
  ok(deepPortMap.isCircleFree(1.8, 1.8, 0.2),
    '港口派生盒外缘不参与普通阻挡，避免重新制造 AABB 空气墙');
  const deepSafe = deepPortMap.findNearestFree(0, 0, 0.4, 5);
  ok(!!deepSafe && deepPortMap.isCircleFree(deepSafe.x, deepSafe.z, 0.4),
    '港口实体深处的敌人能搜索到最近合法位置', deepSafe && `${deepSafe.x.toFixed(2)},${deepSafe.z.toFixed(2)}`);
}

console.log('--- A2. 敌人卡墙恢复：只把已卡入实体移到安全位置 ---');
{
  const enemy = Object.create(Enemy.prototype);
  enemy.map = {
    isCircleFree: () => false,
    findNearestFree: () => new THREE.Vector3(2, 0, 3),
  };
  enemy.position = new THREE.Vector3(0, 0, 0);
  enemy.radius = 0.4;
  enemy.velocity = new THREE.Vector3(1, 0, 1);
  enemy._lastPos = new THREE.Vector3();
  enemy._escapeTimer = 0;
  enemy._findEscapeDir = () => { throw new Error('卡墙恢复不应在已有安全点时继续采样逃生方向'); };
  enemy._recoverFromStuck();
  ok(enemy.position.x === 2 && enemy.position.z === 3 && enemy.velocity.x === 0 && enemy.velocity.z === 0,
    '敌人卡入建筑后移到最近安全点并清除水平速度', `pos=${enemy.position.x},${enemy.position.z}`);
}

console.log('--- A3. 敌人完全重合：确定性分离且不穿入墙体 ---');
{
  const freeMap = {
    moveCircle: (sx, sz, ex, ez) => ({ x: ex, z: ez }),
    collide: (x, z) => ({ x, z }),
    isCircleFree: () => true,
  };
  const a = Object.create(Enemy.prototype);
  const b = Object.create(Enemy.prototype);
  for (const enemy of [a, b]) {
    enemy.alive = true;
    enemy.radius = 0.4;
    enemy.position = new THREE.Vector3(0, 0, 0);
    enemy._lastValidPos = new THREE.Vector3();
    enemy._avoidTimer = 0;
    enemy.map = freeMap;
  }
  a.enemies = b.enemies = [a, b];
  a._avoidAI(0.1);
  b._avoidAI(0.1);
  ok(Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z) > 0.1,
    '两个完全同坐标的敌人会沿成对相反方向分离');
}

console.log('--- B. 敌人弹药经济：有限弹匣、换弹读条与主动取弹 ---');
{
  const enemy = Object.create(Enemy.prototype);
  enemy.position = new THREE.Vector3(0, 0, 0);
  enemy.radius = 0.4;
  enemy.map = { raycast: () => 99 };
  enemy.player = {
    getEye: () => new THREE.Vector3(0, 1.6, -5),
    takeDamage() {},
  };
  enemy.hud = { audio: { enemyShot3D() {} } };
  enemy._canHitPlayer = () => false;
  enemy.hitChanceAdd = 0;
  enemy.damageAdd = 0;
  enemy.magazineSize = 2;
  enemy.magazine = 1;
  enemy.reserveMax = 4;
  enemy.reserve = 4;
  enemy.reloadTimer = 0;
  enemy.burstLeft = 3;
  const fired = enemy._shootOnce(1);
  ok(fired && enemy.magazine === 0 && enemy.reloadTimer > 0,
    '最后一发会消耗弹匣并开始换弹读条', `mag=${enemy.magazine}, reload=${enemy.reloadTimer}`);
  ok(enemy._shootOnce(1) === false,
    '换弹读条期间不会立即再次射击');
  enemy._updateAmmo(CONFIG.enemy.ammo.reloadTime);
  ok(enemy.magazine === 2 && enemy.reserve === 2 && enemy.reloadTimer === 0,
    '换弹完成后从备弹补满弹匣', `mag=${enemy.magazine}, reserve=${enemy.reserve}`);
  ok(enemy.reloadRecoverTimer > 0 && enemy._shootOnce(1) === false,
    '装填完成后仍保留明确举枪恢复间隙', `recover=${enemy.reloadRecoverTimer}`);
  enemy._updateAmmo(CONFIG.enemy.ammo.postReloadDelay);
  ok(enemy.reloadRecoverTimer === 0 && enemy._shootOnce(1) === true,
    '举枪恢复结束后才允许重新开火');

  let taken = false;
  const pickup = {
    type: 'ammo',
    active: true,
    pos: { x: 0.5, z: 0 },
    consume() { taken = true; this.active = false; return true; },
  };
  const pickups = {
    findNearestActive: () => pickup,
    collectAmmoForEnemy(target, item) {
      if (!item.active) return false;
      target.reserve = Math.min(target.reserveMax, target.reserve + CONFIG.enemy.ammo.pickupAmount);
      item.consume();
      return true;
    },
  };
  enemy.pickups = pickups;
  enemy.magazine = 0;
  enemy.reserve = 0;
  enemy.reserveMax = 54;
  enemy.reloadTimer = 0;
  enemy._ammoSearchTimer = 0;
  enemy._ammoTarget = null;
  enemy._ammoPickupCooldown = 0;
  const sought = enemy._seekAmmo(0.1);
  ok(sought && taken && enemy.reserve === CONFIG.enemy.ammo.pickupAmount && enemy.reloadTimer > 0,
    '无弹时敌人会靠近并消耗地图弹药包，再进入换弹读条', `reserve=${enemy.reserve}, reload=${enemy.reloadTimer}`);
}

console.log('--- C. 敌方伤害设置：普通命中落在配置上下限 ---');
{
  const enemy = Object.create(Enemy.prototype);
  enemy.position = new THREE.Vector3(0, 0, 0);
  enemy.player = { takeDamage(value) { this.damage = value; } };
  enemy.hud = { audio: { enemyShot3D() {} } };
  enemy._canHitPlayer = () => true;
  enemy.hitChanceAdd = 0;
  enemy.damageAdd = 0;
  enemy.magazineSize = 10;
  enemy.magazine = 10;
  enemy.reserveMax = 10;
  enemy.reserve = 10;
  enemy.reloadTimer = 0;
  const savedRandom = Math.random;
  try {
    const minRolls = [0, 0.5, 0];
    Math.random = () => minRolls.shift() ?? 0;
    enemy._shootOnce(1);
    const minDamage = enemy.player.damage;
    const maxRolls = [0, 0.5, 0.999999];
    Math.random = () => maxRolls.shift() ?? 0;
    enemy.magazine = 10;
    enemy._shootOnce(1);
    const maxDamage = enemy.player.damage;
    ok(minDamage === CONFIG.enemy.damageMin && maxDamage <= CONFIG.enemy.damageMax && maxDamage > minDamage,
      '普通射击伤害使用设置的最低/最高范围', `min=${minDamage}, max=${maxDamage}`);
  } finally {
    Math.random = savedRandom;
  }
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
