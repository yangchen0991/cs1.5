// QA 独立行为测试：Enemy._canSeePlayer / _avoidAI / AudioFX.enemyShot3D / GameMap.boxSegments
// 运行：node tests/test_behaviors.js
// 方法：加载真实业务文件（window shim + 全局镜像），用 Object.create 绕过构造器/DOM，注入 stub
'use strict';

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log(`  PASS  ${name}${extra ? '  (' + extra + ')' : ''}`); }
  else { fail++; console.log(`  FAIL  ${name}${extra ? '  (' + extra + ')' : ''}`); }
}

// ---- 加载业务文件（只读，不改源码）----
global.window = {};
const THREE = require('../three.min.js');
global.THREE = THREE;
require('../config.js');
global.CONFIG = global.window.CONFIG;
global.clamp = global.window.clamp;
global.lerp = global.window.lerp;
require('../math2d.js');
global.Math2D = global.window.Math2D;
require('../map.js');
require('../enemy.js');
require('../audio.js');
const Enemy = global.window.Enemy;
const GameMap = global.window.GameMap;
const Box = global.window.Box;
const AudioFX = global.window.AudioFX;

const approx = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

console.log('--- A. boxSegments：高墙过滤 + 掩体过滤 + 惰性缓存 ---');
const boxes = [
  new Box(-32, -31, -20, 20, 0, 5),     // 高墙 maxY=5 → 应包含（4 条边）
  new Box(-2, 2, -2, 2, 0, 1.2),        // 掩体 maxY=1.2 < 1.55 → 应过滤
  new Box(5, 7, 5, 7, 0, 1.4),          // 掩体 maxY=1.4 < 1.55 → 应过滤
  new Box(10, 11, 10, 12, 0, 5),        // 高墙 → 应包含
];
const mapStub = { boxes, _segs: null };
GameMap.prototype.boxSegments.call(mapStub);
const segs = mapStub._segs;
ok(segs.length === 8, 'boxSegments 仅输出 2 面高墙 × 4 边 = 8 段', `got ${segs.length}`);
ok(segs.every(s => typeof s.p1.x === 'number' && typeof s.p2.z === 'number'), '每段 p1/p2 为 {x,z} 对象');
// 惰性缓存：改 boxes 后再次调用应返回同一引用
const segs2 = GameMap.prototype.boxSegments.call(mapStub);
ok(segs2 === segs, '惰性缓存：第二次调用返回同一数组');
// 高墙边正确性：西墙 minX=-32, maxX=-31, z∈[-20,20] → 4 条边端点
const xs = segs.flatMap(s => [s.p1.x, s.p2.x]);
const zs = segs.flatMap(s => [s.p1.z, s.p2.z]);
ok(xs.every(v => v === -32 || v === -31 || v === 10 || v === 11), '高墙 X 端点仅来自高墙');
ok(zs.every(v => v === -20 || v === 20 || v === 10 || v === 12), '高墙 Z 端点仅来自高墙');

