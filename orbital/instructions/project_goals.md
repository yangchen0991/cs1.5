<!--format: 项目目标与运行准则（Mission/Triggers/Scope/Rules/Preferences）-->

# 一人不撤｜离线 3D 触控生存射击（小红书小工具）

## Mission
维护并迭代一个基于 Three.js 的离线第一人称生存射击网页游戏，以小红书 H5 小工具（离线 ZIP）形态发布，并配套小红书营销物料。

## Triggers（何时行动）
- 用户要求改进/新增游戏功能（武器、敌人 AI、地图、波次等）
- 用户要求重新打包小工具 ZIP
- 用户要求撰写/修改小红书笔记、封面提示词
- 用户要求修 bug、做平衡性调整或兼容性修复

## Scope（做什么）
- 游戏代码：`index.html`、`style.css` 与当前发布清单中的 JavaScript/模型/贴图资源；核心逻辑模块为 config/math2d/map/player/enemy/weapon/hud/audio/pickup/main。
- 打包产物：离线、根目录平铺、单入口 `index.html` 的小工具 ZIP。
- 规则基线：`orbital/XHS_MINITOOL_CAPABILITY_LIST.md` 保存 2026-09-01 官方能力清单的项目转述版。
- 营销物料：小红书笔记文案、封面提示词、logo、截图。

## Rules（硬约束）

### 官方规则与执行顺序
- 当前长期能力基线是 2026-09-01 官方《小工具容器 · 能力清单》。旧 2026-08-11 规则已失效。
- 每次新的创作、改写、兼容修复或上传打包，必须重新使用小工具上传页当次提供的完整改写口令和对应版本 `SKILL.md`；本地历史 Skill、历史口令或旧 reference 不能替代当前 Skill。
- 若当前 Skill 与长期记忆冲突，先停止依赖旧规则，再以当前官方 Skill 重新核对。

### 技术栈与兼容基线
- 纯前端，无后端、无运行时网络、无 npm 构建依赖；经典 `<script>` 按依赖顺序加载，通过 `window.X` 暴露模块。
- Android 最低交付基线为 Android 8.1 / Chrome-WebView 61；JavaScript 最终交付必须 ES2017/Chrome 61 可解析运行。
- CSS 必须在 Chrome 61 下仍有可用基础布局；高版本 CSS 只能渐进增强，并提供基础声明或降级。
- 超出 Chrome 61 的 Web API/CSS 特性必须做 feature detection 或有安全 fallback。
- `node --check` 必须继续执行，但不能被当作 Chrome 61 兼容证明。

### 离线资源与 CSP
- 所有 HTML/CSS/JS/图片/字体/数据/音视频资源必须打包在 ZIP 内；禁止 CDN、远程图片、远程字体、远程媒体和所有网络请求。
- JavaScript 必须外置；禁止内联 `<script>`、行内事件、`javascript:` URI、ES Module、`eval()`、`new Function()`、WebAssembly、`data:`/`blob:` 脚本。
- 禁止 `iframe` / `object`、表单跳转提交、`a[download]`/blob 下载、`target="_blank"`、站外跳转、新窗口和小工具间跳转。
- 发布包只允许 `.html/.css/.js/.png/.jpg/.jpeg/.gif/.webp/.svg/.woff/.woff2/.json`，且有且只有一个入口 HTML。

### 禁用 Web 能力
- 禁止定位、剪贴板、Bluetooth/USB/HID/Serial、传感器、WebRTC/WebSocket/SSE、Worker/SharedWorker/ServiceWorker、屏幕共享、Fullscreen API、Battery/Network Information、媒体设备枚举、持久化/跨域存储申请、Credentials/WebAuthn、Web Locks、`window.open`、`window.prompt`。
- 不把 PaymentRequest、Notification/Push、NFC、MIDI、XR/AR/VR、后台同步/下载、PWA、窗口管理、Pointer Lock、Keyboard Lock 设计成核心功能。

### WebGL 边界
- WebGL 只使用包内资源、Canvas 与内存对象。
- 禁止外部纹理、WASM 图形/解码/AI 库、OffscreenCanvas+Worker、SharedArrayBuffer 多线程。
- `three-mesh-bvh` 只允许普通 JavaScript / ArrayBuffer 路径，禁止 `useSharedArrayBuffer:true`。

### 小红书端能力白名单
- 只能通过 `window.xhs.miniTool` 使用当前白名单：`postNote`、`saveImageToPhotosAlbum`、`writeTempFile`。
- 禁止直接向原生 bridge `postMessage`，禁止调用文档未列出的端能力或传未声明字段。
- 调用前必须判空；未注入 `window.xhs` 时游戏核心流程必须保持可用。
- `postNote` 的 title 最长 20 字、content 最长 1000 字，媒体只用 data URI/base64 或本地路径；成功调用不得表述成“审核通过”。
- `saveImageToPhotosAlbum` 必须由用户主动操作触发。
- `writeTempFile` 返回路径只作临时使用，禁止持久化保存。

### 项目工程规则
- 数值集中在 `config.js`，逻辑与参数分离。
- 每次修改 JavaScript 后运行 `node --check`，并执行项目合规门禁。
- 每次发布前至少核对：HTML/CSP、离线资源、禁用 API/行为、端能力白名单、Chrome 61 JS、Chrome 61 CSS fallback、WebGL 组合边界、ZIP 文件类型和单入口。
- 规则相关测试见 `tests/test_minitool_compliance.js` 与 `tests/test_xhs_rules_20260901.js`。

## Preferences
- 中文注释与中文交流。
- 高精度优先：命中/碰撞尽量用 Three.js 原生能力（如 Raycaster）贴合真实几何。
- 保持现有视觉风格与手感；改动尽量增量、可回退。
