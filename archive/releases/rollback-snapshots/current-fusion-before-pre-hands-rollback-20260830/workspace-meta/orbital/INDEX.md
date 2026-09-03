<!--format INDEX is a navigation map ONLY: '- path — one sentence' bullets under '## <area>' headings. No dates, status, decisions, or lessons here — those live in PROJECT_STATE.md / DECISIONS.md / LESSONS.md.-->

# 项目导航

## 项目入口与说明
- `AGENTS.md` — 所有代理进入项目后必须先读的工作区和 Orbital 规则。
- `README.md` — 当前版本运行、操作、打包和限制说明。
- `PRD.md` — 当前版本产品、玩法、技术、验收和交付需求。
- `docs/当前版本分析与归档索引.md` — 当前版本边界、活动文件和归档目录总索引。
- `archive/README.md` — 归档目录用途、类别和恢复规则。

## 游戏代码与分段资源
- `index.html` — 页面、菜单、HUD 和 6 个首屏经典脚本加载入口。
- `style.css` — 桌面与移动端布局、CSS 旋转横屏、HUD 和操作控件样式。
- `config.js` — 玩家、三把武器、敌人、波次和拾取参数。
- `math2d.js` — 视线和碰撞使用的二维几何工具。
- `three.min.js` — Three.js r160 UMD 离线库。
- `resource_loader.js` — 点击开始后按地图和设备档顺序加载包内经典脚本、预解码图片并记录启动阶段。
- `forge.js` — 桌面档按需加载的 GPU/CPU 程序化法线和纹理工具。
- `ak47_model.js` / `ak47_tex.js` / `ak47_*.webp` — AK+双臂+双手整体握持的 AK 专属量化视图模型与三张包内 PBR 图片。
- `awp_model.js` / `awp_tex.js` / `awp_*.webp` — AWP 量化模型与三张包内 PBR 图片。
- `hands_model.js` / `hands_tex.js` / `hands_*.webp` — 用户 OBJ 离线生成的左右手量化几何与基础色、法线、打包金属/粗糙度图片；低端档只加载基础色。
- `enemy_model.js` / `enemy_model_hd.js` — 用户 FBX 的移动两档载荷与桌面按需追加的 50,008 面高模/完整骨骼数据。
- `enemy_rig.js` — 八代号共享 24 节骨架、二维移动/上身瞄准/战斗动作层、三档护甲、LOD 和随骨骼命中代理。
- `enemy_albedo.webp` / `enemy_normal.webp` / `enemy_orm.webp` — 敌人离线 PBR 贴图。
- `map_model.js` — 当前港口 Uint16 量化离线视觉几何；港口弹道/敌人视线直接对该真实网格求交。
- `map_collision.js` — 从当前港口视觉模型的 494 个结构盒写入 0.5m 栅格并合并生成的 138 个结构性行走碰撞盒。
- `map_assets.js` / `port_base.webp` / `port_normal.webp` / `port_mr.webp` — 当前港口三张包内 PBR 图片的共享加载器与资源。
- `textures.js` / `env_brick.webp` / `env_concrete.jpg` / `env_crate_wood.webp` — 跨地图复用的三张包内环境图片及共享加载器。
- `environment_materials.js` — 环境共用材质配置，地面/边界复用混凝土且不引用武器色彩。
- `map.js` — 当前港口/经典关卡视觉组装、142 个港口移动 AABB（138 个模型派生盒 + 4 个边界）、真实模型射线与同模型派生阻挡兜底、出生点和触屏降级；旧自动代理不由入口加载。
- `player.js` — 第一人称移动、视角、蹲下、后坐和瞄准射线。
- `enemy.js` — 敌人模型、AI、视线、射击、近战和分部位命中。
- `weapon.js` — Glock 程序化模型、AK 融合握持/AWP、Glock/AWP 通用第一人称双手、射击、换弹、切枪、弹壳、枪口焰和命中反馈。
- `hud.js` — 血量、护盾、弹药、波次、小地图、击杀提示和伤害飘字。
- `audio.js` — Web Audio 合成音效和敌人位置音频池。
- `pickup.js` — 血包、弹药和敌人掉落护盾。
- `main.js` — 游戏生命周期、输入绑定、波次、移动端控制和渲染循环。