console.log('--- B. _canSeePlayer：dist/FOV 保留 + fast LOS 日常感知 + ray 回退 ---');
function makeEnemy(over = {}) {
  const e = Object.create(Enemy.prototype);
  e.position = new THREE.Vector3(0, 0, 0);
  e.facing = 0;     // fwd=(-sin0,0,-cos0)=(0,0,-1) 朝 -Z；玩家在 -Z 前方
  e.player = { getEye: () => new THREE.Vector3(0, 1.6, -10) };
  e.map = {
    raycastCalls: 0,
    raycast(o, d, max) { this.raycastCalls++; return this.raycastRet !== undefined ? this.raycastRet : max; },
    fastLosCalls: 0,
    fastLosRet: true,
    hasFastLineOfSight(startX, startZ, endX, endZ, eyeY) {
      this.fastLosCalls++;
      this.fastLosArgs = [startX, startZ, endX, endZ, eyeY];
      return this.fastLosRet;
    },
    boxSegments() { return []; },   // 默认无墙段
  };
  Object.assign(e, over);
  return e;
}
// B1: seg 模式、无遮挡 → 日常感知走快速眼高线，不调权威 raycast
{
  const e = makeEnemy();
  ok(e._canSeePlayer() === true, 'B1 seg无遮挡 → 可见', 'dist=10<70, FOV 内');
  ok(e.map.fastLosCalls === 1 && e.map.raycastCalls === 0,
    'B1 seg无遮挡 → 只触发 hasFastLineOfSight，不触发 raycast',
    `fastLosCalls=${e.map.fastLosCalls}, raycastCalls=${e.map.raycastCalls}`);
}
// B2: seg 模式、快速线判定无遮挡 → 直接可见，不调用权威 raycast
{
  const e = makeEnemy();
  e.map.fastLosRet = true;
  const r = e._canSeePlayer();
  ok(r === true && e.map.fastLosCalls === 1 && e.map.raycastCalls === 0,
    'B2 seg快速 LOS 放行 → 不再调用权威 raycast');
}
// B3: seg 模式、快速线判定有遮挡 → 不可见，仍不调用权威 raycast
{
  const e = makeEnemy();
  e.map.fastLosRet = false;
  ok(e._canSeePlayer() === false && e.map.fastLosCalls === 1 && e.map.raycastCalls === 0,
    'B3 seg快速 LOS 拦截 → 不可见且不调用权威 raycast');
}
// B4: ray 模式（回退开关）→ 走原 raycast，不再走 seg
{
  const e = makeEnemy();
  e.map.boxSegments = () => { throw new Error('ray 模式不应调用 boxSegments'); };
  e.map.raycastRet = 10;
  const saved = CONFIG.ai.losMode;
  CONFIG.ai.losMode = 'ray';
  const r = e._canSeePlayer();
  CONFIG.ai.losMode = saved;
  ok(r === true && e.map.raycastCalls === 1, 'B4 losMode=ray → 原 raycast 逻辑', 'seg 分支跳过');
}
// B5: 超距离 → false（原 dist 检查保留）
{
  const e = makeEnemy();
  e.player = { getEye: () => new THREE.Vector3(0, 1.6, -100) };
  e.map.boxSegments = () => { throw new Error('超距不应调用'); };
  ok(e._canSeePlayer() === false, 'B5 dist>sightRange → false（原检查保留）');
}
// B6: FOV 外且 dist>6 → false（原 FOV 检查保留）：玩家在敌人正后方（+Z），facing=0 朝 -Z
{
  const e = makeEnemy();
  e.player = { getEye: () => new THREE.Vector3(0, 1.6, 10) };
  e.map.boxSegments = () => { throw new Error('FOV 外不应调用'); };
  ok(e._canSeePlayer() === false, 'B6 FOV 外且 dist>6 → false（原 FOV 检查保留）');
}
// B7: 快速 LOS 接口缺失 → 静默回退 ray 模式（防御）
{
  const e = makeEnemy();
  e.map.hasFastLineOfSight = undefined;
  e.map.raycastRet = 10;
  const r = e._canSeePlayer();
  ok(r === true && e.map.raycastCalls === 1 && e.map.fastLosCalls === 0,
    'B7 fast LOS 接口缺失 → 回退 ray 分支（不崩）');
}

console.log('--- B8. _canHitPlayer：敌人实际射击也必须经过墙体射线 ---');
{
  const e = makeEnemy();
  e.map.raycastDetailed = (origin, direction, max) => ({ t: max * 0.4 });
  ok(e._canHitPlayer() === false, 'B8 近墙命中 → 敌人子弹被墙拦截');
  e.map.raycastDetailed = (origin, direction, max) => ({ t: max });
  ok(e._canHitPlayer() === true, 'B8 射线到达目标 → 敌人子弹允许通过');
  e.hud = { audio: { enemyShot3D() {} } };
  e.hitChanceAdd = 0;
  e.damageAdd = 0;
  let damage = 0;
  e.player.takeDamage = () => { damage++; };
  const savedRandom = Math.random;
  Math.random = () => 0;
  e._canHitPlayer = () => false;
  e._shootOnce(1);
  const blockedDamage = damage === 0;
  e._canHitPlayer = () => true;
  e._shootOnce(1);
  Math.random = savedRandom;
  ok(blockedDamage && damage === 1, 'B8 _shootOnce 不会绕过射线直接造成穿墙伤害');
}

