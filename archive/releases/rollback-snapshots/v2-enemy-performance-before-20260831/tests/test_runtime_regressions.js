// 运行时回归测试：击杀提示参数、蹲伏射线起点、切枪散布状态
// 运行：node tests/test_runtime_regressions.js
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0;
let fail = 0;
function ok(condition, name, extra) {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}${extra ? `  (${extra})` : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? `  (${extra})` : ''}`);
  }
}

global.window = { addEventListener() {} };
global.document = { getElementById() { return null; } };
global.performance = { now: () => 0 };
const THREE = require('../three.min.js');
global.THREE = THREE;
require('../config.js');
global.CONFIG = global.window.CONFIG;
global.clamp = global.window.clamp;
global.lerp = global.window.lerp;
require('../player.js');
require('../weapon.js');
require('../hud.js');
const WeaponSystem = global.window.WeaponSystem;

console.log('--- A. actual weapon kill path forwards weapon and headshot ---');
const HUD = global.window.HUD;
global.HUD = HUD;
let killArgs = null;
HUD.prototype.killFeed = function (...args) { killArgs = args; };
require('../main.js');
const killEvents = [];
const killHud = {
  killFeed: HUD.prototype.killFeed,
  updateWeapon() {},
  crosshairFire() {},
  hitMarker() {},
  worldToScreen() { return { x: 0, y: 0 }; },
  showDamageNumber() {},
};
const firingWeapon = Object.create(WeaponSystem.prototype);
firingWeapon.currentId = 'ak47';
firingWeapon.state = { id: 'ak47', mag: 30, reserve: 80 };
firingWeapon.fireCooldown = 0;
firingWeapon.reloadTimer = 0;
firingWeapon.firing = true;
firingWeapon._spreadCurrent = 0;
firingWeapon.player = {
  velocity: new THREE.Vector3(),
  getAimRay() {
    return { origin: new THREE.Vector3(0, 1.7, 0), direction: new THREE.Vector3(0, 0, -1) };
  },
  applyRecoil() {},
};
firingWeapon.camera = { quaternion: new THREE.Quaternion() };
firingWeapon.hud = killHud;
firingWeapon.map = { raycastDetailed() { return { t: Infinity }; } };
firingWeapon.audio = { hit() {}, shot() {} };
firingWeapon._hitscan = () => ({
  enemy: { name: '敌人-1', takeDamage() { return true; } },
  part: 'head',
  t: 5,
  point: new THREE.Vector3(0, 1, -5),
  normal: new THREE.Vector3(0, 1, 0),
});
firingWeapon._damageForPart = () => 42;
firingWeapon._spawnTracer = () => {};
firingWeapon._spawnMuzzleFlash = () => {};
firingWeapon._spawnShell = () => {};
firingWeapon._spawnHitSpark = () => {};
firingWeapon.onEnemyKilled = (event) => killEvents.push(event);
WeaponSystem.prototype._fire.call(firingWeapon);
ok(JSON.stringify(killArgs) === JSON.stringify(['敌人-1', 'AK-47', true]), '真实射击击杀路径保留名称、武器名和爆头标识', JSON.stringify(killArgs));
ok(killEvents.length === 1 && killEvents[0].enemyName === '敌人-1' &&
  killEvents[0].weaponId === 'ak47' && killEvents[0].weaponName === 'AK-47' && killEvents[0].headshot === true,
  '真实击杀路径只发出一次结构化权威事件', `count=${killEvents.length}`);

console.log('--- B. crouched aim ray uses the rendered eye height ---');
const Player = global.window.Player;
const playerSource = fs.readFileSync(path.join(__dirname, '..', 'player.js'), 'utf8');
const player = Object.create(Player.prototype);
player.position = new THREE.Vector3(3, 2, 4);
player.pitch = 0;
player.yaw = 0;
player._crouchAmt = 1;
const expectedEye = CONFIG.player.height - CONFIG.player.crouchDrop;
const aimRay = player.getAimRay();
ok(Math.abs(aimRay.origin.y - (player.position.y + expectedEye)) < 1e-9, '蹲伏射线起点与蹲伏眼高一致', `y=${aimRay.origin.y}`);
player._crouchAmt = 0;
const standingRay = player.getAimRay();
ok(Math.abs(standingRay.origin.y - (player.position.y + CONFIG.player.height)) < 1e-9, '站立射线起点保持原眼高', `y=${standingRay.origin.y}`);
player._proneAmt = 1;
const proneRay = player.getAimRay();
const expectedProneEye = CONFIG.player.height - CONFIG.player.proneDrop;
ok(Math.abs(proneRay.origin.y - (player.position.y + expectedProneEye)) < 1e-9,
  '卧姿射线起点降到卧姿眼高，射击仍使用当前姿态');
player.alive = true;
player.crouchToggle = true;
player.proneToggle = false;
const enteredProne = Player.prototype.toggleProne.call(player);
ok(enteredProne && player.proneToggle && !player.crouchToggle &&
  /proneSpeed/.test(fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8')),
  '卧倒按钮状态会取消蹲伏并使用较低匍匐速度');
const standResult = Player.prototype.requestJump.call(player);
const jumpResult = Player.prototype.requestJump.call(player);
ok(standResult === 'stand' && !player.proneToggle && jumpResult === 'jump' && player._jumpRequested === true &&
  /const jumpRequested = this\._jumpRequested/.test(playerSource) && /this\._jumpRequested = false/.test(playerSource),
  '卧倒后第一次点跳只起身，再次点跳才进入跳跃队列');
player._jumpRequested = false;

console.log('--- C. switching weapons clears accumulated spread ---');
const weapons = Object.create(WeaponSystem.prototype);
weapons.currentId = 'ak47';
weapons.state = { id: 'ak47', mag: 10, reserve: 80 };
weapons._stash = {};
weapons._spreadCurrent = 0.42;
weapons._viewGuns = null;
weapons._semiPending = false;
weapons.fireCooldown = 0;
weapons.switching = false;
weapons.firing = false;
weapons.audio = null;
weapons.player = null;
weapons.hud = { updateWeapon() {}, toast() {} };
weapons.camera = null;
weapons.switchTo('usp');
ok(weapons._spreadCurrent === 0, '切枪后清除上一把武器的累积散布', `spread=${weapons._spreadCurrent}`);

const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const weaponSource = fs.readFileSync(path.join(__dirname, '..', 'weapon.js'), 'utf8');
const hudSource = fs.readFileSync(path.join(__dirname, '..', 'hud.js'), 'utf8');
  const cssSource = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
ok(/this\.weapons\.onEnemyKilled\s*=\s*\(event\)\s*=>\s*this\._recordPlayerKill\(event\)/.test(source) &&
  /this\.medalSystem\.recordKill\(event\)/.test(source) && !/origKillFeed/.test(source),
  '主流程以权威击杀事件累计生涯击杀，不再包装 HUD 击杀提示');
ok(/this\.medalShare\.bind\(\(\)\s*=>\s*\{[\s\S]*?this\.medalUI\.openCenter\(\)/.test(source) &&
  /_openMedalShare\(medal\)\s*\{[\s\S]*?this\.medalUI\.closeCenter\(\)/.test(source),
  '分享卡打开时隐藏勋章中心，返回时恢复，避免双 dialog 同时可见');
ok(/clearTimeout\(this\._hitMarkerTimer\)/.test(hudSource) &&
  /setTimeout\(\(\) => \{[\s\S]*?remove\('show', 'head', 'kill'\)/.test(hudSource) &&
  /hmPop 0\.18s ease-out forwards/.test(cssSource) && /hmKill 0\.3s ease-out forwards/.test(cssSource),
  '命中 X 只作为短暂反馈，动画结束后不会残留在准星中心');

console.log('--- D. recoil direction and scope cleanup ---');
const recoilPlayer = Object.create(Player.prototype);
recoilPlayer.pitch = 0;
recoilPlayer.yaw = 0;
recoilPlayer.recoilOffset = 0;
recoilPlayer.applyRecoil({ x: 0.1, y: 0, recover: 0.5, pattern: 'heavy' });
recoilPlayer.position = new THREE.Vector3();
recoilPlayer._proneAmt = 0;
recoilPlayer._crouchAmt = 0;
const recoilRay = recoilPlayer.getAimRay();
ok(recoilPlayer.pitch === 0 && recoilPlayer.recoilOffset === 0.1 && recoilRay.direction.y > 0 &&
  !/this\.pitch -= recover/.test(playerSource) && /pitch \+ this\.recoilOffset/.test(playerSource) &&
  /pattern: w\.recoilPattern/.test(weaponSource),
  '射击后独立后坐偏移使枪口上抬，恢复不再扣玩家基础视角',
  `pitch=${recoilPlayer.pitch}, recoil=${recoilPlayer.recoilOffset}`);

const scopeState = Object.create(WeaponSystem.prototype);
scopeState.currentId = 'awp';
scopeState._scopeZoomed = true;
scopeState.camera = { fov: 35, updateProjectionMatrix() {} };
scopeState.player = { aimSensitivityMul: 0.72 };
scopeState.clearScopeZoom(true);
  ok(scopeState._scopeZoomed === false && scopeState._fovTarget === CONFIG.fov &&
    scopeState.camera.fov === CONFIG.fov && scopeState.player.aimSensitivityMul === 1,
    '死亡/切枪共用关镜清理，FOV 与开镜灵敏度复位');

  const idlePlayer = Object.create(Player.prototype);
  idlePlayer.alive = true;
  idlePlayer.yaw = 0;
  idlePlayer.pitch = 0;
  idlePlayer.keys = {};
  idlePlayer.moveTouch = { x: 0, y: 0 };
  idlePlayer.proneToggle = false;
  idlePlayer.crouchToggle = false;
  idlePlayer._proneAmt = 0;
  idlePlayer._crouchAmt = 0;
  idlePlayer.weaponSpeedMul = 1;
  idlePlayer.onGround = true;
  idlePlayer.velocity = new THREE.Vector3();
  idlePlayer.position = new THREE.Vector3();
  idlePlayer.map = { moveCircle: (sx, sz, ex, ez) => ({ x: ex, z: ez }) };
  idlePlayer._jumpRequested = false;
  idlePlayer.viewBob = 1.234;
  idlePlayer.viewBobAmount = 1;
  idlePlayer.recoilOffset = 0;
  idlePlayer._syncCamera = () => {};
  for (let frame = 0; frame < 60; frame++) idlePlayer.update(1 / 60);
  ok(Math.abs(idlePlayer.viewBob - 1.234) < 1e-12 && idlePlayer.viewBobAmount < 1e-4,
    '静止一秒时步态相位冻结且仅衰减晃动幅度，枪口不会继续自动下移',
    `phase=${idlePlayer.viewBob}, amount=${idlePlayer.viewBobAmount}`);

  const idleViewModel = Object.create(WeaponSystem.prototype);
  idleViewModel.currentId = 'usp';
  idleViewModel._viewGuns = {
    usp: { visible: false, userData: {} },
    ak47: { visible: false, userData: {} },
    awp: { visible: false, userData: {} },
  };
  idleViewModel._viewGroup = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, z: 0 },
  };
  idleViewModel._viewRecoil = 0;
  idleViewModel._viewYawDir = 1;
  idleViewModel.reloadTimer = 0;
  idleViewModel.player = {
    viewBob: idlePlayer.viewBob,
    viewBobAmount: idlePlayer.viewBobAmount,
    _crouchAmt: 0,
    getProneAmount: () => 0,
  };
  idleViewModel._updateSwitchAnim = () => ({ y: 0, r: 0 });
  for (let frame = 0; frame < 60; frame++) idleViewModel._updateViewModel(1 / 60);
  ok(Math.abs(idleViewModel._viewGroup.position.x) < 1e-12 &&
    Math.abs(idleViewModel._viewGroup.position.y) < 1e-12 &&
    Math.abs(idleViewModel._viewGroup.position.z) < 1e-12 &&
    Math.abs(idleViewModel._viewGroup.rotation.x) < 1e-12 &&
    Math.abs(idleViewModel._viewGroup.rotation.z) < 1e-12,
    '无移动、无射击、无换弹时枪模连续 60 帧保持中立姿态');

  ok(/btn\.id === 'btnJump'/.test(source) && /this\.player\.requestJump\(\)/.test(source),
    '移动端跳跃按钮直接提交离散跳跃请求，不依赖持续按键');

  console.log('--- E. map selection lock and death unlock ---');
  const mapSelectionSandbox = {
    console,
    performance: { now: () => 0 },
    window: { addEventListener() {} },
    document: {},
    CONFIG,
    HUD: function HUD() {},
  };
  mapSelectionSandbox.HUD.prototype.killFeed = function () {};
  let constructedMapId = null;
  mapSelectionSandbox.GameMap = function FakeMap(scene, opts) {
    constructedMapId = opts.mapId;
    this.mapId = opts.mapId;
    this.dispose = () => {};
  };
  vm.createContext(mapSelectionSandbox);
  vm.runInContext(source, mapSelectionSandbox, { filename: 'main.js' });
  const MapGame = vm.runInContext('Game', mapSelectionSandbox);
  const mapGame = Object.create(MapGame.prototype);
  mapGame.state = 'menu';
  mapGame.mapId = 'container-port';
  mapGame.selectedMapId = 'container-port';
  mapGame._mapSelectionLocked = false;
  mapGame.scene = {};
  mapGame.forge = null;
  mapGame.gameMap = { mapId: 'container-port', dispose() {} };
  mapGame.enemies = [];
  mapGame.player = { map: mapGame.gameMap };
  mapGame.weapons = { map: mapGame.gameMap };
  mapGame.pickups = { setMap(map) { this.map = map; } };
  mapGame.hud = { setMinimapRefs() {}, toast(message) { this.lastToast = message; } };
  mapGame._syncMapPickers = () => {};
  const changedMap = mapGame._selectMap('classic');
  ok(changedMap && constructedMapId === null && mapGame.mapId === 'container-port' &&
    mapGame.selectedMapId === 'classic' && mapGame.player.map.mapId === 'container-port' &&
    mapGame.weapons.map.mapId === 'container-port',
    '未开局选择地图只更新选择，模型构建延迟到点击开始后的加载层');
  mapGame._mapSelectionLocked = true;
  const lockedMapId = mapGame.selectedMapId;
  const blockedMap = mapGame._selectMap('container-port');
  ok(blockedMap === false && mapGame.selectedMapId === lockedMapId,
    '回合进行中地图选择被锁定，不能切换到另一张地图');

  ok(/choices:\s*\[/.test(fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8')) &&
    /menuMapOptions/.test(index) && /settingsMapOptions/.test(index) &&
    /_mapSelectionLocked = true/.test(source) && /_mapSelectionLocked = !!win/.test(source) &&
    /选择地图并重新开始/.test(source) && /_ensureRuntime\(requestedMapId\)/.test(source) &&
    /dispose\(\)/.test(fs.readFileSync(path.join(__dirname, '..', 'map.js'), 'utf8')),
    '地图选择器、延迟构建、回合锁定、死亡解锁和旧地图释放均已接入');

  const restartButton = { textContent: '' };
  mapSelectionSandbox.document.getElementById = (id) => id === 'restartBtn' ? restartButton : null;
  mapGame.hud = { hideClickHint() {}, showResult() {} };
  mapGame.audio = { win() {}, lose() {} };
  mapGame.weapons = { clearScopeZoom() {} };
  mapGame._stopTouchActions = () => {};
  mapGame.startTime = 0;
  mapGame.wave = 1;
  mapGame.totalWaves = 1;
  mapGame.totalKills = 0;
  mapGame.medalSystem = { snapshot: () => ({ careerKills: 0 }) };
  mapGame.medalUI = { setResult() {} };
  mapGame._runUnlockedMedalIds = [];
  mapGame.state = 'playing';
  mapGame._mapSelectionLocked = true;
  mapGame._endRun(false);
  const deathUnlocksMap = mapGame.state === 'over' && mapGame._mapSelectionLocked === false &&
    restartButton.textContent === '选择地图并重新开始';
  mapGame.state = 'playing';
  mapGame._mapSelectionLocked = true;
  mapGame._endRun(true);
  const victoryKeepsMap = mapGame.state === 'over' && mapGame._mapSelectionLocked === true &&
    restartButton.textContent === '再来一局';
  ok(deathUnlocksMap && victoryKeepsMap, '死亡解锁地图选择，胜利重开继续锁定当前地图');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
