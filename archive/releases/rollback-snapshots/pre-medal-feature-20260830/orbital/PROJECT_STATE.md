<!--format PROJECT_STATE is what is true NOW: current focus, in-progress work, blockers, next steps. Overwrite stale lines; never append dated history. Every line must be understandable without this session's context: concrete names, no unexplained shorthand, no cross-references by list number. [user] flag — one judgment per line: does this need the user (their decision, their action, or something they'd be sorry to miss — including things they assigned to themselves)? If yes, insert [user] after the list marker of the line where the fact already lives: `- [user] <text>` or `3. [user] <text>`. Flagging marks a line, never creates one: one fact = one entry, never duplicated into another section. A dated commitment needing no decision is `[due:YYYY-MM-DD]` (shows on the calendar). Machine attributes (id, created, touched, resolved) live in a daemon-managed mem-comment on the next line — never write or edit these comments; leave them exactly where they are. Never auto-decide: spending money, sending external messages as the user, or irreversible/destructive acts are always surfaced, whatever the autonomy setting. Write timeless ("due Jul 28", never "tomorrow"). A line whose mem-comment carries resolved:<date> is settled — on consolidation rewrite it as the completed fact or drop it; never re-open or re-flag it. CLOSE THE LOOP THE SAME TURN: the moment the user answers a flagged line, decides it, or does it, remove the [user] flag from that line in this turn — rewrite the line as the settled fact (`- Chose option A.`) and leave the mem-comment alone. You are the only reader who can see both the flag and the user's answer; consolidation runs later, sees a truncated window, and cannot do this for you. A flagged line you leave behind after it is answered keeps nagging the user for something they already gave you. Never flag a question you asked during this session — flag the decision that is still genuinely open, written so someone who was not here can act on it.-->

# 当前状态

## 本轮状态
当前活动版本已严格恢复为加入双手之前、用户确认真机通过的 42 文件压缩候选。根目录不再包含 `hands_*`，AK 也不再使用 `wz50` 融合双臂模型；后续双手、轴向修复和 V1/V2 画质融合候选全部转为历史归档。Reviewer 运行时仍无法满足强制 `read-only`，所以正式只读审查没有结论。