console.log('--- C0. _moveTowards：纯正面撞墙不得采用穿墙终点 ---');
{
  const e = Object.create(Enemy.prototype);
  e.position = new THREE.Vector3(-2, 0, 0);
  e.velocity = new THREE.Vector3();
  e.radius = 0.4;
  e.map = {
    moveCircle: () => ({ x: -1.4, z: 0 }),
    collide: () => ({ x: -1.4, z: 0 }),
  };
  e._moveTowards(new THREE.Vector3(1, 0, 0), 1, 4.6);
  ok(approx(e.position.x, -1.4) && approx(e.position.z, 0), '纯正面撞墙停在合法位置，不使用穿墙终点');
}
{
  const e = Object.create(Enemy.prototype);
  e.position = new THREE.Vector3(-2, 0, 0);
  e.velocity = new THREE.Vector3();
  e.radius = 0.4;
  e.map = {
    moveCircle: () => ({ x: 0, z: 0 }),
    collide: () => ({ x: 0, z: 0 }),
    isCircleFree: (x) => x < -1,
  };
  e._moveTowards(new THREE.Vector3(1, 0, 0), 1, 4);
  ok(approx(e.position.x, -2) && approx(e.velocity.x, 0),
    '移动解算结果仍在墙内时保留上一合法位置');
}

console.log('--- C1. 冲锋止步：到达安全射击距离后转为侧移后撤 ---');
{
  const e = Object.create(Enemy.prototype);
  e.canRush = true;
  e.canPush = true;
  e.canMelee = true;
  e.rushTime = 0.5;
  e.rushEvadeTime = 0;
  e.rushCooldown = 0;
  e.meleeCooldown = 0;
  e.reloadTimer = 0;
  e.reloadRecoverTimer = 0;
  e.magazineSize = 18;
  e.magazine = 18;
  e.reserveMax = 54;
  e.reserve = 54;
  e.fireCooldown = 99;
  e.burstLeft = 0;
  e.strafeDir = 1;
  e.strafeTimer = 1;
  e.speed = 4;
  e._tmpMove = new THREE.Vector3();
  e._tmpAux = new THREE.Vector3();
  e._seekAmmo = () => false;
  e._routeDirection = () => false;
  let movement = null;
  e._moveTowards = (dir, dt, speed) => { movement = { dir: dir.clone(), speed }; };
  e._engage(7, new THREE.Vector3(1, 0, 0), 0.1, true);
  ok(e.rushTime === 0 && e.rushEvadeTime > 0 && movement && movement.dir.x < 0 && Math.abs(movement.dir.z) > 0.5,
    '冲锋在7.5米安全距离前结束并进入侧移后撤', movement && `dir=${movement.dir.x.toFixed(2)},${movement.dir.z.toFixed(2)}`);
}

