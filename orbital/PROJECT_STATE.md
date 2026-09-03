<!--format PROJECT_STATE is what is true NOW: current focus, in-progress work, blockers, next steps. Overwrite stale lines; never append dated history. Every line must be understandable without this session's context: concrete names, no unexplained shorthand, no cross-references by list number. [user] flag — one judgment per line: does this need the user (their decision, their action, or something they'd be sorry to miss — including things they assigned to themselves)? If yes, insert [user] after the list marker of the line where the fact already lives: `- [user] <text>` or `3. [user] <text>`. Flagging marks a line, never creates one: one fact = one entry, never duplicated into another section. A dated commitment needing no decision is `[due:YYYY-MM-DD]` (shows on the calendar). Machine attributes (id, created, touched, resolved) live in a daemon-managed mem-comment on the next line — never write or edit these comments; leave them exactly where they are. Never auto-decide: spending money, sending external messages as the user, or irreversible/destructive acts are always surfaced, whatever the autonomy setting. Write timeless ("due Jul 28", never "tomorrow"). A line whose mem-comment carries resolved:<date> is settled — on consolidation rewrite it as the completed fact or drop it; never re-open or re-flag it. CLOSE THE LOOP THE SAME TURN: the moment the user answers a flagged line, decides it, or does it, remove the [user] flag from that line in this turn — rewrite the line as the settled fact (`- Chose option A.`) and leave the mem-comment alone. You are the only reader who can see both the flag and the user's answer; consolidation runs later, sees a truncated window, and cannot do this for you. A flagged line you leave behind after it is answered keeps nagging the user for something they already gave you. Never flag a question you asked during this session — flag the decision that is still genuinely open, written so someone who was not here can act on it.-->

# 当前状态

## 本轮状态
当前源码以加入双手之前、用户确认真机通过的 42 文件压缩候选为恢复基线，保留六级生涯击杀勋章、第四轮卡墙/启动修复、V2 多敌人性能和五档画面设置，并新增 M249、M9 刺刀、M26 手榴弹。M249 是 100/200 全自动重机枪；`J:\武器\M9` 的实际模型是 M9 bayonet，按无弹药近战接入；M26 每局两枚，使用世界投掷、连续地图碰撞、重力反弹、2.7 秒引信、7m 距离衰减和墙体遮挡。三套 50K 源 OBJ 与 4K PBR 已离线生成 35,951 面、2,318,939 B 的量化/WebP 运行时资源，源大文件不进入发布包。在此之上，2026-09-01 完成 P0+P1 压缩与稳定性轮：发布清单由 66 裁到 64 文件，环境贴图与 M249 albedo 重编码，并新增 WebGL 上下文恢复、Promise 拒绝上报和射击分配优化。最新轮又加入两处每 15 秒重生、每次补 1 枚的手榴弹专用补给包，库存封顶 2 枚，敌人死亡独立 15% 掉落手榴弹；小地图在保留独立开关/40%～100% 尺寸设置的同时进入按钮布局编辑，位置按归一化坐标保存，主菜单遮罩在编辑期间临时隐藏。用户于 2026-09-01 确认该精确候选（64 文件 6,638,812 B）真机测试无误。2026-09-03 真机反馈全系机型交战/扔雷严重卡顿与左下按钮重叠，随后完成性能修复轮：three-mesh-bvh（MIT）BVH 加速港口射线（消除 59,874 面全网格暴力遍历）、手榴弹探测降频、矩阵冻结、命中标记/飘字去强制回流、返回按钮移内容系左上并可拖放、性能诊断开关；12 测试文件 349 项全过（清单 v4=65 文件），候选 6,673,897 B / SHA256 `92771A6A…E68D`。该性能轮真机复验又报告三个设置/布局问题：①打开设置后游戏未自动暂停、②自定义按钮位置时“返回游戏”按钮拖不动、③设置完毕返回游戏后全部按钮消失。2026-09-03 15:00-16:00 修复轮已交付 `output/settings-layout-fix-candidate-20260903/yiren-buche-minitool-settings-layout-fix-unreviewed.zip`（65 文件 6,674,448 B / SHA256 `2A0163A0…B38D`）。根因②=返回按钮的 _bindTap 在 pointerdown 无 _editLayout 守卫、编辑态按下即 _returnDirectlyToGame 且把 _settingsReturnState 清空；③=清空后 _exitEditLayout 把 touchControls 误加 hidden（全按钮消失）+ 返回按钮被 _placeCustom 移入 #hud(z50) 后被设置遮罩(overlay z100)盖住点不到。修复=编辑态 tap 守卫、_enterEditLayout 保存 _layoutEditReturnState 路由快照供退出判定、_placeCustom 对返回按钮保留 #gameRoot 高层(z260)只改坐标不搬家。真实 Chromium 双档（桌面 1280×720 与触屏 412×915 旋转）行为门 `tools/verify-settings-layout-gate.js` 26/26 通过；tests 增 3 静态断言（21→24，总 352 项）。[user] ②③已修复待真机复验；①在双档模拟中均正确暂停（state=paused、玩家坐标冻结、无独立定时器驱动敌人），无法本地复现，判定为真机宿主/输入差异——请用户用新包复验并补充“打开设置后游戏继续”的具体现象（敌人移动/掉血/声音/画面转动/时间走表），以便针对性定位。全局 Reviewer 能力门禁保持严格，正式独立只读审查仍为“平台能力阻塞/未完成”。本项目上传权威口径是仅支持 `.zip`、单文件最大 10MB，旧的 2 MiB 只能作为非权威性能建议。当前无双手候选继续作为已确认稳定基线；新的第一人称双手手持武器工作作为独立 `3.0.0` 版本线筹备，不直接复活此前否决的历史候选。