## 当前活动版本
- “一人不撤”是一个纯静态、离线可运行的浏览器 FPS 小工具，使用原生 JavaScript、Three.js r160 和 Web Audio，无后端、无 npm 构建步骤。
- 当前源码与 `output/pre-hands-restored-candidate/yiren-buche-minitool-pre-hands-confirmed-original.zip` 的 42 个根目录文件逐字节一致；包体 6,498,622 B，SHA256 `9B4035F6F390434A2690473BD5CB3439C7C83EAF6C68809F3FD420A5AB49495B`，与用户此前真机确认通过的原始候选本体相同。
- 当前游戏包含 Glock-18（代码程序化模型，内部槽位仍名为 `usp`）、AK-47（离线 OBJ）和 AWP（离线 OBJ），以及随机 8～12 波、普通/精英/王牌敌人、补给、护盾、小地图、合成音效和移动端触控。
- AK 第一人称已恢复为确认包中的原量化枪模与三张 PBR，不包含双臂或双手，运行时方向恢复为该确认包的既有 `rotation.y=-PI/2` 契约。`wz50`、通用双手、AK 融合握持和 img2threejs 均不进入当前方案。
- 当前敌人拥有 18 发弹匣、54 发备弹和 1.5 秒换弹读条；备弹归零后会在 28m 内搜索活动弹药包，取得 36 发后再进入换弹。设置页的敌方普通射击最低/最高伤害默认是 6～12 点，自动限制到玩家最大生命值范围并保持下限不高于上限。
- 当前版本已包含击杀提示参数保留、蹲伏眼高射线、切枪清零散布和 PowerShell 5.1 兼容校验修复。
- 设置页“按钮大小”和“转身灵敏度”已支持移动端 Pointer Events 与老 WebView Touch Events 单指拖动；旋转态按可视轨道换算，并即时同步标签、布局、玩家灵敏度与 localStorage。
- 设置页已增加五种标准准星预设（经典十字、点式、圆环、实心十字、战术十字点）；准星样式与布局一并保存，命中/击杀红色 X 保持为独立短暂命中标记。
- 设置页已增加移动端原生纵向滚动与 Touch Events 手动兜底：打开设置时同步切换 html/body 的 `settings-open`，设置层使用 `overflow-y:auto` 与 `pan-y`；旋转 WebView 不驱动原生滚动时按触点主轴手动更新 `scrollTop`；设置按钮采用 8px 移动阈值，滑动不误触发，关闭设置或进入布局编辑时恢复游戏态全局触摸策略。文档级触摸监听已防御缺失的 `Touch.target`。
- 设置页已按进入来源恢复状态：游戏态进入后关闭回到游戏，暂停态进入后关闭回到暂停；设置、暂停、结算和切后台会统一释放 FIRE、视角、移动按键并重置按钮/滑块/设置滚动/摇杆的输入 owner 闭包，兼容丢失 `pointerup` 的真机/WebView；旋转设置滚动只消费屏幕横轴，非法视角坐标会被丢弃。
- 自定义按钮编辑态的 `#touchControls` 已从隐藏 HUD 中拆为同级控制层；进入编辑时控制层可见，左摇杆和动作按钮按旋转后的逻辑内容坐标保存，完成编辑后仍按来源恢复隐藏/显示状态。
- 触屏控制同时支持 Pointer Events 与 Touch Events：现代容器优先走 Pointer Events，声明构造器但不派发触摸 pointer 的部分 WebView 也保留 Touch Events 兜底；左半屏浮动摇杆负责移动，右半屏空白区负责视角，右侧 FIRE 负责开火/拖动追枪，左侧 FIRE 负责三指/四指独立开火且不拖视角，跳/蹲/卧/换弹/切枪/开镜/暂停/设置各自消费触点。视角只从屏幕右半侧开始，Pointer/Touch 按最近触点坐标去重，多指事件只过滤全部重复的触点，文档级视角触点会用 `elementFromPoint`/控件矩形排除缺失 `Touch.target` 的动作触点。失焦、切后台和可见性变化会暂停游戏并清理活动触点。
- 平板短边达到 600px 时按 `visualViewport` 逻辑尺寸放大动作簇和暂停/设置按钮；弹药 HUD 会移到动作簇左上方，避免信息被放大的动作按钮遮挡。
- 第一人称后坐力已修正为实际射击触发的正向 pitch 上抬，恢复时反向回正；静止更新不会改变枪口角度，切枪/新局会清除枪模后坐力。
- 已新增卧倒/匍匐姿态：桌面 `Z` 与移动端「卧」按钮切换；卧倒平滑降低眼高至约 0.72m、使用约 2.2m/s 匍匐速度并保留移动和射击；第一次按跳只恢复站姿，站立后再次按跳才离地。
- 命中/击杀红色 X 只作为独立短时反馈，HUD 会在动画结束后自动清除；常驻准星继续由五种可选样式单独负责。
- 三把当前武器均使用离线 Canvas/几何生成的分层枪口火光（白热内芯、透明收尖火舌、加法混合光晕；桌面端增加无阴影短点光源），效果资源不依赖网络。
- 首屏只同步加载 `config.js`、`three.min.js`、`hud.js`、`audio.js`、`resource_loader.js` 和 `main.js`；地图、敌人、三枪及其贴图在点击开始后按所选地图/设备档加载，加载层内等待图片解码、构建地图、编译着色器并生成非低端 PMREM，战斗帧不插入这些一次性工作。
- 高频弹道、命中特效和弹壳采用有上限对象池；静态地图网格冻结矩阵，触屏设备以 120 帧窗口记录 P50/P95/P99，超预算时单向降低 DPR，严重时关闭实时阴影。
- AWP 开镜已集中由 `clearScopeZoom()` 清理，死亡结算、切枪、换弹和新局都会恢复 FOV、普通准星和开镜灵敏度；死亡时隐藏狙击镜按钮。
- 敌人使用 24 节共享骨架、离线语义双骨权重、二维移动混合、上半身瞄准与射击/受击/近战/死亡动作层；移动首段只解析 17,990 / 3,999 面两档，桌面再按需合并 50,008 面高模，三档内容仍完整保存在发布包。
- 当前默认地图是“港口集装箱仓库”，另有“经典竞技场”可选：港口 `map_model.js` 使用 Uint16 量化位置/法线/UV，最大世界坐标误差约 0.47mm；`map_assets.js` 加载 `port_base.webp`、`port_normal.webp` 和打包金属/粗糙度 `port_mr.webp`。`map_collision.js` 将同版本模型的 494 个结构盒写入 0.5m 栅格并合并为 138 个结构行走盒，`map.js` 另维护 4 个外围边界盒，共 142 个移动 AABB，地面与边界复用 `environment_materials.js` 的公共混凝土配置，环境层不引用武器色彩。港口玩家弹道、敌人弹道和敌人视线先对真实导入模型求交，漏检时共享同一模型派生阻挡层兜底；开局菜单与设置页均可选图，回合开始后锁定，只有死亡结算返回开始菜单后解锁。
- 当前自动化回归 9 个测试文件共 246 项通过，39 个活动、测试与工具 JavaScript 通过 `node --check`；Windows PowerShell 5.1 / `pwsh` 均通过原始 42 文件确认包精确校验，包内文件与工作区逐字节一致。Chrome/Playwright 桌面与低端移动敌人验证无应用错误，移动 DPR 为 1.25。
- 用户已确认本轮 42 文件独立压缩候选完成真机测试并通过；此结论按用户验收确认记录。仓库尚未保存设备型号、系统/客户端版本、录屏或逐项结果，因此只记录“该候选真机通过”，不扩展为未提供的设备矩阵和性能细项。
- 用户指定的《小工具容器 · 能力清单》（适用 iOS/Android，最后更新 2026-08-11）全文保存在 `orbital/XHS_MINITOOL_CAPABILITY_LIST.md`，作为容器开发的优先能力基线。
  <!--mem id:905c69 created:2026-08-21 touched:2026-08-21-->