console.log('--- C. _avoidAI：只推自己 / 连续防穿墙 / 10Hz 节流 / null 防御 ---');
function makeAvoidEnemy(x, z, opts = {}) {
  const e = Object.create(Enemy.prototype);
  e.position = new THREE.Vector3(x, 0, z);
  e.radius = 0.4;
  e.map = { collide: (px, pz, r) => opts.collideRet || { x: px, z: pz } };
  e.enemies = opts.enemies || null;
  e.alive = true;
  return e;
}
// C1: 两敌相距 0.5 < 0.9 → 只推自己远离对方 0.2（(0.9-0.5)*0.5），对方不动
{
  const self = makeAvoidEnemy(0, 0);
  const other = { position: new THREE.Vector3(0.5, 0, 0), alive: true };
  self.enemies = [self, other];   // 生产语义：main.js 注入含自身的完整数组
  self._avoidAI(0.05);
  ok(approx(self.position.x, -0.2), 'C1 自己被推开 -0.2', `x=${self.position.x}`);
  ok(approx(other.position.x, 0.5), 'C1 对方位置不变（只推自己）');
}
// C2: 相距 2.0 ≥ 0.9 → 不推
{
  const self = makeAvoidEnemy(0, 0);
  self.enemies = [{ position: new THREE.Vector3(2, 0, 0), alive: true }];
  self._avoidAI(0.05);
  ok(approx(self.position.x, 0) && approx(self.position.z, 0), 'C2 远距不推');
}
// C3: 分离推力优先走完整轨迹，不能只检查可能已越过薄墙的终点
{
  let moveArgs = null;
  let collideCalls = 0;
  const self = makeAvoidEnemy(0, 0);
  self.map.collide = (px, pz, r) => { collideCalls++; return { x: px, z: pz }; };
  self.map.moveCircle = (sx, sz, ex, ez, radius) => {
    moveArgs = { sx, sz, ex, ez, radius };
    return { x: -0.1, z: 0 };
  };
  const other = { position: new THREE.Vector3(0.5, 0, 0), alive: true };
  self.enemies = [self, other];
  self._avoidAI(0.05);
  ok(moveArgs && approx(moveArgs.sx, 0) && approx(moveArgs.ex, -0.2) && approx(moveArgs.radius, 0.4) &&
    collideCalls === 0 && approx(self.position.x, -0.1),
    'C3 分离位移调用 map.moveCircle 并采用墙前合法位置', `end=${self.position.x}`);
}
// C4: collide 返回修正位置（墙把位置拉回）→ 采用修正值
{
  const self = makeAvoidEnemy(0, 0);
  self.map.collide = () => ({ x: -0.1, z: 0 });   // 模拟墙挡：修正到 -0.1
  const other = { position: new THREE.Vector3(0.5, 0, 0), alive: true };
  self.enemies = [self, other];
  self._avoidAI(0.05);
  ok(approx(self.position.x, -0.1), 'C4 采用 collide 修正位置', `x=${self.position.x}`);
}
// C5: this.enemies 为 null / 空 / 长度 1 → 不崩
{
  const e1 = makeAvoidEnemy(0, 0); e1._avoidAI(0.05);
  const e2 = makeAvoidEnemy(0, 0); e2.enemies = []; e2._avoidAI(0.05);
  const e3 = makeAvoidEnemy(0, 0); e3.enemies = [{ position: new THREE.Vector3(1,0,0), alive: true }]; e3._avoidAI(0.05);
  ok(true, 'C5 enemies null/空/单敌 → 无异常退出');
}
// C6: 10Hz 节流——同帧第二次调用被跳过
{
  const self = makeAvoidEnemy(0, 0);
  const other = { position: new THREE.Vector3(0.5, 0, 0), alive: true };
  self.enemies = [self, other];
  self._avoidAI(0.05);            // 执行，x=-0.2
  const xAfterFirst = self.position.x;
  self._avoidAI(0.03);            // 0.1-0.03=0.07>0 → 跳过
  ok(approx(self.position.x, xAfterFirst), 'C6 节流窗口内第二次调用被跳过', `x=${self.position.x}`);
  self._avoidAI(0.08);            // 累计 -0.01 → 执行
  ok(self.position.x < xAfterFirst, 'C6 节流窗口过后恢复执行');
}
// C7: 完全重合（dSq<1e-6）→ 不崩、不除零
{
  const self = makeAvoidEnemy(0, 0);
  self.enemies = [{ position: new THREE.Vector3(0, 0, 0), alive: true }];
  self._avoidAI(0.05);
  ok(true, 'C7 完全重合 → 无异常（防御跳过，不除零）');
}
// C8: 死亡敌人不参与推开
{
  const self = makeAvoidEnemy(0, 0);
  self.enemies = [{ position: new THREE.Vector3(0.5, 0, 0), alive: false }];
  self._avoidAI(0.05);
  ok(approx(self.position.x, 0), 'C8 死亡敌人被跳过（不推自己）');
}
// C9: 生产路径优先查询空间哈希，不回退扫描完整 enemies 数组
{
  const self = makeAvoidEnemy(0, 0);
  const nearby = { position: new THREE.Vector3(0.5, 0, 0), alive: true };
  const far = { position: new THREE.Vector3(0.5, 0, 0), alive: true };
  let queryCalls = 0;
  self.enemies = [self, far];
  self._nearbyEnemies = [];
  self.spatialHash = {
    queryInto(x, z, radius, out) {
      queryCalls++;
      out.length = 0;
      out.push(self, nearby);
      return out;
    },
  };
  self._avoidAI(0.05);
  ok(queryCalls === 1 && approx(self.position.x, -0.2),
    'C9 _avoidAI 优先使用空间哈希近邻结果', `queryCalls=${queryCalls}, x=${self.position.x}`);
}

