<!--format DECISIONS contains settled choices and their reasoning. Keep one non-contradictory current entry per choice; remove or rewrite superseded choices.-->

# 已定决策

## 产品与发布架构
- Chose: 使用原生 JavaScript、经典 `<script>` 依赖顺序、Three.js UMD 和 Web Audio，正式产物为根目录平铺的离线 ZIP。
- Reason: 小红书小工具容器要求离线、低依赖和直接打开 `index.html`；项目不需要后端或构建系统。
- Rejected: 运行时 CDN、ES Module 依赖链、必须联网的资源加载。

## 武器命中判定：真实网格 Raycaster <!--mem id:raycaster created:2026-08-15 touched:2026-08-15-->
- Chose: 对敌人实际命中网格使用 `THREE.Raycaster`，按 `userData.part` 应用头、身、四肢倍率；墙体使用 `raycastDetailed` 返回距离和法线。
- Reason: 胶囊或球体近似与实际模型轮廓偏差明显，真实网格判定更符合画面。
- Rejected: 用单一胶囊近似所有敌人部位。

## 离线贴图：包内图片与程序化兜底 <!--mem id:cc0-base64 created:2026-08-15 touched:2026-08-15-->
- Chose: 地图、AK/AWP 和公共环境贴图使用 ZIP 根目录内的 WebP/JPG，由经典包装脚本通过相对路径加载并缓存；颜色贴图使用 sRGB，法线与打包 MR 保持线性。Glock 和枪口火光继续使用程序化几何/Canvas，并保留纯色或低端降级兜底。
- Reason: 包内相对路径仍保持零联网依赖，同时避免大型 base64 字符串增加脚本解析、JS 堆驻留和首屏同步负担；外置图片还能让浏览器直接使用图片解码链与缓存。
- Rejected: 运行时加载外链图片/模型，或继续把大型地图和武器 PBR 以内嵌 data URL 常驻 JavaScript。

## 波次与敌人行为 <!--mem id:entry created:2026-08-15 touched:2026-08-15-->
- Chose: 每局波次数和敌人数在配置范围内随机；敌人共享 idle/react/engage 状态机，强度差异来自三档 tier，而不是八个代号各自拥有独立 AI。
- Reason: 保持重玩变化，同时避免把代号误宣传成八套行为系统。
- Rejected: 固定关卡脚本或虚构每个代号的独立走位。

## 敌人卡墙与相互避让 <!--mem id:entry-2 created:2026-08-15 touched:2026-08-15-->
- Chose: 使用圆-AABB 解算、开放方向逃逸、反卡死计时和 AI 间距推离组合处理卡墙。
- Reason: 单纯反向移动无法处理圆心已经进入盒体或多个敌人互相挤压的情况。
- Rejected: 只依赖一次碰撞回退。

## 环境与敌人视觉 <!--mem id:entry-3 created:2026-08-17 touched:2026-08-17-->
- Chose: 环境使用内嵌真实砖墙、混凝土和木箱贴图；敌人使用用户 FBX 转换的共享骨骼人体，并以随骨骼运动的贴合分段网格标记身体部位。
- Reason: 提升军事环境质感，在动态人体上继续支持精确部位命中，同时降低对可见高模逐三角求交的移动端成本。
- Rejected: 纯色环境和圆柱敌人。

## 敌人平衡重建
- Chose: 以 `20260824113019_9d67c06e.fbx` 为固定持枪母版，采用24节混合骨架、离线语义双骨权重、下半身二维移动混合、上半身瞄准和战斗动作叠加；主体供八个代号复用，普通/精英/王牌继续使用三档护甲，桌面使用50,008面近景，普通安卓使用17,990/3,999面两级并共享GPU资源。
- Reason: 用户无法提供已绑定FBX并明确确认混合重建；二维移动和上下半身分层解决上一技术预览只能滑动、射击姿态不明显的问题，同时维持普通安卓和10MB小工具预算。
- Rejected: 等待新的带骨骼FBX、继续放大旧19骨运行时粗权重动作、直接把FBX/OBJ放进发布包、八个代号各复制一套资源、让普通安卓渲染5万面高模。

