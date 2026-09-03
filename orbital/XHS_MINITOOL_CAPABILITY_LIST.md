# 小红书小工具容器能力清单（当前权威记忆）

> 来源：用户指定的官方《小工具容器 · 能力清单》
>
> 当前原文：<https://fe-video-qc.xhscdn.com/fe-platform-file/104101b8324ihuc967a06277180ac7t8006ptl0fm199r4.html>
>
> 官方页面最后更新：2026-09-01。
>
> 本文件是项目内长期能力基线的完整规则镜像（转述版）。实际上传、创作、改写、兼容修复和打包时，仍必须以小工具上传页当次提供的完整改写口令与对应版本 `SKILL.md` 为执行规范；历史 Skill、历史口令或本文件均不能替代上传页当前 Skill。

## 1. 运行环境与最低兼容基线

小工具运行在受限沙箱中的纯 Web 环境，应按“能力受限的浏览器页面”设计。

- 技术栈：标准 HTML / CSS / JavaScript 与标准 Web API。
- Android 最低交付基线：Android 8.1 出场 Chrome / WebView 61。
- iOS 最低支持：iOS 18.4；iOS 独有能力只能作为增强，不能成为双端核心路径。
- 端能力：容器自动注入 `window.xhs.miniTool`，无需也不得自行引入另一套原生 SDK。
- 沙箱：敏感 Web 能力、文件选择、页面跳转等受容器统一限制。
- 隔离：各小工具存储与运行环境相互隔离，不能访问其他小工具数据，也不能依赖小工具间通信。
- 离线：所有页面、脚本、图片、字体、数据等运行时资源必须随 ZIP 打包；不得依赖网络。
- 每次创作/改写：从上传页复制当次完整改写口令，使用其指定的最新 Skill，读取对应 `SKILL.md` 后再做校验、修复与打包。

## 2. 可用 Web 能力

### 2.1 页面与渲染

- HTML / CSS / JavaScript 可用，但最终交付必须满足 Chrome 61 基线。
- `<style>` 和 `style=""` 可用。
- 页面脚本只能按“资源加载规则”中的 CSP 约束执行。
- Canvas 2D 可用。
- WebGL / WebGL2 的纯本地渲染可用，组合能力见第 5 节。
- 文本选择不受额外限制。

### 2.2 JavaScript / CSS 兼容规则

- JavaScript 最终交付必须处于 ES2017 / Chrome 61 可解析、可运行范围；更高版本语法必须在交付前转译或改写。
- `node --check` 只能作为额外语法检查，不能替代 Chrome 61 / ES2017 兼容检查。
- CSS 必须在 Chrome 61 下仍存在可用的基础布局；晚于 Chrome 61 的 CSS 能力只能作为渐进增强。
- 使用高级 API 或 CSS 特性时必须做能力检测或提供基础声明 / 降级路径。
- 不能因为桌面 Chrome、现代 Android 或模拟器能运行，就推断符合最低兼容基线。

### 2.3 媒体与文件

- 摄像头：`getUserMedia({ video })`，需用户授权。
- 麦克风：`getUserMedia({ audio })`，需用户授权。
- `<input type="file">` 由系统选择器接管，只开放图片与视频；`accept` 不能突破容器允许的类型。
- `<video>` / `<audio>` 支持内联播放。
- `<img>` 使用 `data:` / `blob:` 的兼容要求：客户端 9.37 及以上。

### 2.4 数据存储

- `localStorage` / `sessionStorage` 可用，按小工具隔离。
- IndexedDB 可用，按小工具隔离。
- Cookie / Cache API 可用，但均属于本地隔离环境。
- 不应假设本地数据永久保存。
- Cookie 不能用于向服务端携带登录态或鉴权，因为小工具不联网；本地状态优先使用 `localStorage` / IndexedDB。

### 2.5 交互

- `alert()` / `confirm()` 可用，以原生 UI 展示。

## 3. 资源加载与 ZIP 约束

### 3.1 脚本

允许：
- 包内同源经典脚本，例如 `<script src="./app.js">`。