## 当前活动版本
- “一人不撤”是一个纯静态、离线可运行的浏览器 FPS 小工具，使用原生 JavaScript、Three.js r160 和 Web Audio，无后端、无 npm 构建步骤。
- 当前真机候选 `output/settings-layout-fix-candidate-20260903/yiren-buche-minitool-settings-layout-fix-unreviewed.zip` 包含 65 个根目录文件，包体 6,674,448 B，SHA256 `2A0163A0799B160510E3247103054679BE96B6A98CBB90E437FC414553E1B38D`；在性能修复轮（BVH/手榴弹降频/矩阵冻结/HUD 去回流/性能诊断开关）之上修复三个真机设置/布局回归：返回按钮编辑态按下不再触发 _returnDirectlyToGame（_bindTap 加 `if (this._editLayout) return` 守卫）；`_enterEditLayout` 保存 `_layoutEditReturnState` 路由快照，`_exitEditLayout` 以快照判定 touchControls 显隐，杜绝 _settingsReturnState 被外部清空后误隐藏全部按钮；`_placeCustom` 对返回按钮只改坐标、保留在 #gameRoot 高层（CSS z-index 260 > overlay 100，`__cs15Home` 记录原父节点），设置遮罩打开时仍可点。发布清单 v4=65 文件，12 测试文件 352 项全过，真实 Chromium 行为门 `tools/verify-settings-layout-gate.js`（26 项：双档设置暂停/世界冻结/编辑拖动返回按钮/完成后按钮存活/返回按钮可点）全过，ES2017 清零，skill Node/Python 审计 0 错误、容量警告为非阻断通用建议，本地字节级校验通过。该包因 Reviewer 能力门禁阻塞而明确标记为 unreviewed，不得称为已审查正式包。上一性能轮候选 `output/bvh-perf-fix-candidate-20260903/` 保留为历史产物。
- 用户此前确认的 64 文件 `grenade-minimap-candidate-20260901`（6,638,812 B / SHA256 `09AE3C52…2334`）仍是唯一已真机确认的稳定基线；本轮卡墙修复复用既有 0.18 秒占位审计 + 12m 最近合法点迁移 + 上一个合法点回退（`isCircleFree` 结构盒/深层核心/墙线三段判定），并行会话还加强了审计独立性（敌人即使沿墙缓移也会每 0.18 秒复核占位）。旧候选 `output/grenade-minimap-candidate-20260901/`、`output/p0p1-stability-unreviewed-20260901/` 与 `output/p0p1-compression-candidate/` 保留为历史产物。
- 第四轮 51 文件 ZIP、第三轮 ZIP、第二轮候选与旧 42 文件真机确认包均未被覆盖；第四轮仍为 6,848,559 B / SHA256 `9CD75896470E0D0F76772F8C305B22B76E4961332395FE995CE24A9A5FF78551`，旧确认包仍为 6,498,622 B / SHA256 `9B4035F6F390434A2690473BD5CB3439C7C83EAF6C68809F3FD420A5AB49495B`；66 文件新增武器候选保留为 8,685,587 B / SHA256 `42F538B04D631506C0491CC5B66FE87D9AB6909F83A0C4DE0C1895B32A625764`，未被覆盖。
- 当前游戏包含 Glock-18（代码程序化模型，内部槽位仍名为 `usp`）、AK-47、AWP、M249、M9 刺刀和 M26 手榴弹，以及随机 8～12 波、普通/精英/王牌敌人、补给、护盾、小地图、合成音效和移动端触控。
- AK 第一人称已恢复为确认包中的原量化枪模与三张 PBR，不包含双臂或双手，运行时方向恢复为该确认包的既有 `rotation.y=-PI/2` 契约。`wz50`、通用双手、AK 融合握持和 img2threejs 均不进入当前方案。
- 当前敌人拥有 18 发弹匣、54 发备弹、2.2 秒换弹读条和装填后 0.45 秒举枪恢复；整个 2.65 秒窗口禁止射击，换弹时移动降至 55%。短暂部署后会主动寻找玩家，生命低于 55% 时搜索血包，总弹量低于 45% 时搜索弹药包。港口导航网格从真实移动边界生成；追击玩家共享按玩家格变化、最短 0.35 秒更新的流场，补给可达性继续使用确定性 A* 并复用同一组 TypedArray/堆工作区；首选补给不存在或不可达时会降级寻找另一类所需补给。敌人每 0.18 秒独立复核圆形占位是否合法，嵌入墙体或物件时优先迁移到 12m 内最近合法点，再回退到上一个合法点；冲锋只从中距离发起，进入 7.5m 后结束并持续约 1.25 秒侧移后撤。设置页可选择简单、中等、困难、灾难级四档 AI 难度，并调整 0～100% 护甲掉率；爆头击杀固定掉落弹药、血包和护甲，所有敌人死亡另独立按 15% 概率追加手榴弹包。
- 当前版本已包含击杀提示参数保留、蹲伏眼高射线、切枪清零散布和 PowerShell 5.1 兼容校验修复。
- 设置页“按钮大小”和“转身灵敏度”已支持移动端 Pointer Events 与老 WebView Touch Events 单指拖动；旋转态按可视轨道换算，并即时同步标签、布局、玩家灵敏度与 localStorage。
- 设置页已增加五种标准准星预设（经典十字、点式、圆环、实心十字、战术十字点）；准星样式与布局一并保存，命中/击杀红色 X 保持为独立短暂命中标记。
- 设置页已增加移动端原生纵向滚动与 Touch Events 手动兜底：打开设置时同步切换 html/body 的 `settings-open`，设置层使用 `overflow-y:auto` 与 `pan-y`；旋转 WebView 不驱动原生滚动时按触点主轴手动更新 `scrollTop`；设置按钮采用 8px 移动阈值，滑动不误触发，关闭设置或进入布局编辑时恢复游戏态全局触摸策略。文档级触摸监听已防御缺失的 `Touch.target`。
- 设置页已按进入来源恢复状态：游戏态进入后关闭回到游戏，暂停态进入后关闭回到暂停；设置、暂停、结算和切后台会统一释放 FIRE、视角、移动按键并重置按钮/滑块/设置滚动/摇杆的输入 owner 闭包，兼容丢失 `pointerup` 的真机/WebView；旋转设置滚动只消费屏幕横轴，非法视角坐标会被丢弃。
- 自定义按钮编辑态的 `#touchControls` 已从隐藏 HUD 中拆为同级控制层；进入编辑时控制层可见，左摇杆、动作按钮和仍保留在 HUD 内的小地图按逻辑内容坐标保存。若从主菜单设置进入，主菜单遮罩会在编辑期间临时隐藏，避免截获拖动；完成后按来源精确恢复 HUD、小地图、控制层和主菜单状态。
- 触屏控制同时支持 Pointer Events 与 Touch Events：现代容器优先走 Pointer Events，声明构造器但不派发触摸 pointer 的部分 WebView 也保留 Touch Events 兜底；左半屏浮动摇杆负责移动，右半屏空白区负责视角，右侧 FIRE 负责开火/拖动追枪，左侧 FIRE 负责三指/四指独立开火且不拖视角，跳/蹲/卧/换弹/切枪/开镜/暂停/设置各自消费触点。视角只从屏幕右半侧开始，Pointer/Touch 按最近触点坐标去重，多指事件只过滤全部重复的触点，文档级视角触点会用 `elementFromPoint`/控件矩形排除缺失 `Touch.target` 的动作触点。失焦、切后台和可见性变化会暂停游戏并清理活动触点。
- 平板短边达到 600px 时按 `visualViewport` 逻辑尺寸放大动作簇和暂停/设置按钮；弹药 HUD 会移到动作簇左上方，避免信息被放大的动作按钮遮挡。
- 小地图默认使用各设备响应式基准的 50%（桌面 80px、普通触屏 54px、矮横屏 42px，平板按原响应式值折半），设置页可以独立开关并在 40%～100% 间以 10% 步长调节；关闭后 HUD 停止小地图绘制。布局编辑中小地图可以像按钮一样自由拖放，中心位置以 0～1 归一化坐标保存并在横竖尺寸变化后按比例恢复，尺寸不与按钮缩放叠乘，日常游戏保持触控穿透。
- 第一人称后坐力使用独立 `recoilOffset` 叠加到相机与弹道，恢复只衰减该偏移、不再扣玩家基础 `pitch`；换弹下沉量在时间轴计算后应用，动画结束帧隐藏临时弹匣，AK 一体 OBJ 不再叠加假弹匣。
- 已新增卧倒/匍匐姿态：桌面 `Z` 与移动端「卧」按钮切换；卧倒平滑降低眼高至约 0.72m、使用约 2.2m/s 匍匐速度并保留移动和射击；第一次按跳只恢复站姿，站立后再次按跳才离地。
- 命中/击杀红色 X 只作为独立短时反馈，HUD 会在动画结束后自动清除；常驻准星继续由五种可选样式单独负责。
- Glock、AK、AWP、M249 四种枪械使用离线 Canvas/几何生成的分层枪口火光：白热内芯、两片交叉轴向火焰、相机朝向辉光、气环和桌面端无阴影短点光源；M9 与 M26 不生成枪口火光。AWP 单发基础伤害为 140。
- 首屏同步加载 `config.js`、`three.min.js`、`hud.js`、`audio.js`、`medal_system.js`、`medal_ui.js`、`medal_share.js`、`resource_loader.js` 和 `main.js`；六张勋章图按需加载。地图、敌人、六种武器资源及其贴图在点击开始后按所选地图加载（P0 起全部设备统一触屏路径），图片在触屏以两路、桌面以三路受控并发解码；加载层内构建地图并优先异步预编译着色器，PMREM 只在桌面生成。
- 高频弹道、命中特效和弹壳采用有上限对象池；静态地图网格冻结矩阵。画面设置独立保存在 `cs15_graphics_v1`：自动档在普通触屏以 1.25×、2×各向异性、接触阴影和平衡特效/动画起步，在低端触屏自动采用 0.85×、关闭阴影、低特效和省性能动画；流畅/平衡/高清的触屏目标分别为 0.85×/1.15×/1.35×，自定义上限为 1.35×。触屏设备以 120 帧窗口记录 P50/P95/P99；开启性能保护时超预算会单向降低 DPR，旋转和 resize 不恢复已降级值，P95 连续三个窗口高于 38ms 时只把同时活动敌人数从 4 降到 3，总波次数与待生成队列不变。
- AWP 开镜已集中由 `clearScopeZoom()` 清理，死亡结算、切枪、换弹和新局都会恢复 FOV、普通准星和开镜灵敏度；死亡时隐藏狙击镜按钮。
- 敌人使用 24 节共享骨架、离线语义双骨权重、二维移动混合、上半身瞄准与射击/受击/近战/死亡动作层；运行时只解析 17,990 / 3,999 面两档，P0 起桌面端不再合并 50,008 面高模，`enemy_model_hd.js` 留在工作区供测试但不再进入发布包。
- 当前默认地图是“港口集装箱仓库”，另有“经典竞技场”可选：港口 `map_model.js` 使用 Uint16 量化位置/法线/UV，最大世界坐标误差约 0.47mm；`map_assets.js` 加载三张包内 PBR。港口正常移动仍以可见模型的 8,732 条竖直墙线为权威；138 个模型派生结构盒只在圆心进入比实体半径更深的核心区域时判定异常，并继续提供站立高度支撑，不在外缘参与普通阻挡。弹道和视线直接对真实导入网格求交，4 个外围边界盒限制可玩区。开局菜单与设置页均可选图，回合开始后锁定，只有死亡结算返回开始菜单后解锁。
- 当前自动化回归 12 个测试文件共 352 项通过，发布 JavaScript 全部通过语法检查（含 BVH 库 ES2020 零语法、清单 v4/65 断言）；`tools/verify-settings-layout-gate.js` 在桌面 1280×720 与触屏 412×915（isMobile+hasTouch+旋转）双档执行设置/布局 26 项行为断言全部通过（打开设置暂停且世界冻结、编辑态按下返回按钮不返回并可拖放、完成编辑后按钮存活、设置内返回按钮可点）。Chromium 390×844/844×390 实际拖动验证确认小地图可成为命中栈顶目标，拖动后保存归一化坐标并在尺寸变化后按比例恢复；运行时验证确认两处固定手榴弹包存在、0 枚拾取后变 1 枚并进入 15 秒重生、满 2 枚不消耗、动态手榴弹掉落可加入补给系统。`tools/verify-webgl-context-recovery.js` 在桌面 1280×720 与触屏 412×915 配置中各执行 4 次 WebGL 上下文丢失/恢复，33/33 断言均通过；这些均为本机 Chrome 或移动模拟，不是真机 GPU、宿主切后台、触摸手感或性能结论。
- 用户已确认 64 文件 `grenade-minimap-candidate-20260901` 精确候选真机测试无误；该结论绑定 6,638,812 B、SHA256 `09AE3C5222A53E93D7A861A11B127833E46088E049B3E2C546A1132520DF2334`，设备型号、系统/小红书版本、测试时长、温度、录像和逐项清单未提供，不能外推到后续 3.0.0 候选。独立只读审查仍因严格 Reviewer 能力门禁处于平台能力阻塞。
- 新第一人称双手手持武器版本线从 `3.0.0` 开始筹备；设置页面底部必须显示由单一版本源提供的游戏版本号，每次接受并打包的新迭代自动更新版本号。外部参考评估已经完成：`ThreeJS_FPS_2.0` 是技术栈最接近的直接运行参考，NeoFPS 官方文档提供最完整的双手/武器分离架构，HordeShooter 的武器 Socket 与分武器手臂动画适合作为动作契约，Godot simple FPS weapon system 适合作为数据驱动状态参考；最终采用这些思想的本项目原生混合方案，不复制任一仓库的运行时代码或资产。
- `3.0.0` 计划使用相机下独立 `FPViewRoot`，由程序化后坐、晃动、切枪和 ADS 驱动；其下放置一套共享 `SkinnedMesh` 双臂和当前六种独立武器，右手/左手、枪口、瞄具、抛壳、弹匣及武器特有动作点使用统一命名挂点。首版使用离线烘焙动画与挂点校验，不引入 GLTFLoader、CCDIKSolver 或每帧全身 IK；相机、弹道和枪口仍由既有权威根节点控制，双手动画不得反向改变射击方向。
- `3.0.0` 新手臂资产应放在新的 `J:\武器\手_v3`，不得覆盖旧 `J:\武器\手`；首选提供带骨骼和蒙皮的 `.blend`，也可用 FBX/GLB，单纯 OBJ 不能承载手指骨骼和动作。双臂目标 8,000～12,000 三角面、最多 44 骨骼、每顶点最多 4 个权重、单套材质/图集、运行时最高 1024 贴图，并分别为 Glock、AK、AWP、M249、M9 刺刀和 M26 提供正确握持参考及必要动作。
- 当前真机基线 ZIP 仍为 6,638,812 B，距离十进制 10,000,000 B 上限有 3,361,188 B；`3.0.0` 双手新增运行时资源预算不超过 2,000,000 B，目标为几何/蒙皮 450KB、动画 550KB、贴图 750KB、代码/元数据 150KB，并至少保留约 1.36MB 打包余量。Blender/FBX/高分辨率母版只作为离线输入，不进入 ZIP。版本单一事实源、动画运行时和新资产尚未实施，当前稳定候选没有发生变化。
- 用户指定的《小工具容器 · 能力清单》（适用 iOS/Android，最后更新 2026-08-11）全文保存在 `orbital/XHS_MINITOOL_CAPABILITY_LIST.md`，作为容器开发的优先能力基线。
  <!--mem id:905c69 created:2026-08-21 touched:2026-08-21-->