## 当前武器模型方案 <!--mem id:weapon-model-split created:2026-08-22 touched:2026-08-23-->
- Chose: Glock 继续使用 `weapon.js` 内的程序化模型；AK/AWP 使用独立的 OBJ 与 PBR 贴图模块。模型接口实际为 `build(geometry, material)`，武器系统以 `build(null, material)` 调用。
- Reason: 保持离线交付并控制核心武器文件复杂度；文档必须与真实接口一致。
- Rejected: 把三把枪都描述为真实 OBJ，或继续把所有模型数据塞入 `weapon.js`。

## 射击反馈链路 <!--mem id:handfeel-three created:2026-08-23 touched:2026-08-23-->
- Chose: 保留命中标记、伤害飘字、数据驱动后坐、弹壳、枪口焰、切枪动画和四段换弹动画。
- Reason: 射击手感需要屏幕、枪模、音效和操作反馈同时存在。
- Rejected: 仅用弹孔和声音表示命中。

## 护盾补给 <!--mem id:entry-5 created:2026-08-18 touched:2026-08-18-->
- Chose: 敌人死亡时有18%概率掉落50点护盾；满盾不消耗拾取物，动态掉落在新局时清理。
- Reason: 让护盾保持稀缺和可规划，避免满资源时误吃补给。
- Rejected: 每波固定生成大量护盾或满盾仍消耗。

## AWP 视觉基准 <!--mem id:awp-v4-blueprint created:2026-08-22 touched:2026-08-23-->
- Chose: AWP 以用户提供的五视图设计图为视觉基准：哑光黑、军橄榄绿、拉丝钢、蓝色镜片、拇指孔枪托、展开两脚架和多孔制退器。
- Reason: 这是前三版被否定后确定的设计基线。
- Rejected: 沿用旧配色或凭印象重新设计。

## 历史正式基线归档 <!--mem id:release-baseline-20260823 created:2026-08-23 touched:2026-08-23-->
- Chose: 将用户确认的历史正式基线保存在 `archive/releases/cs1.5-minitool.zip`（6,781,624 B / MD5 `6cd23278cafbd369c38e1ae3844f3f4d` / 20 文件），不再放在工作区根目录。
- Reason: 当前最新游戏版本已经演进为混合骨骼审核候选；旧包仍需可追溯，但不能继续成为当前构建或验收输入。
- Rejected: 在根目录并列保留多个候选版本，或让历史正式包覆盖当前版本边界。

## 当前版本边界
- Chose: 当前源码使用 `tools/release-files.json` 定义 47 个发布文件；OBJ 双手包只生成到 `output/hands-candidate/`。用户确认真机通过的 42 文件压缩候选、根目录上一版候选和历史正式基线均保持原哈希，直到 47 文件双手候选完成真机验收并由用户明确决定晋升。
- Reason: 新增双手改变第一人称遮挡、三角面、贴图和包体，必须作为独立候选验收，不能让旧候选的真机结论跨版本继承。
- Rejected: 将 `cs1.5-minitool-balanced.zip`、`cs1.5-minitool-balanced-enemy.zip` 或历史正式基线继续作为根目录活动版本。

## 港口集装箱仓库地图资源
- Chose: 港口按需加载根目录量化 `map_model.js`、`map_collision.js`、`map_assets.js` 及 `port_base.webp` / `port_normal.webp` / `port_mr.webp` 作为离线视觉、结构性行走碰撞和 PBR；`map_collision.js` 从同版本视觉模型的 494 个结构盒写入 0.5m 栅格并合并为 138 个结构行走盒，`map.js` 另维护 4 个外围边界盒，共 142 个移动 AABB。港口弹道和敌人视线直接对真实导入模型做 `THREE.Raycaster`，漏检时使用同一模型派生阻挡层兜底，外围盒只作边缘兜底。`environment_materials.js` 让地面与边界复用公共混凝土配置；旧 509 个自动模型代理和白色低矮体块移入 `archive/assets/maps/container-port/legacy-runtime/`。
- Reason: 真机需要恢复模型材质和空间层次，同时解决旧近似射线与视觉模型错位导致的穿透/空气墙；行走使用轻量模型派生盒，射击与 AI 视线使用真实表面，分别满足性能和阻挡准确性。
- Additional boundary: 当前运行时不解析 OBJ/MTL/GLB；`tools/build-map-collision.js` 只在开发期从当前 `map_model.js` 生成碰撞数据，PBR 图通过包内相对图片路径加载，解码失败才使用程序化视觉兜底；环境材质配置不读取武器色彩。`?map=classic` 可作为初始回归入口，但不绕过运行中的地图锁定。
- Rejected: 将旧自动代理重新接回当前入口、把低矮浅灰体块放回移动碰撞层、让行走 AABB 代替港口弹道真实表面，或在移动端对整张高模每帧做物理查询。

