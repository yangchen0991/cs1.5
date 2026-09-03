<!--format INDEX is a navigation map ONLY: '- path — one sentence' bullets under '## <area>' headings. No dates, status, decisions, or lessons here — those live in PROJECT_STATE.md / DECISIONS.md / LESSONS.md.-->

# 项目导航

## 项目入口与说明
- `AGENTS.md` — 所有代理进入项目后必须先读的工作区和 Orbital 规则。
- `README.md` — 当前版本运行、操作、打包和限制说明。
- `PRD.md` — 当前版本产品、玩法、技术、验收和交付需求。
- `docs/当前版本分析与归档索引.md` — 当前版本边界、活动文件和归档目录总索引。
- `archive/README.md` — 归档目录用途、类别和恢复规则。

## 游戏代码与分段资源
- `index.html` — 页面、菜单、HUD、可调小地图设置、勋章中心、分享卡和 9 个首屏轻量经典脚本加载入口。
- `style.css` — 桌面与移动端布局、CSS 旋转横屏、按比例缩放的小地图、HUD 和操作控件样式。
- `config.js` — 玩家、三把武器、敌人换弹/冲锋/占位审计、波次、拾取和六级勋章参数。
- `math2d.js` — 视线和碰撞使用的二维几何工具。
- `three.min.js` — Three.js r160 UMD 离线库。
- `resource_loader.js` — 点击开始后按地图和设备档顺序加载包内经典脚本，以触屏两路/桌面三路受控并发预解码图片并记录启动阶段。
- `forge.js` — 桌面档按需加载的 GPU/CPU 程序化法线和纹理工具。
- `ak47_model.js` / `ak47_tex.js` / `ak47_*.webp` — 确认版本的 AK 量化视图模型与三张包内 PBR 图片，不包含双臂或双手。
- `awp_model.js` / `awp_tex.js` / `awp_*.webp` — AWP 量化模型与三张包内 PBR 图片。
- `enemy_model.js` / `enemy_model_hd.js` — 用户 FBX 的移动两档载荷与桌面按需追加的 50,008 面高模/完整骨骼数据。
- `enemy_rig.js` — 八代号共享 24 节骨架、二维移动/上身瞄准/战斗动作层、三档护甲、LOD 和随骨骼命中代理。
- `enemy_albedo.webp` / `enemy_normal.webp` / `enemy_orm.webp` — 敌人离线 PBR 贴图。
- `medal_system.js` — 生涯击杀、本机存储、六级解锁、进度和提示状态。
- `medal_ui.js` / `medal_share.js` — 勋章中心、非阻塞解锁横幅、1080×1440 分享卡与小红书端能力适配。
- `medal_01.webp` … `medal_06.webp` — 六张 512×512 WebP 运行时勋章图，合计 316,572 B。
- `map_model.js` — 当前港口 Uint16 量化离线视觉几何；港口弹道/敌人视线直接对该真实网格求交。
- `map_collision.js` — 从当前港口视觉模型的 494 个结构盒写入 0.5m 栅格并合并生成的 138 个结构性行走碰撞盒。
- `map_assets.js` / `port_base.webp` / `port_normal.webp` / `port_mr.webp` — 当前港口三张包内 PBR 图片的共享加载器与资源。
- `textures.js` / `env_brick.webp` / `env_concrete.jpg` / `env_crate_wood.webp` — 跨地图复用的三张包内环境图片及共享加载器。
- `environment_materials.js` — 环境共用材质配置，地面/边界复用混凝土且不引用武器色彩。
- `map.js` — 当前港口/经典关卡视觉组装、港口可见模型垂直面精确移动边界、结构深层核心异常占位检测、同源 A* 导航网格、真实模型射线、实际生成与避开已占位置的最近合法点采样。
- `player.js` — 第一人称移动、视角、蹲下、后坐和瞄准射线。
- `enemy.js` — 敌人模型、四档难度、A* 追击与抢补给、独立占位审计/脱困、2.2 秒换弹与举枪恢复、冲锋止距/侧移后撤、射击、近战、对象池复用和分部位命中。
- `weapon.js` — 确认版本的 Glock 程序化模型、AK/AWP 量化模型、射击、权威死亡事件、换弹、切枪、弹壳、按武器配置的分层轴向枪口火光和命中反馈；不加载第一人称双手。
- `hud.js` — 血量、护盾、弹药、波次、可关闭且隐藏时停止绘制的小地图、击杀提示和伤害飘字。
- `audio.js` — Web Audio 合成音效、波次倒计时、勋章解锁音和敌人位置音频池。
- `pickup.js` — 血包、弹药和敌人掉落护盾，以及供敌人导航选择的按距离活动候选查询。
- `main.js` — 游戏生命周期、固定游戏内返回、波次与小地图设置、敌人对象池、勋章事件、移动端控制，以及旧地图先释放、触屏无 PMREM/实时阴影、DPR 单向保持的启动和渲染流程。