## 当前活动文件与资料
- 根目录活动运行时由 `index.html`、`style.css`、逻辑/资源 JavaScript、`three_mesh_bvh.umd.js`（MIT 射线加速库）、量化地图/武器/敌人载荷和 30 张包内图片组成；`tools/release-files.json` v4 固定 65 个 ZIP 发布文件（P0 裁剪后新增 BVH 库），不包含双手资源。
- `tools/package.ps1` 默认生成 `output/compression-candidate/` 下的独立候选；`tools/verify-minitool-package.ps1` 读取同一发布清单并从 `archive/releases/cs1.5-minitool.zip` 锁定历史正式基线；`tools/optimize-runtime-models.js` 和 `tools/optimize-runtime-textures.py` 从归档输入确定性生成当前优化资产。
- `tests/` 保留资产压缩、数学、行为、真机问题、玩法修复、性能、敌人骨骼、小工具合规、运行时回归、港口地图资产、勋章和新增武器专项回归 12 个测试文件。
- `README.md`、`PRD.md`、`docs/当前版本分析与归档索引.md`、`docs/真机验收清单.md`、`docs/敌人平衡重建-验证摘要.md` 是当前版本说明、需求、归档、实机验收和敌人审核资料。
- `orbital/XHS_MINITOOL_CAPABILITY_LIST.md`、`.codex/` 和当前 2026-08-27 一人不撤营销草稿/视觉提示词属于当前维护资料；旧品牌物料已移入 `archive/marketing/`。
- `output/medals/` 保存六级击杀勋章高清 PNG 母版、概念板和提示词；`output/medals/runtime-512/` 保存根目录六张 512×512 WebP 的源副本，六张合计 316,572 B。勋章功能已接入 51 文件候选；旧 42 文件用户确认包未改变。
- `output/new-weapons-candidate/` 保存 66 文件新增武器历史候选；`output/p0p1-compression-candidate/` 与 `output/p0p1-stability-unreviewed-20260901/` 保存 P0+P1 历史候选；`output/grenade-minimap-candidate-20260901/` 保存当前 64 文件未审查真机候选及 64 文件平铺审计副本；`output/playwright/new-weapons-20260901/` 保存三种新武器浏览器截图，`output/playwright/webgl-context-recovery-20260901/` 保存桌面/触屏 WebGL 恢复报告与截图。
- `archive/releases/rollback-snapshots/pre-p0p1-compression-20260901/` 保存 P0+P1 轮修改前 18 个原始文件（resource_loader/main/weapon/textures、发布清单 v2、两个测试文件、11 张贴图原件，含 env_concrete.jpg），可精确回退本轮工作区修改；`tools/reencode_textures_p1.py` 是本轮贴图重编码的确定性脚本。