禁止：
- 内联 `<script>...</script>`。
- 行内事件（如 `onclick=`）。
- `javascript:` URI。
- `eval()` / `new Function()`。
- WebAssembly。
- 外部域名脚本。
- `data:` / `blob:` 脚本。
- ES Module 作为当前项目运行依赖。

### 3.2 样式、图片、字体

- 样式可使用 `<style>`、行内 `style` 或包内 CSS；外部域名样式表禁止。
- 图片可使用包内文件、`data:`、`blob:`；外部域名图片禁止。
- 字体必须包内提供；外部域名字体禁止。
- `iframe` / `object` 不可使用。

### 3.3 支持的包内文件类型

只使用以下扩展名：

- `.html`
- `.css`
- `.js`
- `.png` / `.jpg` / `.jpeg` / `.gif` / `.webp` / `.svg`
- `.woff` / `.woff2`
- `.json`

并且：
- 必须有且只有一个入口 HTML。
- 所有页面和动态加载引用必须指向包内存在的文件。
- 外部 CDN、线上图片、线上字体、线上音视频、线上数据一律不能成为运行时依赖。

## 4. 小红书端能力 JS API

容器自动注入 `window.xhs.miniTool`。项目只能使用当前官方清单明确列出的 API，禁止自行 bridge `postMessage`，禁止调用未列出的端能力。

### 4.1 调用约定

- 唯一入口：`window.xhs.miniTool.<apiName>(options)`。
- 传入 `success` / `fail` / `complete` 任一回调时，调用采用回调形态；不传这些回调时使用 Promise。
- 成功和失败均按 API 返回对象处理。
- SDK 和 Native 侧均会按 schema 做参数校验；不得传表外字段。
- 调用前必须检查 `window.xhs && window.xhs.miniTool`；普通浏览器或未注入环境必须有降级路径。

### 4.2 允许的 API 白名单

当前仅允许：

1. `postNote`
2. `saveImageToPhotosAlbum`
3. `writeTempFile`

历史文档中出现的其他 API 或额外字段均不得直接使用，除非后续官方当前文档再次明确列出。

### 4.3 `postNote`

用途：唤起 App 笔记发布页并带入内容；用户仍可编辑或取消。

参数边界：
- `title`：可选，最长 20 字。
- `content`：可选，最长 1000 字。
- `tags`：可选。
- `mediaInfo`：必填；图片或视频至少一种，可同时存在。
- `mediaInfo.image_resources`：1–18 张；每项 `url` 为 base64/data URI 或本地路径。
- `mediaInfo.video_resources`：单个视频，`video_url` 为本地路径，可选 `cover_url`。
- 媒体字段不得使用网络 URL。
- 成功回调只代表发布流程已被唤起/调用完成，不代表笔记最终审核通过；不得把它记录成“发布成功/审核成功”的强一致状态。

### 4.4 `saveImageToPhotosAlbum`

- 参数 `filePath` 必填。
- `filePath` 只使用 data URI/base64 或 `writeTempFile` 返回的本地文件路径；不得传 HTTP(S) URL。
- 必须由用户主动操作（例如点击）触发。
- 首次调用可能出现系统相册权限弹窗；拒绝授权必须有失败处理。
- 大图优先先转临时文件再保存。

### 4.5 `writeTempFile`

- 参数 `data` 必填，接受 base64，允许带 `data:` 前缀。
- 返回 `filePath` 为临时文件路径。
- 临时路径不保证长期有效，必须即用即弃，不得写入持久化状态。
- 只使用常见图片/视频类型：png、jpeg、webp、gif、mp4。
- 适合把 Canvas 导出或较大的 base64 转成临时文件，再交给相册或发布 API。

## 5. 禁用能力与行为

### 5.1 禁用 Web API

不得依赖：

- `navigator.geolocation`。
- `navigator.clipboard`、`execCommand('copy'/'cut'/'paste')`。
- Bluetooth / USB / HID / Serial。
- 加速度计、陀螺仪、磁力计、环境光、设备运动、设备朝向。
- WebRTC、WebSocket、EventSource / SSE。
- Worker、SharedWorker、Service Worker。
- 屏幕共享。
- Fullscreen API（全屏由容器管理）。
- Battery、Network Information、媒体设备枚举。
- 持久化存储申请、跨域存储访问。
- WebAuthn / Credentials API、Web Locks。
- `window.open`、`window.prompt`。

