# 小红书小工具容器能力清单（当前权威记忆）

> 来源：用户指定的开发文档《小工具容器 · 能力清单》
>
> 原文：<https://fe-video-qc.xhscdn.com/fe-platform-file/104101b8323q4m0uaga06277180ac7t8006ptl0e12ek1g>
>
> 文档标注：适用 iOS / Android 双端（除注明外一致）；最后更新 2026-08-11。
>
> 本记忆于 2026-08-25 全文读取。以下按原文顺序保留所有规范性正文、表格、代码示例、限制、告警和 FAQ；HTML/CSS 装饰不属于开发能力规则，未重复保存。

文档面向小工具开发者，说明小红书小工具容器内哪些 Web 能力可用、哪些不可用，以及容器提供的端能力 JS API（发笔记 / 存相册 / 临时文件）。

## 目录

1. [运行环境](#1-运行环境)
2. [可用能力](#2-可用能力)
   - [2.1 页面与渲染](#21-页面与渲染)
   - [2.2 媒体与文件](#22-媒体与文件)
   - [2.3 数据存储](#23-数据存储)
   - [2.4 交互](#24-交互)
   - [2.5 资源加载规则](#25-资源加载规则)
3. [端能力 JS API](#3-端能力-js-api)
   - [3.1 调用约定](#31-调用约定)
   - [3.2 API 一览](#32-api-一览)
   - [3.3 postNote](#33-postnote--发布笔记)
   - [3.4 saveImageToPhotosAlbum](#34-saveimagetophotosalbum--保存图片到相册)
   - [3.5 writeTempFile](#35-writetempfile--base64-转临时文件)
4. [不可用能力](#4-不可用能力)
   - [4.1 已禁用的 Web API](#41-已禁用的-web-api)
   - [4.2 已禁用的行为](#42-已禁用的行为)
   - [4.3 移动端不支持](#43-移动端不支持)
5. [WebGL / 图形计算边界](#5-webgl--图形计算边界)
6. [常见问题 FAQ](#6-常见问题-faq)

## 1. 运行环境

小工具是运行在**受限沙箱环境**里的**纯 Web 应用（HTML / CSS / JS）**，应当把它当作一个“能力受限的浏览器页面”来开发。

| 方面 | 规则 |
| --- | --- |
| 技术栈 | **标准 Web 技术栈**：使用标准 HTML / CSS / JS 与标准 Web API 开发。 |
| 端能力 | 容器自动注入 JS API SDK，可调用发布笔记、保存相册、写临时文件等端能力（见第 3 节），无需自行引入脚本。入口是 `window.xhs.miniTool`。 |
| 沙箱 | 容器对部分敏感 Web 能力做限制（见后文），并对文件选择、页面跳转等做统一管控。 |
| 隔离 | 每个小工具拥有独立的存储与运行环境；小工具之间互相隔离、无法访问彼此数据，也无法互相通信。 |
| 离线 | 小工具为**纯本地运行**，所有页面、脚本、图片、字体等资源都必须打包在小工具内，**不支持任何网络请求**（见 §4.2），应设计为完全离线自包含。 |

## 2. 可用能力

### 2.1 页面与渲染

| 能力 | 说明 |
| --- | --- |
| HTML / CSS / JS | 完整支持，含 Flexbox / Grid / 动画 / 媒体查询等。 |
| 内联样式 | `<style>` 与 `style=""` 均可用。 |
| 页面内脚本 | 页面自带的脚本可正常执行。这里的“页面内脚本”不改变 §2.5 对内联 `<script>` 的限制；可执行的是符合容器规则的页面脚本。 |
| Canvas 2D | `canvas.getContext('2d')`，完整支持。 |
| WebGL | `getContext('webgl' / 'webgl2')`，纯渲染可用，能力边界见 §5。 |
| 文本选择 | 不限制。 |

### 2.2 媒体与文件

| 能力 | 用法 | 说明 |
| --- | --- | --- |
| 摄像头 | `getUserMedia({ video })` | 需用户在系统弹窗中授权。 |
| 麦克风 | `getUserMedia({ audio })` | 需用户在系统弹窗中授权。 |
| 选择图片 / 拍照 | `<input type="file">` | 系统选择器接管，**仅支持选择图片和视频**（无论 `accept` 如何设置）。 |
| 音视频播放 | `<video>` / `<audio>` | 支持内联播放。 |

### 2.3 数据存储

| 能力 | 说明 |
| --- | --- |
| `localStorage` / `sessionStorage` | 可用，按小工具独立隔离。 |
| IndexedDB | 可用，按小工具独立隔离。 |
| Cookie / Cache API | 可用，按小工具独立隔离。 |

补充规则：

- 数据仅属于当前小工具，其他小工具与外部无法访问。请勿假设数据永久持久化。
- **Cookie 仅作本地存储**：可正常读写并按 origin 隔离，但因不联网，cookie **不会随请求发往任何服务端**，无法用于登录态 / 鉴权透传。需要本地存储优先用 `localStorage` / `IndexedDB`。

### 2.4 交互

| 能力 | 说明 |
| --- | --- |
| `alert()` / `confirm()` | 可用，以原生 UI 展示。 |

### 2.5 资源加载规则

小工具为本地运行、不联网，容器对页面如何加载各类资源有明确约束（对应浏览器 CSP 限制）。所有资源须打包在小工具内（下表“包内资源”）；按资源类型另行允许 `data:` / `blob:` 等内存来源。

| 资源类型 | 允许的加载方式 | 不允许 |
| --- | --- | --- |
| 脚本 `<script>` | 引用包内脚本：`<script src="./app.js">`（同源外链）。 | 内联 `<script>...</script>`；行内事件 `onclick="..."` 等；`javascript:` URI；`eval()` / `new Function()`；WebAssembly；外部域名脚本；`data:` / `blob:` 脚本。 |
| 样式 `<style>` / `<link>` | 内联 `<style>`、`style="..."` 行内样式；引用包内样式表。 | 外部域名样式表。 |
| 图片 `<img>` / CSS 背景图 | 包内图片，如 `<img src="./a.png">`；`data:` URI（base64 内嵌）；`blob:`（`createObjectURL` 创建的内存对象，如选图预览）。 | 外部域名图片。 |
| 字体 `@font-face` | 包内字体文件。 | 外部域名字体。 |
| `iframe` / `object` | 全部禁止。 | — |

#### 支持的文件类型

小工具包内仅支持以下文件类型：

| 文件类型 | 原文给出的原因 |
| --- | --- |
| `.html` | 小工具主体，必须有且只有一个入口文件。 |
| `.css` | 样式文件，虽然口令要求内联，但不排除用户分开放。 |
| `.js` | 脚本文件，同上。 |
| `.png` / `.jpg` / `.jpeg` / `.gif` / `.webp` / `.svg` | 图片资源，内联 base64 太大时用户可能分开放。 |
| `.woff` / `.woff2` | 字体文件，本地字体场景。 |
| `.json` | 静态数据文件，部分小工具需要读取本地配置数据。 |

#### 实践要点

- **脚本必须外置**：容器禁止内联脚本与行内事件处理器。应把 JS 写进包内 `.js` 文件，用 `<script src>` 引入；事件绑定改用 `addEventListener`，不要用 `onclick=` 属性。
- **样式可内联**：`<style>` 和 `style="..."` 都能用，无需外置。
- 选图预览用 `<img src>` 配 `data:` 或 `blob:` 均可显示，例如 `FileReader.readAsDataURL` 或 `URL.createObjectURL`。

⚠️ `<img>` 加载 `data:` / `blob:` 需要客户端 **9.37** 及以上版本。

💡 外部 CDN 一律加载不到，所有资源请**全部打包进小工具**。

## 3. 端能力 JS API

除标准 Web 能力外，容器会**自动注入** JS API SDK。小工具可通过 `window.xhs.miniTool.*` 调用 App 原生能力：发布笔记、保存图片到相册、把 base64 写成临时文件。**无需在包内引入任何 SDK 脚本**。

### 3.1 调用约定

| 项 | 规则 |
| --- | --- |
| 唯一入口 | `window.xhs.miniTool.<apiName>(options)`；不要自行向原生 bridge `postMessage`，也不要调用本文未列出的 API。 |
| Promise / 回调 | 传入 `success` / `fail` / `complete` 任一回调时返回 `undefined`；都不传则返回 `Promise`。 |
| 成功 | `resolve` / `success` 收到结果对象，含 `errMsg: "<api>:ok"` 及该 API 的业务字段。 |
| 失败 | `reject` / `fail` 收到 `{ errMsg: "<api>:fail ...", errCode? }`；参数不合法时会在本地直接失败，不上行。 |
| 参数校验 | SDK 上行前按 JSON Schema 校验，Native 侧用同一份 Schema 再校验一次：**表中未声明的字段不要传**。 |
| 可用性判断 | 调用前用 `window.xhs?.miniTool` 判空，并为未注入的环境准备降级路径。 |

调用示例（原文）：

```js
const miniTool = window.xhs?.miniTool;
if (!miniTool) return; // 当前环境未注入端能力

// Promise 形态
try {
  await miniTool.saveImageToPhotosAlbum({ filePath });
} catch (err) {
  console.log(err.errMsg); // "saveImageToPhotosAlbum:fail ..."
}

// 回调形态（返回 undefined）
miniTool.saveImageToPhotosAlbum({
  filePath,
  success: (res) => console.log(res.errMsg),
  fail: (err) => console.log(err.errMsg),
  complete: () => {},
});
```

### 3.2 API 一览

当前文档列出的 JS API 全部为以下三项：

| API | 能力 | 形态 |
| --- | --- | --- |
| `postNote` | 唤起笔记发布页，带入标题 / 正文 / 图片 / 视频。 | 异步 |
| `saveImageToPhotosAlbum` | 保存图片到系统相册。 | 异步 |
| `writeTempFile` | 把 base64 数据写成容器内临时文件，换取 `filePath`。 | 异步 |

媒体类字段（图片 / 视频 / 封面）只接受 `data:` base64 或本地文件路径；容器不联网，网络地址不可用。体积较大的 base64 建议先用 `writeTempFile` 换成 `filePath` 再传。

### 3.3 `postNote` — 发布笔记

唤起 App 笔记发布页，并带入小工具产出的内容与媒体。用户在发布页可继续编辑或取消。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 否 | 标题，最长 20 字。 |
| `content` | `string` | 否 | 正文，最长 1000 字。 |
| `tags` | `string` | 否 | 话题 / 标签。 |
| `mediaInfo` | `object` | **是** | 媒体信息；下列两种资源至少传一种，可同时传。 |
| `mediaInfo.image_resources` | `{ url }[]` | 否 | 图片，1–18 张；`url` 为 base64 或本地路径。 |
| `mediaInfo.video_resources` | `{ video_url, cover_url? }` | 否 | 单个视频；`cover_url` 为可选封面。 |

图文笔记：

```js
await window.xhs.miniTool.postNote({
  title: "我的作品",
  content: "用小工具生成的",
  mediaInfo: {
    image_resources: [{ url: "data:image/png;base64,iVBORw0KGgo..." }],
  },
});
```

视频笔记：

```js
await window.xhs.miniTool.postNote({
  mediaInfo: {
    video_resources: { video_url: videoPath, cover_url: coverPath },
  },
});
```

⚠️ 成功回调只代表**发布页已被唤起并由用户点击发布**，不代表笔记最终审核通过。请勿依赖它做强一致的业务状态。

### 3.4 `saveImageToPhotosAlbum` — 保存图片到相册

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `filePath` | `string` | **是** | 本地图片：`data:` base64 或 `writeTempFile` 返回的路径；**不支持** `http(s)://` 网络地址。 |

Canvas 导出直接保存：

```js
const dataUrl = canvas.toDataURL("image/png");
await window.xhs.miniTool.saveImageToPhotosAlbum({ filePath: dataUrl });
```

使用规则：

- 需由用户主动操作（点击等）触发，首次调用可能弹出系统相册权限弹窗；用户拒绝授权会走失败回调。
- 大图建议先 `writeTempFile` 落成文件再保存，避免超长 base64 上行。

### 3.5 `writeTempFile` — base64 转临时文件

把内存里的 base64（Canvas 导出、选图预览结果等）写成容器内的临时文件，换取可传给其他 JS API 的 `filePath`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | `string` | **是** | base64 数据（支持带 `data:` 前缀的 data URI）。 |
| `filePath`（返回） | `string` | — | 写入后的临时文件路径。 |

```js
const { filePath } = await window.xhs.miniTool.writeTempFile({
  data: canvas.toDataURL("image/png"),
});

await window.xhs.miniTool.saveImageToPhotosAlbum({ filePath });
// 或带入发布页
await window.xhs.miniTool.postNote({
  mediaInfo: { image_resources: [{ url: filePath }] },
});
```

使用规则：

- 返回的是**临时文件**，不保证长期有效，请即用即弃，不要持久化保存该路径。
- 仅支持常见图片 / 视频类型（png、jpeg、webp、gif、mp4），其他类型会失败。

## 4. 不可用能力

以下能力在容器内**已被禁用**，调用会失败（抛出异常、返回空值或被拦截），请勿使用。

### 4.1 已禁用的 Web API

| 分类 | 能力 |
| --- | --- |
| 定位 | 地理定位 `navigator.geolocation`。 |
| 剪贴板 | `navigator.clipboard`、`execCommand('copy'/'cut'/'paste')`。 |
| 硬件连接 | 蓝牙、USB、HID、串口。 |
| 传感器 | 加速度计、陀螺仪、磁力计、环境光、设备运动 / 朝向。 |
| 实时通信 | WebRTC、WebSocket、EventSource（SSE）。 |
| 后台运行 | Web Worker、SharedWorker、Service Worker。 |
| 屏幕 | 屏幕共享、全屏 `requestFullscreen`（全屏由容器统一管理）。 |
| 设备信息 | 电池状态、网络信息、媒体设备枚举。 |
| 存储进阶 | 持久化存储、跨域存储访问。 |
| 凭据 | WebAuthn / `navigator.credentials`、Web Locks。 |
| 窗口 | `window.open`（弹新窗口）、`window.prompt`。 |

### 4.2 已禁用的行为

| 行为 | 说明 |
| --- | --- |
| **网络请求** | `fetch` / `XMLHttpRequest`、加载外部图片 / 字体 / 媒体等一切联网请求。小工具纯本地运行，所有资源须打包在内。 |
| 动态执行代码 | `eval()`、`new Function()`。 |
| WebAssembly | WASM 编译执行（依赖 WASM 的库无法运行，见 §5）。 |
| iframe | 页面内嵌 iframe / 被外部页面嵌入。 |
| 表单跳转提交 | `<form>` 提交跳转。 |
| 插件 | Flash 等浏览器插件。 |
| 文件下载 | `a[download]`、blob 下载等；保存图片请用 `saveImageToPhotosAlbum`（见 §3.4）。 |
| 打开外链 / 新窗口 | `target="_blank"`、跳转站外。 |
| 跳转其他小工具 | 小工具间互相跳转。 |
| 长按菜单 | 已禁用。 |

### 4.3 移动端不支持

以下能力移动端 WebView 本身不支持，无法使用：支付 `PaymentRequest`、系统通知 / 推送、NFC、MIDI、XR / AR / VR、后台同步 / 下载、PWA 安装、窗口管理、指针 / 键盘锁定等。

## 5. WebGL / 图形计算边界

纯 WebGL 渲染可用，但组合能力受限：

| 场景 | 是否可用 |
| --- | --- |
| 本地资源 / Canvas / 内存对象作为纹理 | ✅ 可用 |
| 外部域名图片作为纹理 | 🔴 不可用（不支持网络请求，纹理须打包在内）。 |
| 依赖 WASM 的加速库（如 Draco / Basis / ONNX / 抠图算法库） | 🔴 不可用。 |
| 依赖 Worker 的离屏渲染（OffscreenCanvas + Worker） | 🔴 不可用。 |
| SharedArrayBuffer 多线程 | 🔴 不可用。 |

WebGL 适合用打包在小工具内的资源做本地渲染；需要 AI 图像处理等重计算的场景无法支持（既不能联网也不能跑 WASM 模型）。

## 6. 常见问题 FAQ

### 1. `<input type="file" accept="video/*">` 为什么只能选图片？

出于安全考虑，文件选择仅支持图片和视频，无论 `accept` 如何设置，此限制不可更改。

### 2. 页面里的 `<script>` 不执行 / 报 CSP 错误？

容器禁止内联脚本与行内事件处理器（`onclick="..."`）。请把 JS 放进包内 `.js` 文件，用 `<script src="./app.js">` 引入，事件用 `addEventListener` 绑定。详见 §2.5。

### 3. 能不能请求我自己的服务端接口 / 加载线上图片？

不支持任何网络请求。所有页面、脚本、图片、字体、数据都必须打包在小工具内，按完全离线自包含来设计。

### 4. 需要服务端实时推送怎么办？

不支持网络请求（含 WebSocket / SSE / WebRTC 与轮询），无法与服务端通信。

### 5. 第三方库报安全错误 / 无法运行？

多半命中了 §4。请排查是否用到了 `eval`、WebAssembly、Worker，或发起了网络请求，改用容器允许的等价方案。

### 6. 怎么把小工具生成的图片保存到相册 / 发成笔记？

用容器注入的 JS API：`writeTempFile` 把 base64 换成 `filePath`，再传给 `saveImageToPhotosAlbum` 或 `postNote`。详见 §3。

### 7. `window.xhs` 是 `undefined`？

说明当前环境未注入端能力（如在普通浏览器中预览）。请用 `window.xhs?.miniTool` 判空并提供降级路径，不要在无 SDK 时直接调用。

### 8. JS API 传网络图片地址为什么失败？

容器不联网，媒体字段只接受 `data:` base64 或 `writeTempFile` 返回的本地路径。

### 9. 能不能调用文档里没列出的其他原生能力？

不能。§3.2 列出的即为全部可用 JS API，未列出的调用会被拒绝；也不要绕过 SDK 直接向 bridge `postMessage`。

## 项目适用决策与冲突处理

- 本文件对应用户指定的当前文档，作为本项目后续小红书容器开发的优先能力基线；代码、测试和交付说明遇到容器能力问题时，应引用本文件的章节和原文 URL。
- 当前链接的 §3.2 只列出 `postNote`、`saveImageToPhotosAlbum`、`writeTempFile` 三个 API。项目中较早的 `.codex/references/` 或 `.skill/references/` 文档若出现 `openRedPage`、`pageType`、`live_photo_resources` 等未在当前链接列出的能力/字段，视为待重新核实的历史参考，不得仅凭旧文档调用。
- 当前文档明确说 `writeTempFile.data` 是 base64 数据且支持带 `data:` 前缀；实际调用继续优先原样传 `canvas.toDataURL()`，不把旧参考中的额外参数或未声明字段带入请求。
- 当前项目代码目前不依赖端能力 SDK；普通浏览器、自动化测试或容器未注入 `window.xhs` 时必须保持游戏核心流程可用，并提供降级路径。