## 地图选择与回合锁定
- Chose: 开局菜单和设置页共用“港口集装箱仓库/经典竞技场”选择器；开始回合时锁定 `selectedMapId`，运行中设置按钮禁用；只有玩家阵亡并从结算返回开始菜单后才能重新选择，胜利后的“再来一局”沿用原地图。
- Reason: 用户需要在真机开始前明确选择战斗场景，同时避免回合中热切换造成敌人、出生点、补给和地图碰撞引用不同步；把解锁点绑定到死亡结算能保持一次回合内地图稳定。
- Additional boundary: 切图会创建新的 `GameMap`，同步 `Player`、`WeaponSystem`、`PickupSystem` 和 HUD 小地图引用，并释放旧地图根节点、材质、贴图、阴影和固定补给；当前只开放已经具备完整玩法数据的两张地图。
- Rejected: 运行中直接热切换地图、仅切换背景而保留旧碰撞/补给，或让 URL 参数绕过回合锁定。

## 移动端性能与操作手感
- Chose: 采用“平衡方案”，普通安卓优先；默认使用手游式快速转身，并允许在设置中以70%~150%倍率调整。移动端 DPR 上限1.25、关闭 MSAA、普通触屏使用512阴影，低端触屏关闭实时阴影/法线/PMREM/点光源。
- Reason: 触控灵敏度只有在帧率稳定、起步响应快和追枪可控时才真正改善手感；自适应降级比全机型统一牺牲画质更稳妥。
- Rejected: 全设备最高画质、只提高单一灵敏度数值、覆盖未经真机验收的正式 ZIP。

## 小红书小工具容器能力合规
- Chose: 桌面瞄准也统一使用 Pointer Events、拖动与 pointer capture；不使用 Pointer Lock。Three.js 离线副本通过可重复脚本禁用项目未使用的联网加载分支。
- Reason: 用户指定的构建 Skill 明确禁止 Pointer Lock 和网络请求；统一 Pointer Events 还能与移动端触控链路共用更可靠的容器能力。
- Rejected: `requestPointerLock`、运行时 `fetch`、外链资源和依赖完整浏览器权限的输入方案。

## 当前小红书容器能力清单基线
- Chose: 以用户指定的《小工具容器 · 能力清单》（最后更新 2026-08-11）作为本项目后续容器能力判断的优先基线，全文保存在 `orbital/XHS_MINITOOL_CAPABILITY_LIST.md`。
- Reason: 该文档明确了 iOS/Android 双端的可用 Web 能力、离线资源规则、禁用 Web API/行为、WebGL 边界、三项 JS API 的完整字段约束和 FAQ；需要避免把旧版参考中的未复核能力带入实现。
- Rejected: 运行时联网、内联脚本/行内事件、WASM/Worker/iframe/下载/外链跳转、直接调用原生 bridge，以及仅凭旧参考使用当前文档未列出的 `openRedPage`、`pageType` 或 `live_photo_resources`。

## 设置页触摸滑块
- Chose: “按钮大小”和“转身灵敏度”保留原生 `input` 事件，同时增加 Pointer Events 拖动和无 Pointer Events 时的 Touch Events 降级；旋转态按可视矩形纵轴换算，并以单指占用保护拖动状态。
- Reason: 部分移动 WebView 在全局触摸策略或旋转容器下不会可靠更新原生 range；按轨道坐标主动提交值可以保持触摸控制、标签、布局、玩家灵敏度和 localStorage 同步。
- Rejected: 依赖浏览器原生 range 拖动或改用陀螺仪/设备方向能力；后者不在当前小红书容器能力基线内。

