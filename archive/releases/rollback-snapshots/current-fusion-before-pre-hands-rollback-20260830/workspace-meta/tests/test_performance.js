// 平衡性能档与手游式快速转身的回归测试
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
let pass = 0;
let fail = 0;

function ok(condition, name, detail = '') {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}${detail ? `  (${detail})` : ''}`);
  } else {
    fail++;
    console.error(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`);
  }
}

const sandbox = { console, THREE: require('../three.min.js') };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), sandbox, { filename: 'config.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'player.js'), 'utf8'), sandbox, { filename: 'player.js' });
const C = sandbox.CONFIG;

console.log('--- A. 普通安卓平衡渲染档 ---');
ok(C.mobilePixelRatioCap === 1.25, '移动端 DPR 上限为 1.25', `got=${C.mobilePixelRatioCap}`);
ok(C.idleRenderInterval === 100, '菜单/暂停态 100ms 刷新间隔', `got=${C.idleRenderInterval}`);
ok(C.shadowMapSize === 1024, '桌面阴影基线保持 1024，运行时按设备覆盖');
ok(C.performance.frameWindow === 120 && C.performance.evaluateEveryFrames === 60 &&
  C.performance.dprDegradeMs === 24 && C.performance.shadowDisableMs === 32 &&
  C.performance.minPixelRatio === 0.85,
  '真机性能保护使用 120 帧分位窗口并单向降低 DPR/阴影');

console.log('--- B. 手游式快速转身与移动响应 ---');
ok(C.player.touchSensitivity === 0.008, '触屏基础灵敏度 0.008', `got=${C.player.touchSensitivity}`);
ok(C.player.touchReferenceShortSide === 460 && C.player.touchMaxDeltaRatio === 0.35,
  '触控转身按 460px 逻辑短边归一化并限制异常单帧跳变');
ok(C.player.accelGround === 18 && C.player.friction === 11, '起步和停步响应加快');
ok(C.player.joystickFullAt === 0.8 && C.player.joystickCurve === 0.8, '摇杆 80% 满速且小幅推动增强');
ok(C.player.scopeSensitivityMul === 0.72, 'AWP 开镜灵敏度倍率 0.72');
ok(C.player.proneSpeed < C.player.crouchSpeed && C.player.proneDrop > C.player.crouchDrop &&
  C.performance.maxTracers === 24 && C.performance.muzzleDuration <= 0.1,
  '卧姿与枪口特效均有移动端性能预算');

const p = Object.create(sandbox.Player.prototype);
p.alive = true;
p.yaw = 0;
p.pitch = 0;
p.sensitivityScale = 1.2;
p.aimSensitivityMul = 0.5;
p.touchLookReferencePx = 460;
p.onTouchLook(10, 4, 0.85);
const expectedYaw = -10 * C.player.touchSensitivity * 1.2 * 0.5 * 0.85;
ok(Math.abs(p.yaw - expectedYaw) < 1e-12, '触控灵敏度叠加个人/开镜/FIRE 倍率', `yaw=${p.yaw}`);
const tabletLook = Object.create(sandbox.Player.prototype);
tabletLook.alive = true;
tabletLook.yaw = 0;
tabletLook.pitch = 0;
tabletLook.sensitivityScale = 1.2;
tabletLook.aimSensitivityMul = 0.5;
tabletLook.touchLookReferencePx = 920;
tabletLook.onTouchLook(20, 8, 0.85);
ok(Math.abs(tabletLook.yaw - p.yaw) < 1e-12 && Math.abs(tabletLook.pitch - p.pitch) < 1e-12,
  '手机和平板上相同占屏比例的拖动得到相同转角');
function makeMovePlayer(inputAmount) {
  const mover = Object.create(sandbox.Player.prototype);
  mover.alive = true;
  mover.yaw = 0;
  mover.pitch = 0;
  mover.keys = {};
  mover.moveTouch = { x: 0, y: inputAmount };
  mover.proneToggle = false;
  mover.crouchToggle = false;
  mover._proneAmt = 0;
  mover._crouchAmt = 0;
  mover.weaponSpeedMul = 1;
  mover.onGround = true;
  mover.velocity = new sandbox.THREE.Vector3();
  mover.position = new sandbox.THREE.Vector3();
  mover.map = { moveCircle: (sx, sz, ex, ez) => ({ x: ex, z: ez }) };
  mover._jumpRequested = false;
  mover.viewBob = 0;
  mover.viewBobAmount = 0;
  mover.recoilOffset = 0;
  mover._syncCamera = () => {};
  return mover;
}
const lightPush = makeMovePlayer(0.25);
const fullPush = makeMovePlayer(1);
lightPush.update(1 / 60);
fullPush.update(1 / 60);
const lightSpeed = Math.hypot(lightPush.velocity.x, lightPush.velocity.z);
const fullSpeed = Math.hypot(fullPush.velocity.x, fullPush.velocity.z);
ok(lightSpeed > 0 && fullSpeed > lightSpeed * 3.5,
  '摇杆轻推与推满产生分级目标速度，不再统一满速', `light=${lightSpeed.toFixed(3)}, full=${fullSpeed.toFixed(3)}`);

console.log('--- C. 启动资源与发布清单 ---');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const hudSource = fs.readFileSync(path.join(root, 'hud.js'), 'utf8');
const weaponSource = fs.readFileSync(path.join(root, 'weapon.js'), 'utf8');
const mapSource = fs.readFileSync(path.join(root, 'map.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const textures = fs.readFileSync(path.join(root, 'textures.js'), 'utf8');
const environmentAssets = fs.readFileSync(path.join(root, 'environment_materials.js'), 'utf8');
const portModel = fs.readFileSync(path.join(root, 'map_model.js'), 'utf8');
const portCollision = fs.readFileSync(path.join(root, 'map_collision.js'), 'utf8');
const portAssets = fs.readFileSync(path.join(root, 'map_assets.js'), 'utf8');
const pack = fs.readFileSync(path.join(root, 'tools', 'package.ps1'), 'utf8');
const releaseManifest = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'release-files.json'), 'utf8'));
const resourceLoader = fs.readFileSync(path.join(root, 'resource_loader.js'), 'utf8');
const enemyModelSource = fs.readFileSync(path.join(root, 'enemy_model.js'), 'utf8');
const enemyHighModelSource = fs.readFileSync(path.join(root, 'enemy_model_hd.js'), 'utf8');
const enemyRig = fs.readFileSync(path.join(root, 'enemy_rig.js'), 'utf8');
const expectedCrosshairStyles = ['classic', 'dot', 'circle', 'plus', 'tactical'];
const crosshairOptionIds = [...index.matchAll(/data-crosshair-style="([^"]+)"/g)].map(match => match[1]);
ok(!index.includes('weapon_tex.js') && !fs.existsSync(path.join(root, 'weapon_tex.js')), '未使用的 weapon_tex 已退出启动链');
const initialScripts = [...index.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
ok(JSON.stringify(initialScripts) === JSON.stringify([
  'config.js', 'three.min.js', 'hud.js', 'audio.js', 'resource_loader.js', 'main.js',
]) && index.includes('id="loadingScreen"'), '首屏只加载 6 个轻启动脚本并提供本地加载进度层');
ok(/async function loadForMap/.test(resourceLoader) && /enemy_model_hd\.js/.test(resourceLoader) &&
  /if \(!touch\)/.test(resourceLoader) && /mapId === 'container-port'/.test(resourceLoader) &&
  /await nextPaint\(\)/.test(resourceLoader), '地图、敌人高模和三枪资源按设备/地图分段并逐帧让步');
const debugBarStart = index.indexOf('    <div id="debugBar"></div>');
const hudCloseBeforeControls = debugBarStart >= 0 ? index.indexOf('\n  </div>', debugBarStart) : -1;
const touchControlsStart = index.indexOf('  <div id="touchControls"');
ok(debugBarStart >= 0 && hudCloseBeforeControls >= 0 && touchControlsStart > hudCloseBeforeControls,
  '虚拟控制层独立于隐藏 HUD，布局编辑态不会被父节点遮蔽');
ok(/this\._environmentReady = false/.test(main) && /_ensureRuntime\(requestedMapId\)/.test(main) &&
  /this\._setLoadingProgress\(0\.97/.test(main) && /this\.scene\.environment = this\._buildEnvironment\(\)/.test(main) &&
  /this\.state = 'playing'/.test(main), 'PMREM 在加载层内完成，不把一次性 GPU 工作插入战斗帧');
ok(/_perfFrames\.slice\(\)\.sort/.test(main) && /percentile\(0\.95\)/.test(main) &&
  /boot\.runtime/.test(main) && /pixelRatioStep/.test(main), '运行时记录 P50/P95/P99 并按分位数单向降级');
ok(/joyZone\.addEventListener\('touchstart'/.test(main) && /joyZone\.addEventListener\('touchmove'/.test(main),
  'Touch-only WebView 有摇杆拖动回退');
ok(/const moveTouch =/.test(main) && /document\.addEventListener\('touchmove', moveTouch/.test(main),
  'Touch-only WebView 有 FIRE 拖动回退');
ok(/elementFromPoint/.test(main) && /isControlTouch/.test(main),
  '缺失 Touch.target 时按坐标排除游戏控件触点');
ok(index.includes('id="btnFireLeft"') && index.includes('id="btnFireRight"') &&
  /data-fire-look="false"/.test(index) && /data-fire-look="true"/.test(index) &&
  /_fireOwner/.test(main) && /fireLeft/.test(main),
  '三指布局提供独立左开火，右开火可拖动视角且多指 owner 不互抢');
ok(/body\.tablet #weaponHud/.test(css) && /--action-cluster-width/.test(css),
  '平板弹药 HUD 避开放大的动作簇');
ok(/_pauseForSystemInterruption/.test(main) && /addEventListener\('pagehide'/.test(main),
  '失焦/切后台会统一暂停并清理触摸动作');
ok(/_onCanvasPointerDown/.test(main) && /_mouseLookPointerType === 'touch'/.test(main) &&
  /getCoalescedEvents/.test(main) && /document\.addEventListener\('touchstart', this\._onDocTouchStart/.test(main) &&
  /btn\.addEventListener\('touchstart', touchStart/.test(main) && /_isRightLookPoint/.test(main) &&
  /_shouldSuppressTouchFallback/.test(main) && /#gameRoot canvas/.test(css),
  'Pointer Events 平滑消费右侧视角，声明不完整时仍保留 Touch 兜底');
ok(/_screenToContentPoint\(clientX, clientY\)/.test(main) &&
  /const content = this\._rotated \? \{ x: y, y: H - x \} : \{ x, y \}/.test(main) &&
  /_placeCustom\(\s*joyBase/.test(main) &&
  (main.match(/for \(const sample of this\._pointerSamples\(e\)\)/g) || []).length >= 3,
  '强制旋转布局使用内容坐标分区，摇杆保存/恢复逻辑与视角/FIRE 均消费合并触控采样');
ok(!index.includes('<script src="map_model.js"') && resourceLoader.includes('map_model.js') &&
  resourceLoader.includes('map_collision.js') && resourceLoader.includes('map_assets.js') && resourceLoader.includes('environment_materials.js') &&
  /_buildImportedPortModel\(\)/.test(mapSource) && /_applyPortTexture/.test(mapSource) &&
  /_addImportedWalkColliders\(\)/.test(mapSource) && /_raycastImportedPort\(/.test(mapSource) &&
  /_portVisualSource = imported \? 'imported-model' : 'curated-fallback'/.test(mapSource) &&
  /sharedSurface/.test(environmentAssets) && /textureKey: 'concrete'/.test(environmentAssets) &&
  portModel.includes('CS15_MAP_MODEL') && portCollision.includes('CS15_MAP_COLLISION') && portAssets.includes('portBase'),
  '港口模型/独立碰撞/PBR 与共享环境资产进入延迟离线启动链');
ok(!/weapon(?:Palette|Color|\.js)/i.test(environmentAssets) && /_loadSharedTexture/.test(mapSource) &&
  /_textureCache/.test(mapSource), '环境资产复用与武器配色隔离');
ok(/btn\.id === 'btnJump'/.test(main) && /this\.player\.requestJump\(\)/.test(main) &&
  /this\._jumpRequested = false/.test(fs.readFileSync(path.join(root, 'player.js'), 'utf8')),
  '卧倒后跳跃按钮走起身优先的离散状态机');
function createSliderHarness(withPointerEvents, storedLayout = null) {
  const harnessWindow = { addEventListener() {} };
  if (withPointerEvents) harnessWindow.PointerEvent = function PointerEvent() {};
  const harness = {
    console,
    window: harnessWindow,
    localStorage: { getItem: () => storedLayout, setItem() {} },
    HUD: { prototype: { killFeed() {} } },
  };
  vm.createContext(harness);
  vm.runInContext(main, harness, { filename: 'main.js' });
  const GameClass = vm.runInContext('Game', harness);
  const game = Object.create(GameClass.prototype);
  game._rotated = true;
  return game;
}
const inputHarness = {
  console,
  window: {
    innerWidth: 1000,
    visualViewport: { width: 1000 },
    PointerEvent: function PointerEvent() {},
    addEventListener() {},
  },
  document: {},
  navigator: { maxTouchPoints: 5 },
  HUD: { prototype: { killFeed() {} } },
};
vm.createContext(inputHarness);
vm.runInContext(main, inputHarness, { filename: 'main.js' });
const InputGameClass = vm.runInContext('Game', inputHarness);
const inputGame = Object.create(InputGameClass.prototype);
inputGame._rotated = false;
inputGame._gw = 1000;
inputGame._gh = 500;
const landscapeSplit = inputGame._isRightLookPoint(750, 200) && !inputGame._isRightLookPoint(250, 200);
inputGame._rotated = true;
const rotatedSplit = inputGame._isRightLookPoint(250, 750) && !inputGame._isRightLookPoint(250, 250);
ok(landscapeSplit && rotatedSplit, '横屏和强制旋转布局都按逻辑内容右半区分配视角触点');
ok(!inputGame._isRightLookPoint(Number.NaN, 10), '非法视角坐标不会启动视角触点');
inputGame._rotated = false;
inputGame._recordPointerTouch({ pointerType: 'touch', pointerId: 1, clientX: 750, clientY: 200 }, true);
ok(inputGame._shouldSuppressTouchFallback({ changedTouches: [{ clientX: 750, clientY: 200 }] }),
  'Pointer 与 Touch 触摸兜底事件按坐标去重');
ok(!inputGame._shouldSuppressTouchFallback({ changedTouches: [{ clientX: 240, clientY: 200 }] }),
  '不同位置的第二根手指不会被第一根 Pointer 触点吞掉');
ok(!inputGame._shouldSuppressTouchFallback({ changedTouches: [
  { clientX: 750, clientY: 200 }, { clientX: 240, clientY: 200 },
] }), '同一多指事件含新触点时不会整批被重复事件去重吞掉');
inputGame._recordPointerTouch({ pointerType: 'touch', pointerId: 1, clientX: 750, clientY: 200 }, false);
function createSlider(rect, value, options = {}) {
  const listeners = {};
  return {
    min: String(options.min ?? 70),
    max: String(options.max ?? 150),
    step: String(options.step ?? 5),
    value: String(value),
    getBoundingClientRect: () => rect,
    addEventListener(type, listener) { listeners[type] = listener; },
    setPointerCapture() {},
    releasePointerCapture() {},
    listeners,
  };
}
function createSettingsHarness() {
  const createClassList = () => ({
    values: new Set(),
    add(...names) { names.forEach(name => this.values.add(name)); },
    remove(...names) { names.forEach(name => this.values.delete(name)); },
    toggle(name, force) {
      const next = force === undefined ? !this.values.has(name) : Boolean(force);
      if (next) this.values.add(name); else this.values.delete(name);
      return next;
    },
    contains(name) { return this.values.has(name); },
  });
  const makeButton = () => ({
    addEventListener(type, listener) { this.listeners[type] = listener; },
    listeners: {},
  });
  const styleButtons = expectedCrosshairStyles.map(style => ({
    ...makeButton(),
    dataset: { crosshairStyle: style },
    classList: { states: {}, toggle(name, active) { this.states[name] = active; } },
    setAttribute(name, value) { this[name] = value; },
  }));
  const settingsMenu = {
    classList: createClassList(),
    scrollTop: 0,
    scrollHeight: 706,
    clientHeight: 360,
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
  };
  const elements = {
    settingsMenu,
    uiSizeSlider: createSlider({ left: 0, top: 0, width: 100, height: 100 }, 100, { max: 140 }),
    uiSizeVal: { textContent: '' },
    sensitivitySlider: createSlider({ left: 0, top: 0, width: 100, height: 100 }, 100),
    sensitivityVal: { textContent: '' },
    crosshairStyleOptions: { querySelectorAll: () => styleButtons },
    layoutEditBtn: makeButton(),
    layoutResetBtn: makeButton(),
    settingsCloseBtn: makeButton(),
    layoutEditBar: { classList: createClassList() },
    pauseSettingsBtn: null,
  };
  elements.layoutEditBar.classList.add('hidden');
  const harnessWindow = { addEventListener() {}, PointerEvent: function PointerEvent() {} };
  const harness = {
    console,
    window: harnessWindow,
    localStorage: { getItem: () => null, setItem() {} },
    document: {
      documentElement: { classList: createClassList() },
      body: { classList: createClassList() },
      getElementById: id => elements[id] || null,
    },
    HUD: { prototype: { killFeed() {} } },
  };
  vm.createContext(harness);
  vm.runInContext(main, harness, { filename: 'main.js' });
  const GameClass = vm.runInContext('Game', harness);
  const game = Object.create(GameClass.prototype);
  game._rotated = true;
  game._layout = { size: 1, sensitivity: 1, pos: {} };
  game.player = { sensitivityScale: 1 };
  game.hud = {
    style: 'classic',
    setCrosshairStyle(style) {
      this.style = expectedCrosshairStyles.includes(style) ? style : 'classic';
      return this.style;
    },
    hidePause() {},
    showPause() {},
  };
  let firingState = null;
  game.weapons = { setFiring(value) { firingState = value; } };
  let saveCount = 0;
  let applyCount = 0;
  let lastSaved = '';
  game._saveLayout = () => { saveCount++; lastSaved = JSON.stringify(game._layout); };
  game._applyLayout = () => { applyCount++; };
  game._editableList = () => [];
  game._bindSettings();
  return {
    elements,
    document: harness.document,
    game,
    styleButtons,
    settingsMenu,
    get saveCount() { return saveCount; },
    get applyCount() { return applyCount; },
    get lastSaved() { return lastSaved; },
    get firingState() { return firingState; },
  };
}
function eventWith(extra) {
  return {
    preventDefault() {},
    stopPropagation() {},
    ...extra,
  };
}
function exerciseSliderEvents() {
  const pointerSlider = createSlider({ left: 100, top: 100, width: 40, height: 200 }, 100, { max: 140 });
  const pointerLabel = { textContent: '' };
  const pointerChanges = [];
  createSliderHarness(true)._bindRangeSlider(pointerSlider, pointerLabel, value => pointerChanges.push(value));
  pointerSlider.listeners.pointerdown(eventWith({ pointerId: 9, pointerType: 'touch', isPrimary: false, clientX: 120, clientY: 300 }));
  const nonPrimaryIgnored = pointerSlider.value === '100';
  pointerSlider.listeners.pointerdown(eventWith({ pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 100 }));
  pointerSlider.listeners.pointerdown(eventWith({ pointerId: 2, pointerType: 'touch', clientX: 120, clientY: 300 }));
  pointerSlider.listeners.pointermove(eventWith({ pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 300 }));
  const pointerDragOk = nonPrimaryIgnored && pointerSlider.value === '140' && pointerLabel.textContent === '140%' && pointerChanges.at(-1) === 1.4;
  pointerSlider.value = '125';
  pointerSlider.listeners.input(eventWith({}));
  const nativeInputOk = pointerSlider.value === '125' && pointerLabel.textContent === '125%' && pointerChanges.at(-1) === 1.25;

  const touchSlider = createSlider({ left: 0, top: 0, width: 40, height: 100 }, 100);
  const touchLabel = { textContent: '' };
  const touchChanges = [];
  createSliderHarness(false)._bindRangeSlider(touchSlider, touchLabel, value => touchChanges.push(value));
  touchSlider.listeners.touchstart(eventWith({ changedTouches: [{ identifier: 1, clientX: 10, clientY: 10 }] }));
  touchSlider.listeners.touchstart(eventWith({ changedTouches: [{ identifier: 2, clientX: 10, clientY: 90 }] }));
  touchSlider.listeners.touchmove(eventWith({ changedTouches: [{ identifier: 1, clientX: 10, clientY: 80 }] }));
  const touchDragOk = touchSlider.value === '135' && touchLabel.textContent === '135%' && touchChanges.at(-1) === 1.35;
  touchSlider.listeners.touchend(eventWith({ changedTouches: [{ identifier: 1, clientX: 10, clientY: 80 }] }));
  const restored = createSliderHarness(true, JSON.stringify({ size: 0.5, sensitivity: 1.37, pos: {} }))._loadLayout();
  const restoredValuesOk = restored.size === 0.7 && restored.sensitivity === 1.35;
  const settings = createSettingsHarness();
  const dotButton = settings.styleButtons.find(button => button.dataset.crosshairStyle === 'dot');
  dotButton.listeners.pointerdown(eventWith({ pointerId: 6, pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 }));
  dotButton.listeners.pointerup(eventWith({ pointerId: 6, pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 }));
  settings.elements.uiSizeSlider.value = '125';
  settings.elements.uiSizeSlider.listeners.input(eventWith({}));
  settings.elements.sensitivitySlider.value = '130';
  settings.elements.sensitivitySlider.listeners.input(eventWith({}));
  const settingsSyncOk = settings.game._layout.size === 1.25 &&
    settings.game._layout.sensitivity === 1.3 &&
    settings.game._layout.crosshairStyle === 'dot' &&
    settings.game.hud.style === 'dot' &&
    settings.game.player.sensitivityScale === 1.3 &&
    settings.elements.uiSizeVal.textContent === '125%' &&
    settings.elements.sensitivityVal.textContent === '130%' &&
    dotButton.classList.states.active === true && dotButton['aria-pressed'] === 'true' &&
    settings.applyCount === 1 && settings.saveCount === 3 &&
    JSON.parse(settings.lastSaved).sensitivity === 1.3;
  const tacticalButton = settings.styleButtons.find(button => button.dataset.crosshairStyle === 'tactical');
  const saveCountBeforeSwipe = settings.saveCount;
  tacticalButton.listeners.pointerdown(eventWith({ pointerId: 7, pointerType: 'touch', clientX: 10, clientY: 10 }));
  tacticalButton.listeners.pointermove(eventWith({ pointerId: 7, pointerType: 'touch', clientX: 10, clientY: 30 }));
  tacticalButton.listeners.pointerup(eventWith({ pointerId: 7, pointerType: 'touch', clientX: 10, clientY: 30 }));
  const scrollSwipeIgnored = settings.game._layout.crosshairStyle === 'dot' && settings.saveCount === saveCountBeforeSwipe;
  settings.game.state = 'menu';
  settings.game._openSettings();
  const scrollModeEnabled = settings.document.documentElement.classList.contains('settings-open') &&
    settings.document.body.classList.contains('settings-open');
  const scrollClassesEnabled = !settings.elements.settingsMenu.classList.contains('hidden') &&
    settings.game.state === 'menu';
  settings.game._closeSettings();
  const scrollModeDisabled = !settings.document.documentElement.classList.contains('settings-open') &&
    !settings.document.body.classList.contains('settings-open') &&
    settings.elements.settingsMenu.classList.contains('hidden');
  settings.game.player.moveTouch = { x: 1, y: -1 };
  settings.game.player.keys = { KeyW: true, KeyA: true, KeyS: false, KeyD: false };
  settings.game.state = 'playing';
  settings.game._openSettings();
  const playingSettingsOpened = settings.game.state === 'paused' && settings.firingState === false &&
    settings.game.player.moveTouch.x === 0 && settings.game.player.moveTouch.y === 0;
  settings.game._closeSettings();
  const playingSettingsReturned = settings.game.state === 'playing';
  settings.game.state = 'paused';
  settings.game._openSettings();
  settings.game._closeSettings();
  const pausedSettingsReturned = settings.game.state === 'paused';
  settings.settingsMenu.listeners.touchstart(eventWith({
    changedTouches: [{ identifier: 4, clientX: 40, clientY: 160 }],
  }));
  const manualScrollMove = eventWith({
    changedTouches: [{ identifier: 4, clientX: 240, clientY: 160 }],
  });
  settings.settingsMenu.listeners.touchmove(manualScrollMove);
  settings.settingsMenu.listeners.touchend(eventWith({
    changedTouches: [{ identifier: 4, clientX: 240, clientY: 160 }],
  }));
  const manualScrollOk = settings.settingsMenu.scrollTop === 200;
  settings.settingsMenu.listeners.touchstart(eventWith({
    changedTouches: [{ identifier: 5, clientX: 40, clientY: 160 }],
  }));
  settings.settingsMenu.listeners.touchmove(eventWith({
    changedTouches: [{ identifier: 5, clientX: 40, clientY: 260 }],
  }));
  settings.settingsMenu.listeners.touchend(eventWith({
    changedTouches: [{ identifier: 5, clientX: 40, clientY: 260 }],
  }));
  const wrongAxisIgnored = settings.settingsMenu.scrollTop === 200;
  const crosshairState = {
    classList: {
      values: new Set(),
      remove(...names) { names.forEach(name => this.values.delete(name)); },
      add(name) { this.values.add(name); },
    },
    dataset: {},
  };
  const hudHarness = {
    console,
    window: {},
    document: {},
  };
  vm.createContext(hudHarness);
  vm.runInContext(hudSource, hudHarness, { filename: 'hud.js' });
  const HudClass = vm.runInContext('HUD', hudHarness);
  const hud = Object.create(HudClass.prototype);
  hud.crosshair = crosshairState;
  const selectedStyle = hud.setCrosshairStyle('circle');
  const crosshairStyleOk = selectedStyle === 'circle' &&
    crosshairState.dataset.style === 'circle' &&
    crosshairState.classList.values.has('style-circle') &&
    hud.setCrosshairStyle('unknown') === 'classic' &&
    crosshairState.classList.values.has('style-classic');
  const settingsScrollOk = scrollClassesEnabled && scrollModeDisabled && settings.game.state === 'paused' && manualScrollOk && wrongAxisIgnored &&
    playingSettingsOpened && playingSettingsReturned && pausedSettingsReturned;
  const editButton = settings.elements.layoutEditBtn;
  editButton.listeners.pointerdown(eventWith({ pointerId: 8, pointerType: 'touch', clientX: 10, clientY: 10 }));
  editButton.listeners.pointerup(eventWith({ pointerId: 8, pointerType: 'touch', clientX: 10, clientY: 10 }));
  const editModeEntered = settings.game._editLayout === true &&
    settings.elements.settingsMenu.classList.contains('hidden') &&
    settings.document.documentElement.classList.contains('settings-open') === false &&
    settings.elements.layoutEditBar.classList.contains('hidden') === false;
  settings.game._exitEditLayout();
  const editModeExited = settings.game._editLayout === false &&
    settings.elements.layoutEditBar.classList.contains('hidden') &&
    settings.applyCount === 2;
  return pointerDragOk && nativeInputOk && touchDragOk && restoredValuesOk && settingsSyncOk &&
    scrollSwipeIgnored &&
    crosshairStyleOk && scrollModeEnabled && settingsScrollOk && editModeEntered && editModeExited;
}
ok(
  index.includes('uiSizeSlider') && index.includes('sensitivitySlider') && index.includes('crosshairStyleOptions') &&
  JSON.stringify(crosshairOptionIds) === JSON.stringify(expectedCrosshairStyles) &&
  main.includes('crosshairStyle') && hudSource.includes('setCrosshairStyle') && exerciseSliderEvents() &&
  index.includes('id="hitmarker"') && css.includes('#hitmarker') && hudSource.includes('hitMarker') &&
  index.includes('id="btnProne"') && main.includes('toggleProne') && main.includes('_syncStanceButtons') &&
  weaponSource.includes('SpriteMaterial') && weaponSource.includes('AdditiveBlending') &&
  weaponSource.includes('PointLight') && weaponSource.includes('depthWrite: false') &&
  weaponSource.includes('maxTracers') && mapSource.includes('matrixAutoUpdate = false') &&
  main.includes('this._layout.size = size') &&
  main.includes('this.player.sensitivityScale = this._layout.sensitivity') &&
  css.includes('.set-row input[type="range"]') && css.includes('touch-action: none;') &&
  css.includes('overflow-y: auto;') && css.includes('-webkit-overflow-scrolling: touch;') &&
  css.includes('touch-action: pan-y;') && main.includes('_setSettingsScrollMode') &&
  main.includes('_bindSettingsScroll') && main.includes('_bindScrollableTap') &&
  main.includes('Math.hypot(e.clientX - startX, e.clientY - startY) > 8') &&
  (main.includes('Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) > 8') ||
    main.includes('Math.hypot(dx, dy) > 8')) &&
  main.includes('typeof target.closest') &&
  main.includes('readChangedTouches(e)') && main.includes('Number.isFinite(Number(t.clientX))') &&
  main.includes('_resetVirtualJoystick') && main.includes('_fireTouchId') &&
  main.includes('releaseIfFireTouch') && main.includes('_registerInputReset') && main.includes('desiredAxis') &&
  main.includes('_inputTouchPoints') && main.includes('allowDragLook') &&
  main.includes("window.addEventListener('pagehide'"),
  '设置页滑块支持触摸拖动、手动滚动并防御异常触点'
);
const keys = [...textures.matchAll(/window\.TEX\.([A-Za-z0-9_]+)\s*=/g)].map(m => m[1]).sort();
ok(JSON.stringify(keys) === JSON.stringify(['brick', 'concrete', 'crateWood']) && !/data:image|base64,/.test(textures),
  '环境贴图包装器仅保留 3 个包内图片路径', keys.join(','));
ok(releaseManifest.files.includes('ak47_model.js') && releaseManifest.files.includes('awp_tex.js') &&
  releaseManifest.files.includes('ak47_albedo.webp') && releaseManifest.files.includes('awp_mr.webp'),
  '统一发布清单包含 AK/AWP 模型与外置 PBR');
ok(releaseManifest.files.includes('enemy_model.js') && releaseManifest.files.includes('enemy_model_hd.js') &&
  releaseManifest.files.includes('enemy_orm.webp'), '统一发布清单包含移动敌人载荷、桌面高模与贴图');
ok(releaseManifest.files.includes('hands_model.js') && releaseManifest.files.includes('hands_tex.js') &&
  releaseManifest.files.includes('hands_albedo.webp') && releaseManifest.files.includes('hands_mr.webp'),
  '统一发布清单包含刚性双手模型与外置 PBR');
ok(pack.includes('output/compression-candidate/yiren-buche-minitool-candidate.zip') &&
  pack.includes('official package is protected') && pack.includes('release-files.json'),
  '压缩候选默认输出到独立目录并保护正式包');

console.log('--- D. 平衡敌人资源预算与低端策略 ---');
const modelSandbox = { window: {} };
vm.createContext(modelSandbox);
vm.runInContext(enemyModelSource, modelSandbox, { filename: 'enemy_model.js' });
vm.runInContext(enemyHighModelSource, modelSandbox, { filename: 'enemy_model_hd.js' });
const mobileLodTriangles = modelSandbox.window.CS15_ENEMY_MODEL.lods.map(lod => lod.triangleCount);
const lodTriangles = [modelSandbox.window.CS15_ENEMY_MODEL_HD_LOD0, ...modelSandbox.window.CS15_ENEMY_MODEL.lods]
  .map(lod => lod.triangleCount);
ok(lodTriangles[0] === 50008 && mobileLodTriangles[0] <= 18000 && mobileLodTriangles[1] <= 4000,
  '桌面母版完整，移动载荷只含近景/远景两档', lodTriangles.join(','));
ok(modelSandbox.window.CS15_ENEMY_MODEL.source.file.endsWith('.fbx') && modelSandbox.window.CS15_ENEMY_MODEL.source.nativeNormals === true, '正式母版来自用户 FBX 并保留原生法线');
ok(modelSandbox.window.CS15_ENEMY_MODEL.version === 3 && modelSandbox.window.CS15_ENEMY_MODEL.rig.boneCount === 24,
  '移动模型载荷为 24 节混合骨骼 v3');
ok([modelSandbox.window.CS15_ENEMY_MODEL_HD_LOD0, ...modelSandbox.window.CS15_ENEMY_MODEL.lods]
  .every(lod => lod.skinIndex && lod.skinWeight), '离线蒙皮权重随三个 LOD 一并打包');
ok(enemyRig.includes('mobileSkipsHighLod: true') && /shared\.hasHighLod/.test(enemyRig) &&
  /farLod/.test(enemyRig), '普通安卓不解析 5 万面高模且双 LOD 索引稳定');
ok(enemyRig.includes('cs15SharedEnemyAsset') && enemyRig.includes('skeleton.dispose()'), 'GPU资源共享且骨骼实例独立释放');
ok(enemyRig.includes("'locomotion-2d'") && enemyRig.includes("'upper-body-aim'") && enemyRig.includes('muzzleFlash: true'), '二维移动、上身瞄准与射击反馈三层齐全');
const enemyAssetBytes = ['enemy_model.js', 'enemy_model_hd.js', 'enemy_rig.js', 'enemy_albedo.webp', 'enemy_normal.webp', 'enemy_orm.webp']
  .reduce((sum, file) => sum + fs.statSync(path.join(root, file)).size, 0);
ok(enemyAssetBytes < 2.25 * 1024 * 1024, '敌人新增资源低于 2.25 MiB', `${enemyAssetBytes} bytes`);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