## 当前活动文件与资料
- 根目录活动运行时由 `index.html`、`style.css`、逻辑/资源 JavaScript、量化地图/武器/敌人载荷和 15 张包内图片组成；`tools/release-files.json` 固定 42 个 ZIP 发布文件，不包含双手资源。
- `tools/package.ps1` 默认生成 `output/compression-candidate/` 下的独立候选；`tools/verify-minitool-package.ps1` 读取同一发布清单并从 `archive/releases/cs1.5-minitool.zip` 锁定历史正式基线；`tools/optimize-runtime-models.js` 和 `tools/optimize-runtime-textures.py` 从归档输入确定性生成当前优化资产。
- `tests/` 保留资产压缩、数学、行为、玩法修复、性能、敌人骨骼、小工具合规、运行时回归和港口地图资产回归 9 个测试文件。
- `README.md`、`PRD.md`、`docs/当前版本分析与归档索引.md`、`docs/真机验收清单.md`、`docs/敌人平衡重建-验证摘要.md` 是当前版本说明、需求、归档、实机验收和敌人审核资料。
- `orbital/XHS_MINITOOL_CAPABILITY_LIST.md`、`.codex/` 和当前 2026-08-27 一人不撤营销草稿/视觉提示词属于当前维护资料；旧品牌物料已移入 `archive/marketing/`。
- `output/medals/` 保存六级击杀勋章高清 PNG 母版、概念板和提示词；`output/medals/runtime-512/` 保存统一 512×512、带 Alpha 的 WebP 运行时候选，六张合计 316,572 B。勋章功能尚未接入，当前 42 文件发布清单和用户确认包均未改变。