## 测试与发布
- `tests/test_math2d.js` — Math2D 独立行为测试。
- `tests/test_behaviors.js` — 敌人视线、避让和 3D 枪声行为测试。
- `tests/test_gameplay_fixes.js` — 箱顶跳跃、敌人安全出生/卡墙恢复、有限弹药/取弹/换弹和伤害范围测试。
- `tests/test_performance.js` — 移动端平衡、快速转身、资源裁剪和安全打包回归测试。
- `tests/test_enemy_rig.js` — 混合骨架、离线权重、二维移动、射击/受击/死亡和资源共享专项测试。
- `tests/test_minitool_compliance.js` — 小红书小工具入口、资源、能力、跨端交互和 ZIP 结构合规测试。
- `tests/test_runtime_regressions.js` — 击杀提示、蹲伏射线、切枪散布和运行时状态回归测试。
- `tests/test_map_assets.js` — 当前港口离线模型/PBR、同版本模型派生碰撞、共享环境材质、142 个移动边界、真实模型射线与同模型派生阻挡兜底、旧模型/PBR 归档、默认地图和运行时格式边界测试。
- `tests/test_asset_optimization.js` — 地图/AK/AWP 量化拓扑与误差、敌人载荷拆分、包内图片和体积预算测试。
- `tests/test_hands_assets.js` — 双手源指纹、左右组件、简化/量化误差、体积预算、运行时工厂、PBR 与低端分支测试。
- `.codex/SKILL.md` — 小红书小工具 ZIP 构建规范入口。
- `.codex/references/` — 容器能力、跨端 H5、JSBridge 和 ZIP 产物规范。
- `output/ak47-grip-quality-fusion-candidate/yiren-buche-minitool-ak47-grip-quality-fusion-candidate.zip` — 当前 AK V1+V2 画质容量融合的 47 文件独立候选（尚未真机复测）。
- `output/ak47-grip-axis-fix-candidate/yiren-buche-minitool-ak47-grip-axis-fix-candidate.zip` — 画质融合前的正确轴向低容量对照候选。
- `output/ak47-grip-candidate/yiren-buche-minitool-ak47-grip-candidate.zip` — 真机错误图已判定为 `-PI/2` 反向的旧 AK 候选，不可发布，仅留作追溯。
- `output/compression-candidate/yiren-buche-minitool-candidate.zip` — 用户已确认真机通过的 42 文件前一阶段压缩候选。
- `yiren-buche-minitool-candidate.zip` — 尚未被本轮压缩任务覆盖的根目录上一版候选。
- `tools/release-files.json` — 打包、校验和合规测试共用的 47 文件发布清单。
- `tools/package.ps1` — 生成独立目录下的 47 文件根目录平铺候选 ZIP。
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
- `tools/build-hand-assets.py` — 从固定 OBJ/MTL/PBR 归档确定性生成 Glock/AWP 通用双手脚本、三张图片和构建清单。
- `tools/build-ak47-grip-assets.py` — 从 AK 整体握持归档确定性生成 AK 专属量化模型、三张图片和构建清单。
- `tools/verify-hands-browser.js` — 用 Chrome 检查 AK 融合握持、Glock/AWP 通用双手、PBR、低端分支与 WebGL 错误。
- `tools/fix-encoding.ps1` — Windows 文件编码维护工具。

## 当前源资源与验收资料
- `archive/assets/runtime-pre-compression/` — 当前模型优化脚本使用的压缩前地图、AK、AWP 和敌人固定输入。
- `archive/assets/hands/source-20260829/` — Glock/AWP 通用双手 OBJ、MTL 与 PBR 的固定构建输入快照。
- `archive/assets/ak47-grip/source-wz50-20260830/` — 用户确认正确握持的 `wz50` OBJ、MTL 与 PBR 固定构建输入快照。
- `archive/assets/ak47-grip/previous-runtime-wrong-axis-20260830/` — 真机发现错误前的 `-PI/2` AK 运行时资产备份。
- `archive/assets/ak47-grip/pre-quality-fusion-20260830/` — 画质融合前 28K/1K 正确轴向运行时与构建/验证源码备份。
- `docs/hands-model-build.json` — 双手源指纹、组件统计、简化/量化误差、体积与输出哈希清单。
- `archive/assets/textures/20260829-superseded-runtime-sources/` — 当前环境优化图片的历史源快照；运行时只加载根目录图片。
- `docs/真机验收清单.md` — 当前候选包的 Android/iOS 实机验收项目。
- `docs/触控操作协议与验收.md` — 当前移动 FPS 触点职责、Pointer/Touch 兼容规则和双 FIRE 验收动作。
- `docs/一人不撤-敌人外观提示词.md` — 八个敌人代号及 tier 视觉概念提示词。
- `docs/enemy-fbx-inspection.json` / `docs/enemy-model-build.json` — 用户 FBX 结构证据与敌人资源构建清单。
- `docs/敌人平衡重建-验证摘要.md` — 共享骨骼敌人实现、资源预算、测试与候选包校验结果。
- `output/playwright/enemy-browser-report.json` — 当前敌人浏览器验证报告。
- `output/playwright/enemy-hybrid-animation-desktop.png` — 当前敌人动画桌面验证截图。
- `output/playwright/hands/hands-browser-report.json` / `desktop-*.png` / `mobile-*.png` — 三把武器双手空闲与换弹的桌面、低端移动浏览器证据。
- `output/playwright/mobile-regression-20260825.png` — 当前移动回归截图。
- `output/playwright/map-selection-menu.png`、`map-selection-locked.png` — 地图选择菜单、回合锁定状态的浏览器验证截图。

## 当前品牌与小红书内容
- `一人不撤-logo-20260827-high.png` — 当前版本 GPT Image 2 High 生成的 1:1 主 Logo 资产。
- `小红书-一人不撤-封面-20260827-high.png` — 当前版本 GPT Image 2 High 生成的 3:4 小红书封面预览资产。
- `一人不撤-logo-prompt.md` / `一人不撤-IP视觉资产-SCULPT-PROMPTS.md` — 当前品牌视觉生成提示词。
- `小红书-一人不撤-爆款笔记-20260827.md` — 当前版本小红书笔记草稿。
- `小红书-一人不撤-封面提示词-20260827.md` — 当前版本 3:4 封面提示词和叠字规范。

## 归档与项目记忆
- `archive/releases/` — 历史正式基线、修复前候选、平衡候选、敌人技术预览和本轮压缩前根候选备份 ZIP。
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