## 测试与发布
- `tests/test_math2d.js` — Math2D 独立行为测试。
- `tests/test_behaviors.js` — 敌人视线、移动终点合法性、冲锋止距、避让和 3D 枪声行为测试。
- `tests/test_gameplay_fixes.js` — 箱顶跳跃、敌人安全出生/卡墙恢复、零距离线段推出、有限弹药/取弹/换弹恢复和伤害范围测试。
- `tests/test_performance.js` — 移动端平衡、快速转身、小地图设置、资源裁剪和安全打包回归测试。
- `tests/test_enemy_rig.js` — 混合骨架、离线权重、二维移动、射击/受击/死亡和资源共享专项测试。
- `tests/test_minitool_compliance.js` — 小红书小工具入口、资源、能力、跨端交互和 ZIP 结构合规测试。
- `tests/test_runtime_regressions.js` — 击杀提示、蹲伏射线、切枪散布和运行时状态回归测试。
- `tests/test_map_assets.js` — 当前港口离线模型/PBR、同版本模型派生碰撞、共享环境材质、142 个移动边界、真实模型射线与同模型派生阻挡兜底、旧模型/PBR 归档、默认地图和运行时格式边界测试。
- `tests/test_asset_optimization.js` — 地图/AK/AWP 量化拓扑与误差、敌人载荷拆分、包内图片和体积预算测试。
- `tests/test_medals.js` — 六级阈值、只解锁一次、存储恢复/损坏/失败和分享媒体降级专项测试。
- `.codex/SKILL.md` — 小红书小工具 ZIP 构建规范入口。
- `.codex/references/` — 容器能力、跨端 H5、JSBridge 和 ZIP 产物规范。
- `output/medal-feature-candidate/yiren-buche-minitool-medals-candidate.zip` — 当前 51 文件勋章候选，等待小红书真机复测。
- `output/round2-fixes-candidate/yiren-buche-minitool-round2-fixes-candidate.zip` — 第二轮 20 项真机反馈对应的 51 文件独立候选。
- `output/round3-fixes-candidate/yiren-buche-minitool-round3-fixes-candidate.zip` — 敌人脱困、换弹间隙、冲锋止距和小地图设置对应的 51 文件独立候选。
- `output/playwright/round3-minimap-settings.png` — 第三轮 Chromium 小地图设置与 50% 默认比例验收截图。
- `output/playwright/v2-performance-20260831/` — V2 桌面、港口与移动模拟浏览器快照及控制台日志；临时服务器日志中的 404 仅为 favicon。
- `output/pre-hands-restored-candidate/yiren-buche-minitool-pre-hands-confirmed-original.zip` — 用户真机确认的 42 文件无双手基线逐字节副本。
- `output/compression-candidate/yiren-buche-minitool-candidate.zip` — 当前恢复基线的原始确认包。
- `output/ak47-grip-quality-fusion-candidate/` / `output/ak47-grip-axis-fix-candidate/` / `output/ak47-grip-candidate/` — 已撤回的双手与 AK 融合历史候选，仅供追溯。
- `yiren-buche-minitool-candidate.zip` — 尚未被本轮压缩任务覆盖的根目录上一版候选。
- `tools/release-files.json` — 打包、校验和合规测试共用的 51 文件发布清单。
- `tools/package.ps1` — 生成独立目录下的 51 文件根目录平铺候选 ZIP。
- `tools/verify-minitool-package.ps1` — 核验候选包唯一根入口、平铺结构、允许类型和逐字节一致性。
- `tools/optimize-runtime-models.js` — 从固定归档输入确定性生成量化地图/AK/AWP 和移动/桌面拆分敌人载荷。
- `tools/optimize-runtime-textures.py` — 生成地图、武器和公共环境的包内优化图片。
- `tools/sanitize-three-offline.ps1` — 可重复移除 Three.js 未使用的联网加载分支。
- `tools/build-textures.js` — 已被包内图片方案取代的环境内嵌贴图历史构建器。
- `tools/prepare-map-assets.ps1` — 历史 OBJ/PBR 归档重建工具，不是当前发布前置。
- `tools/resize-map-textures.py` / `tools/build-map-assets.js` — 历史地图 PBR 缩放、GLB 几何读取和归档内嵌工具；`build-map-assets.js` 同时提供 `build-map-collision.js` 复用的构建期碰撞算法。
- `archive/assets/maps/container-port/legacy-runtime/map_model.js` / `map_assets.js` — 已停用的旧导入模型、PBR 和自动代理数据，仅供追溯空气墙/白色几何问题。
- `tools/build-enemy-assets.py` — 解析用户二进制 FBX，生成三档 LOD、量化几何、离线语义双骨权重和移动端 WebP 贴图。
- `tools/inspect-fbx.py` — 无需 Blender/Autodesk 依赖的二进制 FBX 结构检查工具。
- `tools/verify-enemy-browser.js` — 用 Chrome 检查共享骨骼、LOD、贴图、低端档和 WebGL 控制台。
- `tools/fix-encoding.ps1` — Windows 文件编码维护工具。