console.log('--- D. audio.enemyShot3D：回退链 ---');
function makeAudio(over = {}) {
  const a = Object.create(AudioFX.prototype);
  a.enabled = true;
  a.ctx = { sampleRate: 48000 };
  a.listener = { type: 'AudioListener' };
  a._paPool = [];
  a._paCursor = 0;
  a.enemyShotCalls = 0;
  a.enemyShot = function () { this.enemyShotCalls++; };
  Object.assign(a, over);
  return a;
}
// D1: enabled=false → 回退 enemyShot()
{
  const a = makeAudio({ enabled: false });
  a.enemyShot3D(new THREE.Vector3(1, 0, 1));
  ok(a.enemyShotCalls === 1, 'D1 enabled=false → 回退全局 enemyShot()');
}
// D2: listener=null → 回退
{
  const a = makeAudio({ listener: null });
  a.enemyShot3D(new THREE.Vector3(1, 0, 1));
  ok(a.enemyShotCalls === 1, 'D2 listener=null → 回退全局 enemyShot()');
}
// D3: 池空 → 回退
{
  const a = makeAudio({ _paPool: [] });
  a.enemyShot3D(new THREE.Vector3(1, 0, 1));
  ok(a.enemyShotCalls === 1, 'D3 池空 → 回退全局 enemyShot()');
}
// D4: 正常播放 → position.copy + stop + play + cursor 循环
{
  const events = [];
  const fakePa = {
    position: { copy(v) { events.push('copy:' + v.x + ',' + v.z); } },
    stop() { events.push('stop'); },
    play() { events.push('play'); },
  };
  const a = makeAudio({ _paPool: [fakePa] });
  a.enemyShot3D(new THREE.Vector3(3, 0, 4));
  ok(events.join(',') === 'copy:3,4,stop,play', 'D4 正常：position.copy→stop→play', events.join(','));
  ok(a._paCursor === 0, 'D4 cursor 循环（池长 1）', `cursor=${a._paCursor}`);
}
// D5: play 抛异常 → catch 回退全局 enemyShot()（不中断 AI）
{
  const a = makeAudio({
    _paPool: [{ position: { copy() {} }, stop() {}, play() { throw new Error('WebAudio broken'); } }],
  });
  a.enemyShot3D(new THREE.Vector3(1, 0, 1));
  ok(a.enemyShotCalls === 1, 'D5 play 异常 → catch 回退全局 enemyShot()');
}
// D6: pool 循环取用（池长 3，连续 4 次 → cursor 回到 1）
{
  const played = [];
  const mk = (i) => ({ position: { copy() {} }, stop() {}, play() { played.push(i); } });
  const a = makeAudio({ _paPool: [mk(0), mk(1), mk(2)] });
  a.enemyShot3D(new THREE.Vector3(0,0,0));
  a.enemyShot3D(new THREE.Vector3(0,0,0));
  a.enemyShot3D(new THREE.Vector3(0,0,0));
  a.enemyShot3D(new THREE.Vector3(0,0,0));
  ok(played.join(',') === '0,1,2,0', 'D6 池循环 0→1→2→0', played.join(','));
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
