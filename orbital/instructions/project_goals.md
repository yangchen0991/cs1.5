<!--format: 项目目标与运行准则（Mission/Triggers/Scope/Rules/Preferences）-->

# 一人不撤｜离线 3D 触控生存射击（小红书小工具）

## Mission
维护并迭代一个基于 Three.js 的离线第一人称生存射击网页游戏，
以小红书 H5 小工具（离线 zip）形态发布，并配套小红书营销物料。

## Triggers（何时行动）
- 用户要求改进/新增游戏功能（武器、敌人 AI、地图、波次等）
- 用户要求重新打包小工具 zip
- 用户要求撰写/修改小红书笔记、封面提示词
- 用户要求修 bug 或做平衡性调整

## Scope（做什么）
- 游戏代码：`index.html`、`style.css` 和当前发布清单中的 21 个 JavaScript 文件；核心逻辑模块为 config/math2d/map/player/enemy/weapon/hud/audio/pickup/main，模型、贴图和离线渲染支持文件按加载顺序随包提供
- 打包产物：`yiren-buche-minitool-candidate.zip`（当前离线 H5 → zip，规范见 `.codex/SKILL.md`）
- 营销物料：小红书笔记文案、封面 AI 提示词、logo、截图

## Rules（约束）
- 纯前端，无构建步骤；脚本在 index.html 用普通 <script> 按依赖顺序加载，通过 window.X 暴露
- 不引入外部依赖（three.min.js 本地离线）
- 数值集中在 config.js，逻辑与参数分离
- 每次修改 JS 后运行 `node --check` 校验语法
- 小工具须离线可运行（遵守 CSP/端能力约束，见 .codex/references/）

## Preferences
- 中文注释与中文交流
- 高精度优先：命中/碰撞尽量用 Three.js 原生能力（如 Raycaster）贴合真实几何
- 保持现有视觉风格与手感，改动尽量增量、可回退
