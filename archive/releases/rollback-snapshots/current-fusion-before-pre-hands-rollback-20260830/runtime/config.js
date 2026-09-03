// config.js —— 全局常量与武器/敌人参数表
// 集中管理数值，便于后续平衡性调整

const CONFIG = {
  // ---- 渲染 ----
  fov: 75,
  fovPortrait: 88,          // 竖屏水平视野补偿（竖屏 aspect<1，垂直 FOV 需加大才不会太窄）
  renderDistance: 250,      // 地图实际尺寸远小于 250m，缩短远裁面提升移动端深度精度
  shadowMapSize: 1024,      // 启动时由设备档位覆盖：安卓 512 / 桌面 1024
  mobilePixelRatioCap: 1.25,
  desktopPixelRatioCap: 2,
  idleRenderInterval: 100,  // 菜单/暂停态降到 10 FPS，减少无意义的 GPU 占用
  // 移动端性能预算：效果全部池化，碰撞沿轨迹分步而不是逐三角形查询。
  performance: {
    collisionStep: 0.2,
    maxTracers: 24,
    maxImpacts: 24,
    maxHitSparks: 30,
    maxShells: 12,
    muzzleDuration: 0.075,
    frameWindow: 120,
    evaluateEveryFrames: 60,
    dprDegradeMs: 24,
    shadowDisableMs: 32,
    longFrameMs: 50,
    severeFrameMs: 90,
    minPixelRatio: 0.85,
    pixelRatioStep: 0.15,
  },

  // ---- 地图 ----
  // 地图选择器只暴露已经接入完整出生点、视觉层、碰撞和射线逻辑的地图。
  // 新局开始后由 main.js 锁定当前选择，玩家死亡后才允许重新选择。
  map: {
    defaultId: 'container-port',
    name: '港口集装箱仓库',
    choices: [
      {
        id: 'container-port',
        name: '港口集装箱仓库',
        description: '集装箱通道与高低掩体，适合中远距离交战',
      },
      {
        id: 'classic',
        name: '经典竞技场',
        description: '西侧仓库、东侧仓库与中央长廊，路线更紧凑',
      },
    ],
  },

  // ---- 玩家 ----
  player: {
    height: 1.7,            // 站立眼高
    radius: 0.35,           // 碰撞半径
    walkSpeed: 7.5,         // m/s
    runSpeed: 11,           // 加速跑（未实装，留接口）
    crouchSpeed: 3.5,
    crouchDrop: 0.5,        // 下蹲眼高降低量（1.7→1.2，视觉可感知）
    proneSpeed: 2.2,        // 卧姿匍匐速度，明显低于蹲伏但仍可持续移动
    proneDrop: 0.98,        // 卧姿眼高降低量（1.7→0.72）
    stanceTransitionSpeed: 9,
    proneBobScale: 0.35,
    jumpVelocity: 7.2,
    gravity: 22,
    accelGround: 18,        // 更快达到目标速度，减轻触控“拖沓感”
    accelAir: 2.4,          // 空中控制（CS 空中转向受限）
    friction: 11,
    maxHealth: 100,
    maxArmor: 100,
    mouseSensitivity: 0.0025,
    touchSensitivity: 0.008,   // 逻辑短边归一化后的基础灵敏度；设置页仍可按个人习惯缩放
    touchReferenceShortSide: 460, // 同样占屏比例的滑动在手机/平板得到一致转角
    touchMaxDeltaRatio: 0.35,  // 丢帧/坐标跳变时限制单个采样，避免突然甩镜
    fireDragSensitivityMul: 0.85, // 按住 FIRE 拖动时略降，兼顾追枪稳定性
    scopeSensitivityMul: 0.72,    // AWP 开镜后降低转向速度，避免放大视野过度甩动
    joystickDeadzone: 0.06,
    joystickFullAt: 0.80,       // 推到 80% 半径即满速
    joystickCurve: 0.80,        // <1：小幅推动也能快速起步
    viewBobSettleSpeed: 12,     // 停步后只衰减幅度，不再改变步态相位
  },

  // ---- 武器定义 ----
  // type: semi(半自动) / auto(全自动)
  // spread: 弹道散布角度(弧度)；
  weapons: {
    usp: {
      id: 'usp', name: 'Glock-18', slot: 1,
      type: 'semi',
      damage: 30, headMult: 4, legMult: 0.75, armMult: 1, gunMult: 0.5,
      armorPen: 0.47,        // 新增：穿甲 47%（若引擎现有逻辑读不到则仅作数据记录，不加新机制）
      fireRate: 0.15,        // 400 RPM 半自动
      magSize: 20, reserve: 120,
      reloadTime: 2.3,
      spread: 0.008, spreadMove: 0.05,
      recoil: { x: 0.010, y: 0.015, recover: 0.12 },   // recover: 视角回正速率 rad/s（数据驱动）
      recoilPattern: 'light',      // light: 轻微上抬，左右摆动小
      range: 200,
      autoReload: true,
      // 距离衰减（米：<=falloffStart 满伤，>=falloffEnd 衰减至 falloffMin 倍率）
      falloffStart: 10, falloffEnd: 50, falloffMin: 0.5,
      // 连发散布（Glock-18 半自动无累积）
      spreadInc: 0.0, spreadMax: 0.012, spreadDecay: 0.0,
      switchTime: 0.3,      // 切枪动画+冷却时长（秒）
      // 枪模后坐（viewKick）：push=后缩位移(m)、pitch=上挑角(rad)、yaw=左右扭(rad)、decay=回位速率(/s)
      viewKick: { push: 0.10, pitch: 0.055, yaw: 0.02, decay: 7 },
      // 弹壳抛壳口（枪模局部坐标，localToWorld 转换）
      shell: { x: 0.25, y: -0.135, z: -0.50 },
    },
    ak47: {
      id: 'ak47', name: 'AK-47', slot: 2,
      type: 'auto',
      damage: 30, headMult: 4, legMult: 0.75, armMult: 1, gunMult: 0.5,
      fireRate: 0.099,
      magSize: 30, reserve: 90,
      reloadTime: 2.4,
      spread: 0.012, spreadMove: 0.07,
      recoil: { x: 0.020, y: 0.028, recover: 0.05 },   // 慢恢复 → 需压枪
      recoilPattern: 'heavy',      // heavy: 竖向上扬为主 + 随机左右摆
      range: 250,
      autoReload: true,
      falloffStart: 10, falloffEnd: 50, falloffMin: 0.5,
      spreadInc: 0.004, spreadMax: 0.045, spreadDecay: 0.06,   // 连发累积 0.004/发，停止后快速恢复
      switchTime: 0.3,
      viewKick: { push: 0.17, pitch: 0.10, yaw: 0.05, decay: 5 },
      shell: { x: 0.05, y: 0.005, z: -0.10 },
    },
    // AWP 狙击步枪（栓动式 + 瞄准镜放大）：单发伤害高、射速慢、射程远；
    // 切到 AWP 时 camera.fov 降到 45° 实现"瞄准镜放大镜"远程狙击观察
    awp: {
      id: 'awp', name: 'AWP', slot: 3,
      type: 'semi',           // 栓动单发
      damage: 100, headMult: 1.5, legMult: 0.6, armMult: 0.8, gunMult: 0.4,
      fireRate: 0.85,        // 栓动拉栓周期（蓝图：球形拉柄 0.85s/发）
      magSize: 5, reserve: 20,
      reloadTime: 3.0,        // 5 发单排替换（蓝图）
      moveSpeedMul: 0.75,    // 携带移速惩罚 -25%（蓝图：重型武器平衡）
      spread: 0.001, spreadMove: 0.0,   // 几乎零散布（精准狙击）
      recoil: { x: 0.045, y: 0.055, recover: 0.02 },  // 强后坐、慢恢复
      recoilPattern: 'heavy',
      range: 500,            // 超远射程
      autoReload: false,
      falloffStart: 50, falloffEnd: 300, falloffMin: 0.7,  // 远距离衰减很小
      spreadInc: 0.0, spreadMax: 0.0, spreadDecay: 0.0,   // 单发无连发散布
      switchTime: 0.5,
      fov: 45,               // 瞄准镜放大（FOV 减小 = 放大；默认 75°，AWP 45°）
      viewKick: { push: 0.24, pitch: 0.18, yaw: 0.03, decay: 3.6 },
      shell: { x: 0.06, y: 0.0, z: -0.12 },
    },
  },

  // ---- 第一人称双手 ----
  // 源 OBJ 的左右手各自以腕口为局部原点。这里仅保存刚性姿势；第一阶段
  // 不做指骨、蒙皮或 IK，换弹只移动左手并让整套视图模型同步下沉/侧转。
  hands: {
    material: {
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.12,
      normalScale: 0.72,
    },
    poses: {
      usp: {
        right: { position: [0.225, -0.375, -0.405], rotation: [0.02, -0.10, 3.05], scale: 0.295 },
        left:  { position: [0.115, -0.365, -0.435], rotation: [0.08, 0.16, -3.00], scale: 0.280 },
        reloadLeft: { position: [-0.10, -0.16, 0.10], rotation: [-0.25, 0.20, -0.45] },
      },
      ak47: {
        right: { position: [0.185, -0.300, -0.315], rotation: [0.04, -0.16, 3.05], scale: 0.295 },
        left:  { position: [0.205, -0.205, -0.500], rotation: [0.62, 0.06, -2.82], scale: 0.285 },
        reloadLeft: { position: [-0.06, -0.24, 0.24], rotation: [-0.50, 0.30, -0.55] },
      },
      awp: {
        right: { position: [0.190, -0.300, -0.310], rotation: [0.04, -0.14, 3.05], scale: 0.300 },
        left:  { position: [0.210, -0.200, -0.520], rotation: [0.66, 0.04, -2.84], scale: 0.290 },
        reloadLeft: { position: [-0.05, -0.25, 0.28], rotation: [-0.52, 0.26, -0.50] },
      },
    },
  },

  // ---- 敌人 ----
  enemy: {
    radius: 0.4,
    height: 1.8,
    maxHealth: 100,
    moveSpeed: 3.2,
    chaseSpeed: 4.6,
    fireRange: 45,
    fireInterval: 0.7,      // 开火间隔
    burstCount: 3,          // 一次点射击数
    burstDelay: 0.12,
    damage: 8,              // 兼容旧配置的基准值
    // 设置页调整的是普通身体射击的基础伤害，按玩家 100 点生命值校准；
    // 精英/王牌的 damageAdd 与爆头倍率仍在基础范围之外单独生效。
    damageMin: 6,
    damageMax: 12,
    headshotMultiplier: 3,
    hitChance: 0.45,        // 命中率(玩家在视野内时)
    sightRange: 70,
    fov: Math.PI * 0.55,    // 视野半角
    reactionTime: 0.35,     // 发现玩家到开火延迟
    // 死亡掉落护甲概率（18%）：每波约 3-8 敌（平均 5）→ 每波约 0.9 个护甲（+45 护盾）
    // 与一波战斗实际损耗（护甲 50% 吸收，约 12-32 点）基本匹配并略有余量，
    // 保证护盾是需运营的稀缺资源，不会溢出（35% 时每波 +87 严重溢出、护盾永远满）
    armorDropChance: 0.18,
    // 敌人使用有限弹匣；备弹耗尽后才会主动搜索地图弹药包，换弹有明确读秒。
    ammo: {
      magazineSize: 18,
      reserveSize: 54,
      reloadTime: 1.5,
      pickupSearchRadius: 28,
      pickupRange: 1.4,
      pickupAmount: 36,
      searchInterval: 0.45,
    },
  },

  // ---- AI 融合（three-cs）----
  ai: {
    losMode: 'seg',   // 视线判定：'seg' = 2D 线段轻量判定（raycast 兜底）；'ray' = 原 3D 射线（回退开关）
    losSegY: 1.55,    // 参与遮挡的墙体最低高度：掩体箱 maxY<此值不遮视线（维持现有 raycast 行为）
    aiSpacing: 0.9,   // AI-AI 最小间距（米），_avoidAI 阈值；< 两敌碰撞半径和(0.4+0.4)即可生效
  },

  // ---- 回合（随机多关卡：每局随机波次数 + 每波随机敌人数/血量/速度）----
  waves: {
    minWaves: 8,            // 关卡数量下限（原来 4~7 太短，玩家反馈不够玩）
    maxWaves: 12,
    baseCount: 3,          // 第 1 波基准人数
    countPerWave: 1.4,     // 每波递增人数
    countJitter: 2,        // 人数随机浮动 ±
    maxCount: 14,          // 人数封顶（避免后期单波过多、单局过长）
    hpBase: 80,            // 第 1 波基准血量
    hpPerWave: 30,         // 每波递增血量
    hpJitter: 0.2,         // 血量随机浮动 ±20%
    hpCap: 300,            // 血量封顶（避免后期 400+ 血刷太久）
    speedBase: 2.8,        // 第 1 波基准速度
    speedPerWave: 0.35,    // 每波递增速度
    speedJitter: 0.12,     // 速度随机浮动
    speedMax: 4.8,         // 速度封顶（玩家走速 7.5，敌人追击 1.3 倍速超过 6.2 就追不上）
    names: ['Phantom', 'Viper', 'Ghost', 'Reaper', 'Fang', 'Echo', 'Talon', 'Raven'],
    // ---- 后期强化：按波次进度分层（wave/totalWaves 超过阈值进入对应层级）----
    eliteWaveFrac: 0.45,    // 波次进度 > 45% → tier 1 精英
    aceWaveFrac: 0.75,      // 波次进度 > 75% → tier 2 王牌
    eliteCountMul: 1.35,    // 精英+波人数再乘（后期更多敌人）
    eliteMaxCount: 18,      // 精英+波人数封顶（高于普通 14）
  },

  // ---- 敌人分层强化（tier 0 普通 / 1 精英 / 2 王牌）----
  enemyTiers: {
    0: {},
    1: { label: '精英', burstBonus: 2,   fireIntervalMul: 0.85, hitChanceAdd: 0.06, damageAdd: 2,
         rush: true, push: true,  melee: true, meleeDamage: 16 },
    2: { label: '王牌', burstBonus: 3,   fireIntervalMul: 0.70, hitChanceAdd: 0.12, damageAdd: 4,
         rush: true, push: true,  melee: true, meleeDamage: 24 },
  },

  // ---- 补给包（血包 + 弹药包 + 敌人掉落护甲）----
  pickup: {
    healAmount: 50,         // 每次回血量
    armorAmount: 50,        // 护盾点数：每次拾取增加量（敌人掉落）
    pickupRadius: 1.4,      // 拾取半径（米）
    respawnTime: 15,        // 拾取后重生秒数
    // 血包固定点位 [x, z]，均避开墙体/掩体与出生点
    spawns: [
      [0, 3.4],      // 中央长廊（中央木箱旁）
      [-10, 8],      // 上半区西侧
      [18, -8],      // 下半区东侧
      [-20, -6],     // 下半区西侧出生区旁
    ],
    // 弹药包：一次补给的备用弹量（按枪械各自封顶在初始储备）
    ammo: {
      usp: 24,       // USP +2 弹匣
      ak47: 60,      // AK-47 +2 弹匣
      awp: 10,       // AWP +2 弹匣（5 发×2）
    },
    // 弹药包固定点位（与血包错开，覆盖两房 + 长廊两端；已对照墙体/掩体留出碰撞间距）
    ammoSpawns: [
      [-6, -2.6],    // 中央长廊 CT 端（避开 z=-4 隔墙）
      [12, 8],       // 上半区 T 侧
      [-18, -12],    // 西侧仓库内
      [22, 6.5],     // 东侧出生区旁（避开 z=4 隔墙）
    ],
  },
};

// 工具：限制范围
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

// 经典脚本全局暴露（依赖顺序：config 最先加载，后续脚本通过 window 命名空间取用）
window.CONFIG = CONFIG;
window.clamp = clamp;
window.lerp = lerp;