## 归档边界
- `archive/releases/` 保存历史正式基线、平衡性能候选、敌人技术预览、港口地图之前的混合骨骼审核候选 ZIP，以及本轮压缩前根候选的同哈希备份。
- `archive/deliverables/` 保存旧 PRD、架构、纹理、验收和软件团队阶段交付物；`archive/design-references/` 保存不再驱动当前版本的 AWP 参考资料。
- `archive/marketing/` 保存旧品牌文案、Logo、封面和截图；`archive/assets/uploads/uploads/` 保存原始上传图；`archive/assets/textures/` 保存不再参与当前构建的旧贴图。
- `archive/assets/runtime-pre-compression/` 保存本轮模型压缩的固定输入；`archive/tooling/legacy/` 保存一次性模型/图片分析、重建、替换、缩放、安装脚本和 Python 生成缓存；`archive/tooling/skill-copy/.skill/` 保存旧 `.skill/` 副本；`archive/tooling/plugins/plugins/` 保存非运行时插件资料。
- `archive/assets/hands/source-20260829/` 仅保存已撤回双手 OBJ/MTL/PBR 的历史源快照；构建清单和双手专用工具已移入本次回滚快照，不再属于当前维护内容。
- `archive/assets/ak47-grip/source-wz50-20260830/` 保存用户确认正确握持的 `wz50` 六个源文件；`archive/assets/ak47-grip/previous-runtime-wrong-axis-20260830/` 保存修复前错误轴向运行时资产。
- `archive/assets/ak47-grip/pre-quality-fusion-20260830/` 保存画质融合前正确轴向的 28K/1K 运行时和相关构建/验证源码，可用于对照或恢复。
- `archive/verification/playwright-cli/.playwright-cli/` 保存过程日志和快照；这些目录不参与入口加载、测试默认路径或当前 ZIP 构建。
- `$RECYCLE.BIN` 是 Windows 系统回收站元数据，不属于项目内容，本次保持不动。

## 已知技术债
- 换弹弹匣显隐和枪身下沉存在状态问题。
- 当前活动版本没有第一人称双手模型；历史双手 OBJ 与 AK 融合握持方案均已撤回，不再形成当前运行时限制。
- 当前目录不是 Git 仓库，源码开发缺少版本控制保护。
- 用户 FBX 是单一静态 Mesh，包含 50,008 面、UV 和原生法线，但没有 Skin/Cluster、骨骼或动画；当前语义双骨权重由离线转换脚本生成，精度不等同于美术师手工绑定。
- 人体、双臂和步枪焊在固定持枪网格；混合重建可形成可读步态、分层瞄准和射击反馈，但无法实现精确手指、拉栓、弹匣拆装或完全独立武器动作。
- 敌人寻路为直线加双侧绕行，不是完整 A*；已加入出生安全复核和持续卡墙脱困，但复杂地形仍可能走位不聪明；当前无联网、商城、皮肤、买枪经济和穿墙子弹。
- 港口地图当前加载离线模型视觉层和本地 PBR；138 个同模型栅格合并结构行走盒与 4 个外围边界盒共 142 个移动 AABB，运行时移动通过 4m 空间分区取候选，再由 `moveCircle()` 分步解算；玩家/敌人弹道和 AI 视线先对真实模型求交，再由同模型派生阻挡层兜底，外围 bounds 与边界盒不重叠。地面与边界复用环境混凝土配置，环境层不引用武器色彩；旧模型重建工具、自动代理和白色低矮体块只供归档追溯，调整模型后必须重新生成碰撞并复核出生点、开放通道、敌我射线和真机表现。
- 地图选择当前只暴露港口和经典两张已接入完整出生点、视觉层、碰撞和射线逻辑的地图；回合中不允许热切换，阵亡后从结算返回开始菜单才能更换，新增地图需补齐同样的资源和回归验证。

## 约束
- 发布产物必须离线运行、根目录平铺、入口为 `index.html`，并控制在 10 MB 以内。
- 禁止依赖运行时外链、临时文件路径持久化、强制全屏、Pointer Lock 和未经验证的容器能力；设置可使用隔离的 `localStorage`，但核心玩法不得依赖存储成功。