## 准星与命中标记
- Chose: 常驻准星提供经典十字、点式、圆环、实心十字和战术十字点五种预设；红色 X 只保留给命中/击杀反馈层，并通过 `crosshairStyle` 与布局设置一起持久化。
- Reason: 真机中红色 X 容易被误认为常驻准星；把瞄准定位和命中反馈拆成独立视觉层，既符合标准 FPS 认知，也允许玩家选择适合屏幕和武器的准星。
- Rejected: 用命中 X 作为常驻准星，或让准星样式选择改变命中判定、射线和散布逻辑。

## 设置中心纵向滚动
- Chose: 设置中心使用 `#settingsMenu` 原生 `overflow-y:auto`、`-webkit-overflow-scrolling:touch` 和 `touch-action:pan-y`；打开设置时暂时为 html/body 添加 `settings-open`，关闭设置或进入布局编辑时移除。
- Reason: 全局 `html, body { touch-action:none; }` 是游戏态触摸控制的保护，但会阻断真机设置页的默认滑动；仅在设置状态放行纵向手势，可以保留游戏态摇杆、视角和 FIRE 的事件边界。
- Additional boundary: 设置按钮使用 8px 位移阈值区分点按和滚动；超过阈值不触发按钮，避免从按钮区域开始滑动时被 `pointerdown.preventDefault()` 抢断。
- Rejected: 全局改为可滚动、手写 document 级 touchmove 滚动，或让设置滑动复用游戏视角控制。

## 旋转 WebView 设置页滚动兜底
- Chose: 在 `#settingsMenu` 上增加 Touch Events 手动滚动兜底；以触点移动的主轴判断屏幕方向，旋转态横向位移映射为逻辑纵向 `scrollTop`，并把结果限制在 `[0, scrollHeight - clientHeight]`。
- Reason: Playwright 强制横屏触控复现表明，旋转 `gameRoot` 后原生 `overflow-y:auto` 可以被程序/滚轮改变，但 Touch Events 不一定驱动原生滚动；真机错误还显示小红书 WebView 的 `Touch.target` 不是必填字段。
- Additional boundary: 文档级视角触摸监听对 `changedTouches`、触点对象和 `target.closest` 全部做防御判断；设置页触摸移动超过 8px 才 `preventDefault()`，短触仍交给按钮。
- Rejected: 取消整页旋转、依赖 `Touch.target` 做滚动判定，或让设置手势进入游戏视角控制。

## 设置返回与触摸动作清理
- Chose: 设置打开时记录原始状态；从 `playing` 进入关闭回到游戏，从 `paused` 进入关闭回到暂停；打开、关闭、暂停、结算和切后台统一清理 FIRE、视角指针、虚拟按键与摇杆闭包状态。
- Reason: 真机/WebView 可能丢失目标按钮的 `pointerup` 或 Touch Events，导致自动武器持续开火、枪模不断上抬或摇杆 `joyId` 永久占用；按入口恢复比依据当前瞬时 state 推断更稳定。
- Rejected: 只在按钮自身监听释放，或关闭设置时无条件回到菜单/游戏。

## 第一人称后坐力与死亡关镜
- Chose: 实际射击时分别施加相机正向 pitch 后坐和枪模 `viewKick`，无射击时后坐包络必须为零；恢复按武器数据回正，`clearScopeZoom()` 作为死亡、切枪、换弹和新局的唯一开镜清理入口。
- Reason: Three.js 前向量为 `-Z`，正向 X 旋转使枪口抬向 `+Y`；视角、枪模和开镜状态必须有独立但可复位的状态，避免静止漂移与 AWP 死亡后残留。
- Rejected: 让静止帧持续累加枪口角度，或只隐藏遮罩而保留 FOV/灵敏度状态。