### 5.2 禁用行为

- `fetch` / `XMLHttpRequest` 以及任何网络请求。
- 任何外部图片、字体、媒体、脚本、样式、数据加载。
- 动态执行代码：`eval()` / `new Function()`。
- WebAssembly。
- iframe / object。
- `<form>` 跳转提交。
- Flash 等插件。
- `a[download]`、blob 下载等文件下载路径；图片保存应使用官方相册 API。
- `target="_blank"`、站外跳转或新窗口。
- 跳转其他小工具。
- 依赖长按菜单作为功能入口。

### 5.3 移动端不可作为核心功能的能力

不得设计为核心路径：

- PaymentRequest。
- Notification / Push。
- NFC。
- MIDI。
- XR / AR / VR。
- 后台同步 / 后台下载。
- PWA 安装。
- 窗口管理。
- Pointer Lock / Keyboard Lock。

## 6. WebGL / 图形计算边界

允许：
- 包内本地资源作为纹理。
- Canvas / 内存对象作为纹理。
- 纯 JavaScript 的本地图形计算，只要满足 Chrome 61 和其他容器规则。

禁止：
- 外部域名图片作为纹理。
- 依赖 WASM 的加速、解码、AI 或图像算法库（例如依赖 WASM 的 Draco/Basis/ONNX 路径）。
- `OffscreenCanvas + Worker` 离屏渲染。
- SharedArrayBuffer 多线程。

项目可以使用纯 WebGL + 本地资源；不能依赖网络、WASM 模型或 Worker 多线程完成核心计算。

## 7. 当前项目专用硬约束

以下规则从 2026-09-01 起作为本项目的长期门禁：

1. **官方来源优先**：本文件记录长期能力基线；每次实际改写/上传仍重新使用上传页当前口令和当前 Skill。
2. **Chrome 61 基线**：发布 JS 必须 ES2017/Chrome 61 可解析；CSS 必须有 Chrome 61 可用的基础布局。
3. **完全离线**：游戏核心、模型、纹理、音效、勋章、分享卡生成均不得依赖网络。
4. **端能力白名单**：只允许 `postNote`、`saveImageToPhotosAlbum`、`writeTempFile`。
5. **核心流程独立**：没有 `window.xhs` 时游戏仍必须可运行；端能力只作为用户主动触发的增强。
6. **无动态代码 / WASM / Worker**：禁止 `eval`、`new Function`、WASM、Worker/SharedWorker/ServiceWorker；WebGL BVH 等第三方库不得启用 SharedArrayBuffer 或 Worker 路径。
7. **无外链 / 下载 / 表单跳转**：禁止外部 URL、`target=_blank`、下载属性、表单跳转提交和窗口打开。
8. **临时文件不持久化**：`writeTempFile` 返回路径不得存入 localStorage/IndexedDB 作为长期状态。
9. **渐进增强**：高于 Chrome 61 的 CSS/API 必须有 fallback 或 feature detection。
10. **发布门禁**：打包前必须执行项目合规测试并核对最新 Skill；测试需覆盖 HTML/CSP、网络/设备禁用项、端能力白名单、Chrome 61 JS、Chrome 61 CSS fallback、WebGL 组合边界和 ZIP 文件类型。

## 8. 与历史资料的冲突处理

- 旧的 2026-08-11 能力清单已经被本文件覆盖，不再作为当前权威版本。
- 旧 `.codex/references/`、历史 Skill、历史 session 或文档若与 2026-09-01 官方规则冲突，以当前官方规则和上传页当前 Skill 为准。
- 历史资料中出现 `openRedPage`、`pageType`、`live_photo_resources` 等当前白名单没有列出的能力或字段，不得直接调用。
- 当前项目使用 `three-mesh-bvh` 时只允许普通 JavaScript / ArrayBuffer 路径；禁止启用 `useSharedArrayBuffer:true`。
- 本项目现有 `node --check`、现代 Chromium 行为门和真机测试继续保留，但它们不能替代 Chrome 61 / ES2017 与 CSS fallback 门禁。