## 当前源资源与验收资料
- `archive/assets/runtime-pre-compression/` — 当前模型优化脚本使用的压缩前地图、AK、AWP 和敌人固定输入。
- `archive/assets/hands/source-20260829/` — 已撤回通用双手方案的 OBJ、MTL 与 PBR 历史源快照。
- `archive/assets/ak47-grip/` — 已撤回 AK 融合握持方案的 `wz50` 源、错误轴向与画质融合前资产归档。
- `archive/releases/rollback-snapshots/current-fusion-before-pre-hands-rollback-20260830/` — 回滚前 47 文件融合版、双手专用工具/测试/文档及 SHA256 清单的可恢复快照。
- `archive/assets/textures/20260829-superseded-runtime-sources/` — 当前环境优化图片的历史源快照；运行时只加载根目录图片。
- `docs/真机验收清单.md` — 当前候选包的 Android/iOS 实机验收项目。
- `docs/触控操作协议与验收.md` — 当前移动 FPS 触点职责、Pointer/Touch 兼容规则和双 FIRE 验收动作。
- `docs/一人不撤-敌人外观提示词.md` — 八个敌人代号及 tier 视觉概念提示词。
- `docs/enemy-fbx-inspection.json` / `docs/enemy-model-build.json` — 用户 FBX 结构证据与敌人资源构建清单。
- `docs/敌人平衡重建-验证摘要.md` — 共享骨骼敌人实现、资源预算、测试与候选包校验结果。
- `output/playwright/enemy-browser-report.json` — 当前敌人浏览器验证报告。
- `output/playwright/enemy-hybrid-animation-desktop.png` — 当前敌人动画桌面验证截图。
- `output/playwright/hands/` — 已撤回双手方案的历史浏览器证据，不代表当前活动版本。
- `output/playwright/mobile-regression-20260825.png` — 当前移动回归截图。
- `output/playwright/map-selection-menu.png`、`map-selection-locked.png` — 地图选择菜单、回合锁定状态的浏览器验证截图。
- `output/playwright/medal-*.png` — 勋章锁定/解锁、分享卡与 390×844/844×390 布局浏览器证据。
- `output/playwright/wave-warning.png` — 第二轮红色波次倒计时闪屏的 Chromium 视觉证据。

## 当前品牌与小红书内容
- `一人不撤-logo-20260827-high.png` — 当前版本 GPT Image 2 High 生成的 1:1 主 Logo 资产。
- `小红书-一人不撤-封面-20260827-high.png` — 当前版本 GPT Image 2 High 生成的 3:4 小红书封面预览资产。
- `一人不撤-logo-prompt.md` / `一人不撤-IP视觉资产-SCULPT-PROMPTS.md` — 当前品牌视觉生成提示词。
- `小红书-一人不撤-爆款笔记-20260827.md` — 当前版本小红书笔记草稿。
- `小红书-一人不撤-封面提示词-20260827.md` — 当前版本 3:4 封面提示词和叠字规范。

## 击杀勋章设计资产
- `output/medals/` — 六级击杀勋章高清透明 PNG 母版、概念板和完整图像生成提示词；高清母版不进入发行包。
- `output/medals/runtime-512/` — 根目录六张发行 WebP 的 512×512 源副本及容量、编码和 SHA256 清单。

## 归档与项目记忆
- `archive/releases/` — 历史正式基线、修复前候选、平衡候选、敌人技术预览和本轮压缩前根候选备份 ZIP。
- `archive/releases/rollback-snapshots/v2-enemy-performance-before-20260831/` — V2 多敌人性能修改前 11 个核心/测试文件与 SHA-256 回退清单。
- `archive/deliverables/` — 历史 PRD、架构、验收、纹理和软件团队交付物。
- `archive/deliverables/2026-08-28-精确武器操作与完整敌人讨论.md` — 精确手指、拉栓、弹匣拆装和完整敌人方案的历史讨论。
- `archive/design-references/` — 不再驱动当前版本的武器参考资料。
- `archive/marketing/` — 旧品牌文案、Logo、封面和截图。
- `archive/assets/` — 原始上传图片、旧贴图和旧浏览器输出。
- `archive/tooling/` — 一次性工具、旧 Skill 副本和非运行时插件。
- `archive/verification/` — Playwright CLI 过程日志和页面快照。
- `orbital/PROJECT_STATE.md` — 当前事实、待验证项和技术债。
- `orbital/DECISIONS.md` — 当前有效且不互相冲突的产品与技术决策。
- `orbital/LESSONS.md` — 可复用的故障经验和实现规则。
- `orbital/XHS_MINITOOL_CAPABILITY_LIST.md` — 用户指定的小红书小工具容器能力清单全文记忆。
- `orbital/instructions/` — 项目目标与用户长期指令。