## 港口模型碰撞
- Chose: 港口行走碰撞由 `map_collision.js` 从同版本模型的 494 个结构盒经过 0.5m 栅格合并得到的 138 个结构行走盒和 4 个外围边界盒组成，共 142 个移动 AABB；运行时玩家与敌人通过 `GameMap.moveCircle()` 以不超过 0.2m 的轨迹步长解算，并按 4m 空间分区取候选。港口玩家弹道、敌人弹道和敌人视线先通过 `THREE.Raycaster` 对导入视觉网格求交，漏检时使用同一模型派生阻挡层兜底，外围盒只作越界兜底。
- Reason: 旧 14 个手工盒会让未覆盖的白色墙面可穿透，也会让覆盖过宽的位置形成空气墙；从同版本模型生成行走盒可以减少人工错位，真实网格射线可以让建筑表面成为一致的弹道/视线阻挡。
- Rejected: 让 142 个行走 AABB 代替港口弹道真实表面、运行时为每个三角形创建物理对象、重新启用 509 个自动代理，或把低矮白色装饰放回移动碰撞层。

## 卧倒与匍匐
- Chose: 增加桌面 `Z` 和移动端「卧」按钮作为独立切换；卧倒通过平滑姿态量降低眼高和视角晃动，使用低速匍匐并保留移动、射线和射击；卧姿第一次按跳只站起，站立后再次按跳才离地。
- Reason: 用户需要保持触摸控制并在弹药耗尽前继续战斗；独立于蹲伏的开关态可避免长按丢失或 WebView 触点取消导致姿态不确定。
- Rejected: 只改变模型外观、不改变射线高度，或卧倒后完全锁死射击。

## 枪口火光与高频效果
- Chose: 三把当前武器共用离线生成的白热内芯、透明收尖火舌、加法混合 Canvas 光晕；桌面端增加无阴影短距离点光源，触屏端跳过点光源。弹道、命中特效和弹壳采用固定上限对象池。
- Reason: 分层短时效果比固定 X/圆点更接近常见射击视觉，同时不引入外部资源；Three.js 的透明材质、`AdditiveBlending`、`Sprite` 和短距离 `PointLight` 可以在保持资源离线的情况下表达亮度，池化避免连射时持续创建对象。
- Rejected: 引入网络特效贴图、让枪口火光常驻、为每发子弹创建不可回收粒子，或在普通触屏设备启用实时点光源。

## 触屏性能保护
- Chose: 冻结静态地图对象的矩阵更新；移动/射线使用空间分区；连续 30 帧超过时间预算时逐步降低触屏 DPR，严重时关闭实时阴影，玩法状态不受影响。
- Reason: 地图静态网格和短时反馈是移动端最稳定的优化边界；保守、单向的质量降级比每帧来回切换更不容易造成抖动。
- Rejected: 牺牲碰撞精度换帧率、无条件关闭所有画质，或宣称自适应策略替代真实设备验收。

## 对外品牌重命名
- Chose: 当前公开游戏名称统一为《一人不撤》，副标题统一为“离线 3D 触控生存射击”；当前候选包统一命名为 `yiren-buche-minitool-candidate.zip`。
- Reason: 名称突出当前单人波次生存和移动端触控体验，不绑定港口集装箱地图，也不使用容易产生竞品联想的旧公开标识，便于后续扩展地图和小红书开发记录。
- Additional boundary: 当前网页、README、PRD、验收资料和品牌物料使用新名称；内部代码命名、历史 ZIP、历史文档和 `archive/` 内旧品牌资料保持原样或按历史用途保留，不作为当前公开品牌。
- Rejected: 继续在当前公开入口使用旧游戏名称、把主名称绑定单一地图，或把未完成的联网/多人能力写入品牌定位。

