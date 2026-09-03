// 真机反馈专项回归：导航/滚动、枪口、碰撞、AI、掉落与倍率波次。
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const main = read('main.js');
const index = read('index.html');
const style = read('style.css');
const player = read('player.js');
const weapon = read('weapon.js');
const map = read('map.js');
const enemy = read('enemy.js');
const pickup = read('pickup.js');

let passed = 0;
let failed = 0;
function ok(condition, name) {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('--- A. 设置、勋章、分享与返回链 ---');
ok(/id="settingsMedalsBtn"/.test(index) && /_openMedalCenter\('settings'\)/.test(main),
  '设置页存在勋章入口并保留 settings 返回来源');
ok(/_medalReturnState === 'settings'[\s\S]*?settings\.classList\.remove\('hidden'\)/.test(main),
  '关闭勋章中心可回到设置主页面');
ok(index.indexOf('id="medalPostBtn"') < index.indexOf('id="medalShareCanvas"') &&
  /发送小红书笔记/.test(index), '小红书发布按钮在大图预览之前可见');
ok(/_bindSettingsScroll\(document\.getElementById\('medalCenter'\)\)/.test(main) &&
  /_bindSettingsScroll\(document\.getElementById\('medalShare'\)\)/.test(main) &&
  /body\.rotated #settingsMenu,[\s\S]*?touch-action: pan-x/.test(style),
  '设置、勋章和分享页统一支持旋转真机滚动');
ok(/_installBackGuard\(\)/.test(main) && /addEventListener\('popstate'/.test(main) &&
  /_handleBackNavigation\(\)/.test(main), '宿主返回优先交给游戏内页面栈处理');

console.log('--- B. 枪械、枪口与 AK 换弹 ---');
ok(/pitch \+ this\.recoilOffset/.test(player) && !/this\.pitch -= recover/.test(player),
  '后坐恢复不再把玩家基础视角向下多扣');
ok(/position\.y = -Math\.abs\(bob\)[\s\S]*?- lowY/.test(weapon) &&
  weapon.indexOf('position.y = -Math.abs(bob)') > weapon.indexOf('if (this.reloadTimer > 0)'),
  '换弹下沉量在计算完成后才应用');
ok(/g\.userData\.reloadMag = null/.test(weapon) &&
  !/const akMag = new THREE\.Mesh/.test(weapon), 'AK 不再叠加非原模型假弹匣');
ok(/换弹结束的同一帧立即隐藏[\s\S]*?mag\.visible = false/.test(weapon),
  '临时换弹代理在结束帧隐藏');

console.log('--- C. 港口碰撞与挡弹空气墙 ---');
ok(/_buildExactPortCollision/.test(map) && /visual-mesh-segments/.test(map) &&
  /if \(blockMovement\) this\.boxes\.push\(box\)/.test(map),
  '港口水平移动改用可见模型精确边界，栅格盒仅作失败回退');
ok(/if \(!b\._portBoundary\) continue/.test(map) &&
  !/if \(!b\._portWalk && !b\._portBoundary\) continue/.test(map),
  '港口子弹不再使用移动盒作为不可见挡弹兜底');

console.log('--- D. 敌人、补给、掉落与波次 ---');
ok(/_huntDelay -= dt/.test(enemy) && /this\.state = 'engage'/.test(enemy),
  '敌人部署后主动进入寻人状态');
ok(/healthSeekRatio/.test(read('config.js')) && /collectForEnemy/.test(enemy) &&
  /pickup\.type === 'health'/.test(pickup), '敌人低血或低弹时会争抢血包与弹药包');
ok(/id="armorDropChanceSlider"/.test(index) && /_applyArmorDropSettings/.test(main),
  '设置页可持久化调整护甲掉落概率');
ok(/part === 'head'[\s\S]*?dropBundle\(this\.position, \['ammo', 'health', 'armor'\]\)/.test(enemy) &&
  /dropBundle\(pos/.test(pickup), '爆头击杀固定掉落弹药、血包和护甲');
ok(/countMultiplier: 1\.35/.test(read('config.js')) && /Math\.pow\(W\.countMultiplier/.test(main),
  '敌人数按关卡倍率增长并保留移动端上限');
ok(/minSpawnDistance: 16/.test(read('config.js')) &&
  /W\.minSpawnDistance \|\| 16/.test(main), '敌人出生点与玩家保持配置化安全距离');

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