## 归档边界
- `archive/releases/` 保存历史正式基线、平衡性能候选、敌人技术预览、港口地图之前的混合骨骼审核候选 ZIP，以及本轮压缩前根候选的同哈希备份。
- `archive/releases/rollback-snapshots/v2-enemy-performance-before-20260831/` 保存 V2 修改前 11 个核心/测试文件及 SHA-256 清单，可用于精确回退本轮工作区修改。
- `archive/releases/rollback-snapshots/graphics-settings-before-20260831/` 保存画面设置实施前的 10 个运行时文件、性能测试和四份 Orbital 状态文档，可用于回退本轮画面配置改动。
- `archive/releases/rollback-snapshots/pre-new-weapons-20260901/` 保存新增武器实施前 16 个运行时、发布清单和文档文件，可用于非 Git 工作区回退。
- `archive/deliverables/` 保存旧 PRD、架构、纹理、验收和软件团队阶段交付物；`archive/design-references/` 保存不再驱动当前版本的 AWP 参考资料。
- `archive/marketing/` 保存旧品牌文案、Logo、封面和截图；`archive/assets/uploads/uploads/` 保存原始上传图；`archive/assets/textures/` 保存不再参与当前构建的旧贴图。
- `archive/assets/runtime-pre-compression/` 保存本轮模型压缩的固定输入；`archive/tooling/legacy/` 保存一次性模型/图片分析、重建、替换、缩放、安装脚本和 Python 生成缓存；`archive/tooling/skill-copy/.skill/` 保存旧 `.skill/` 副本；`archive/tooling/plugins/plugins/` 保存非运行时插件资料。
- `archive/assets/hands/source-20260829/` 仅保存已撤回双手 OBJ/MTL/PBR 的历史源快照；构建清单和双手专用工具已移入本次回滚快照，不再属于当前维护内容。
- `archive/assets/ak47-grip/source-wz50-20260830/` 保存用户确认正确握持的 `wz50` 六个源文件；`archive/assets/ak47-grip/previous-runtime-wrong-axis-20260830/` 保存修复前错误轴向运行时资产。
- `archive/assets/ak47-grip/pre-quality-fusion-20260830/` 保存画质融合前正确轴向的 28K/1K 运行时和相关构建/验证源码，可用于对照或恢复。
- `archive/verification/playwright-cli/.playwright-cli/` 保存过程日志和快照；这些目录不参与入口加载、测试默认路径或当前 ZIP 构建。
- `$RECYCLE.BIN` 是 Windows 系统回收站元数据，不属于项目内容，本次保持不动。