## Touch-only WebView 输入回退
- Chose: 触屏优先使用 Pointer Events；不支持 Pointer Events 或只声明构造器却不派发触摸 pointer 的 WebView 仍由 `touchstart/touchmove/touchend` 兜底。左半屏浮动摇杆负责移动，右半屏空白区域负责视角，右 FIRE 负责开火和拖动追枪，左 FIRE 作为不拖视角的三指/四指独立开火键，跳/蹲/卧/换弹/切枪/开镜/暂停/设置各自消费自己的触点；所有动作按 owner 和 identifier 去重，多指事件只过滤真正重复的点。视角只接受右半屏起始触点。
- Reason: 小红书容器的输入能力可能因系统 WebView 版本不同而缺少 Pointer Events；只保留点按回退会让移动和 FIRE 拖动失效，或者让多指中第二根手指被误吞。明确左右手责任区更接近移动 FPS 的固定肌肉记忆，也保留当前游戏自己的 UI 与文案。
- Additional boundary: 文档视角监听不把 `Touch.target` 当作必填字段，优先用 `elementFromPoint`，再用交互控件可视矩形排除动作触点；双 FIRE 共用一个开火 owner，拒绝的第二个按下必须清理其局部 Pointer/Touch owner；失焦、切后台和可见性变化统一暂停并清理活动输入。
- Rejected: 同时无条件绑定 Pointer/Touch 两套按下链路、让左右 FIRE 互相覆盖活动指针，或假设所有 WebView 都提供完整的 `Touch.target` / `pointerup`。

## 触控 owner 与旋转设置边界
- Chose: 每个动作按钮、设置滑块和设置点按手势只接受一个活动触点；Pointer/Touch 的结束事件同时在目标元素和 document 级兜底处理，统一输入清理时重置闭包 owner。设置滚动只接受逻辑纵轴：普通视口为屏幕纵向，旋转 WebView 为屏幕横向；非法坐标直接丢弃，左半屏触点不会成为视角 owner。
- Reason: 真机可能丢失目标元素的 up/cancel，也可能在同一控件上出现多指或只派发 Touch Events；不限制 owner 会重复切姿态、持续开火或让旧触点阻塞下一次操作。旋转态错误轴滚动会让设置页看起来“无法操作”，有限值检查可避免 NaN 污染视角。
- Rejected: 让第二根手指覆盖第一根 owner、只依赖 pointer capture、把所有 Touch move 都转换为 scrollTop，或把无效坐标当作右半屏视角输入。

## 平板 HUD 与动作簇避让
- Chose: 平板以逻辑内容短边放大触控动作簇和暂停/设置按钮；弹药 HUD 固定移到动作簇左上方，保持信息可读和按钮可点击。
- Reason: 平板的 1.35 倍动作簇会覆盖右下默认弹药位置；根据同一 `--action-cluster-width` 变量避让，比针对单一分辨率写死像素更稳定。
- Rejected: 为了保留默认 HUD 位置而缩小平板动作按钮，或把遮挡问题留给用户自定义布局解决。

## 敌人弹药与卡墙恢复
- Chose: 每个敌人使用 18 发弹匣、54 发备弹和 1.5 秒换弹读条；弹药耗尽后只在 28m 搜索活动弹药包，取得 36 发备用弹量后仍必须走换弹流程。敌人出生和持续卡墙时使用同一地图碰撞层做安全位置复核，先移出结构内部，找不到安全点再采样开阔方向。
- Reason: 敌人也受资源与空间规则约束，能够给玩家留下换弹窗口，并避免敌人嵌入建筑后成为不可击杀目标；主动取弹复用玩家补给的消耗/重生路径，减少两套资源状态分叉。
- Rejected: 无限弹药、瞬时换弹、敌人穿过建筑取弹，或在每帧对全部弹药包做无间隔搜索。

## 敌方伤害设置
- Chose: 设置页增加敌方普通射击最低/最高伤害两个滑块，范围限制为 1～玩家最大生命值，默认 6～12 点，自动保证最低值不高于最高值；爆头倍率和精英额外伤害保留为独立加成。
- Reason: 让玩家可以按自己的生命/护甲节奏调节普通受击压力，同时避免存档或滑块输入产生超过生命上限、下限大于上限的无效配置。
- Rejected: 修改武器伤害、允许任意负值或超过玩家生命值的普通伤害，或把爆头/精英加成错误地并入普通伤害滑块。

## 启动与布局编辑边界
- Chose: 首屏只同步加载菜单所需的 6 个经典脚本；点击开始后由 `resource_loader.js` 按地图和设备档加载三枪、敌人、地图和图片，在加载层内等待解码、构建地图、编译着色器并生成非低端 PMREM。`#touchControls` 与隐藏 HUD 保持同级，布局编辑时显式显示，完成后按进入来源恢复状态。
- Reason: 把大脚本解析、图片解码、模型构建和一次性 GPU 工作移出菜单首屏及战斗帧，可降低启动假死和第一波长帧；控制层脱离 HUD 父节点后，设置编辑不会因 HUD 隐藏而出现“按钮位置保存了但看不见/拖不了”。
- Rejected: 在 `index.html` 同步加载全部模型/贴图脚本、把 PMREM 插入战斗帧、运行中反复重建环境，或在编辑态直接显示完整 HUD 代替独立控制层。

## 第一阶段模型压缩与敌人载荷拆分
- Chose: 港口位置/法线/UV 使用 Uint16 量化，AK/AWP 位置/UV 使用 Uint16、法线使用离线 Int8；索引拓扑保持不变。敌人移动首段只含 17,990 / 3,999 面两档，桌面按需追加独立 50,008 面高模及完整共享骨骼数据。构建输入固定保存在 `archive/assets/runtime-pre-compression/`，优化脚本输出必须可重复。
- Reason: 量化保持港口最大世界坐标误差约 0.47mm、AK/AWP 最大位置误差约 0.01mm 且法线角误差低于 0.38°，同时显著减少脚本体积、解析和移动端首段内存；桌面高模仍随包保留，不牺牲敌人完整表现。
- Rejected: 删除地图、敌人高模或三把枪核心资源，运行时重新计算武器法线，或把原始 OBJ/FBX/4096 贴图直接放入候选包。

## 第一人称双手模型方案
- Superseded for AK: AK 不再使用“旧 AK + 通用双手拼装”；改用 `archive/assets/ak47-grip/source-wz50-20260830/` 的 AK+双臂+双手整体 OBJ，构建期作为一个融合视图网格简化、量化并保留 UV/PBR。Glock/AWP 暂不套用该模型，继续原通用双手路径。
- Reason: 用户提供的融合网格已经包含正确持枪关系，强行拆手或继续叠加旧双手会复现错误握持；单网格也减少运行时节点和姿势错配。
- Current limits: 融合网格无骨骼，AK 换弹不拆独立弹匣，只驱动整体视图动作；当前画质融合候选为 39,674 面 / 86,131 顶点，尚未真机验收。
- Boundary: 源模型无骨骼或手指关节，本阶段只承诺整手刚性定位和换弹联动，不承诺五指包握、拉栓、独立弹匣拆装或精确 IK。
- Rejected: img2threejs 及用户后续提供的替代建模方案、运行时 OBJ 解析、联网生成、为三把枪复制三套手部几何，或把刚性结果宣传为手指级动画。

## AK 融合视图轴向契约
- Chose: `wz50` 原始模型以 +X 为枪口前方，运行时固定用 `mesh.rotation.y=+PI/2` 映射到 Three.js 视图前方 -Z；生成清单必须记录 `sourceForwardAxis`、`runtimeForwardAxis` 和旋转弧度，浏览器验收必须通过正式切枪路径核对。
- Reason: 真机错误图证明沿用旧 AK 的 `-PI/2` 会从枪口看向枪托并把双臂翻到画面两侧；`wz50` 与此前 `wz` 六个文件逐字节相同，替换文件夹不能修复运行时坐标错误。
- Rejected: 继续使用 `-PI/2`、仅靠调缩放/偏移掩盖反向，或直接改 `currentId` 生成未经过真实切枪状态的验收截图。

## AK V1 与 V2 画质容量融合档
- Chose: 当前发布候选只携带一套 `v1-v2-capacity-fusion` AK 资产：0.0085 减面单元得到 39,674 面 / 86,131 顶点，位置/UV 为 Uint16、法线为 Int8、索引为 Uint32；PBR 使用 1536 基础色、1536 法线和 768 无损 MR，并按设备能力限制到最高 8×各向异性。
- Reason: 相比 28,230 面 / 1024/1024/512 的轴向修复版，包体只增加约 681 KB 至 7,948,746 B，却同时改善折面密度、纹理清晰度和斜视角采样；不携带双套纹理可继续保留 10 MiB 内的安全余量。
- Rejected: 在一个候选中同时打包 V1/V2 两套贴图、直接使用全套 4K、提升移动 DPR 上限，或为追求低包体继续保持 28K 几何。