## 已知技术债
- 真机反馈对应的敌人嵌墙/箱、启动与场景卡顿已形成第四轮修复；大量敌人性能 V2、独立画面设置、三种新增武器、手榴弹补给/掉落和小地图自由布局均已在工作区实现并通过自动化与浏览器移动模拟。当前 64 文件候选已完成 P0+P1 压缩、WebGL 恢复、小地图拖放和补给链验证，并由用户确认精确候选真机测试无误；严格 Reviewer 能力门禁因原生接口缺少可核验运行时身份/只读沙箱证据而阻止创建 Reviewer，独立只读审查仍未完成，后续 `3.0.0` 双手候选也尚无任何真机结论。
- 当前已确认稳定版本没有第一人称双手模型；历史双手 OBJ 与 AK 融合握持方案均已撤回，只能作为失败经验和可恢复资料。独立 3.0.0 双手版本线的参考架构、资产契约和容量预算已经确定，但版本单一事实源、共享骨架、六武器挂点/动画、离线转换管线、自动化、浏览器验证、ZIP 和真机验收均尚未实施。
- 当前目录不是 Git 仓库，源码开发缺少版本控制保护。
- 用户 FBX 是单一静态 Mesh，包含 50,008 面、UV 和原生法线，但没有 Skin/Cluster、骨骼或动画；当前语义双骨权重由离线转换脚本生成，精度不等同于美术师手工绑定。
- 人体、双臂和步枪焊在固定持枪网格；混合重建可形成可读步态、分层瞄准和射击反馈，但无法实现精确手指、拉栓、弹匣拆装或完全独立武器动作。
- 敌人追击与补给搜索已使用完整 A* 网格，但网格为 1m 离散近似，动态敌人之间仍采用局部分离而不是动态重规划障碍；当前无联网、商城、皮肤、买枪经济和穿墙子弹。
- 港口地图正常移动仍由真实可见模型垂直面提取的二维边界负责；模型派生盒仅识别深层实体内部，不参与外缘普通阻挡或弹道。模型三角面、结构核心、导航网格和真机拥挤组合仍需在设备上走遍关键通道，自动化与 Chromium 不能证明所有真机路线零嵌入。
- 地图选择当前只暴露港口和经典两张已接入完整出生点、视觉层、碰撞和射线逻辑的地图；回合中不允许热切换，阵亡后从结算返回开始菜单才能更换，新增地图需补齐同样的资源和回归验证。

## 约束
- 发布产物仅支持 `.zip`，必须离线运行、根目录平铺、入口为 `index.html`，单文件最大 10MB；旧的 2 MiB 不是本项目平台限制或失败条件。
- 禁止依赖运行时外链、临时文件路径持久化、强制全屏、Pointer Lock 和未经验证的容器能力；设置可使用隔离的 `localStorage`，但核心玩法不得依赖存储成功。
