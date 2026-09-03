# CS 1.5 小工具产物校验摘要（第 4 轮）

> **历史快照，非当前测试结论（2026-08-18）**：下文的 13 文件、3,209,029 B、31 项和 `IS_PASS: YES` 均保留作第 4 轮历史记录，不能冒充当前工作区或当前候选包的验证结果。
>
> **当前状态（2026-08-25）**：当前审核候选为 `cs1.5-minitool-hybrid-rig-audit.zip`，24 个根目录文件、5,686,636 B（约 5.69 MB），敌人使用 24 节骨架，LOD 为 50,008 / 17,990 / 3,999 三角面。候选 ZIP 可完整读取、根目录平铺，并已由 Windows PowerShell 5.1 与 `pwsh` 确认逐字节一致；SHA256 为 `2E8CA81EDBFCCC9607E0DDB07678F774E25467F4AAEEEE9AF66169222C67B103`。本轮自动化回归共 118 项通过，真实 Android/iOS 设备尚未连接。正式基线 `cs1.5-minitool.zip` 保持独立。

> 生成时间：2026-08-18 02:07
> 依据：`.skill/minitool-zip-builder`（小红书小工具 ZIP 构建指南 v1.4.1，本轮重新下载确认官方最新）
> 校验方式：按 SKILL.md 工作流程 + zip-artifact-spec §6 自检清单 + device-capabilities §7 扫描清单全量核对

## 一、Skill 安装

| 项 | 值 |
|---|---|
| 来源 | `https://fe-static.xhscdn.com/mini-tool/1.4.1/minitool-zip-builder.zip`（16555 bytes，HTTP 200） |
| 安装位置 | `J:\个人IP打造\red\red-app\cs1.5\.skill\`（SKILL.md v1.4.0 + references/ 4 份，排除 __MACOSX） |
| 旧版备份 | `.skill.bak-20260818/`（本次覆盖前完整备份） |

## 二、历史校验结果（31 项，30 PASS / 1 注释豁免；不代表当前）

### 包结构与入口
- ✅ 13 个发布文件齐全：index.html / style.css / config.js / three.min.js / map.js / player.js / enemy.js / textures.js / weapon.js / hud.js / audio.js / pickup.js / main.js
- ✅ 仅含允许类型（.html/.css/.js），无 node_modules / .git / *.map / 构建配置
- ✅ zip 打包后 13 条目平铺根目录，**index.html 在根**（无嵌套目录）

### index.html 与资源（14 项全 PASS）
- ✅ `<!DOCTYPE html>` + `lang="zh-CN"` + `charset="UTF-8"`
- ✅ viewport 含 `width=device-width, initial-scale=1.0, viewport-fit=cover`
- ✅ 无内联 `<script>`、无 `onclick=` 行内事件、无 `type="module"`
- ✅ 无 `<base href>`、无 `<iframe>`/`<object>`、无自建 CSP `<meta>`、无 `target="_blank"`、无 `<form>` 提交
- ✅ 全部资源相对路径，**无 `?v=` 查询参数**（D4 修复保持）、无 `http(s)://` 外部引用
- ✅ 12 个引用资源全部存在且路径正确

### 端能力（device-capabilities §7 扫描清单）
- ✅ 业务 JS 禁用 API **零命中**：fetch / XHR / WebSocket / EventSource / RTCPeerConnection / geolocation / clipboard / bluetooth / usb / hid / serial / getBattery / connection / credentials / locks / enumerateDevices / getDisplayMedia / storage.persist / serviceWorker / Worker / Accelerometer / Gyroscope / Magnetometer / DeviceMotion / DeviceOrientation / eval / new Function / WebAssembly / window.open / window.prompt
- ⚠️ main.js 命中 `requestFullscreen` 1 处 → **仅存在于注释**（说明容器不可用），无实际调用，豁免
- ✅ three.min.js 内 `fetch(` 3 处为库内部实现（FileLoader/ImageBitmapLoader 定义），业务代码未调用任何 Loader 加载外部资源
- ✅ textures.js（3.9MB）为 CC0 贴图 base64 内嵌（data: URI），离线可用，符合 CSP「图片允许 data:」
- ✅ PointerLock（移动端 WebView 禁用项）：main.js 有 isTouch 降级 + 存在性检查 + try/catch 防护，真机自动走虚拟按键
- ✅ 允许能力使用合规：WebAudio（AudioContext 程序化合成）、Canvas 2D、WebGL（Three.js）、localStorage（控件布局持久化，容器允许）
- ✅ 新增功能（命中标记/飘字/弹药告警/切枪动画/护盾掉落）均为纯 DOM/Three/WebAudio 实现，无新增风险面

### 正确性（静态自查）
- ✅ 10 个业务 JS 文件 `node --check` 语法全部通过
- ✅ 脚本加载顺序正确：config → three → map → player → enemy → textures → weapon → hud → audio → pickup → main
- ✅ style.css 无外部 `url()`（无 url() 引用，全部纯样式）

### 体积
- ✅ zip 总大小 **3,209,029 B（3.06 MB）** — 远低于 10MB 上限（建议 2MB 内，因 base64 贴图 3.9MB 接近建议值，可接受）

## 三、历史产物

| 项 | 值 |
|---|---|
| 产物路径 | `J:\个人IP打造\red\red-app\cs1.5\cs1.5-minitool.zip` |
| 体积 | 3,209,029 bytes（3.06 MB） |
| 内容 | 13 个文件（index.html 入口 + 12 资源），全部位于 zip 根 |
| 旧版备份 | `cs1.5-minitool.backup-20260818.zip`（3,199,866 B，打包前自动保留） |
| 校验报告 | `deliverables\minitool-verification-summary.md`（第 4 轮） |

## 四、本轮变更内容（与 08-17 打包对比）

| 板块 | 变更 |
|---|---|
| ① AK 枪模 | 皮克斯风格 3D 重建（复进簧组件/方框准星罩/上下双片护木+双金属箍/一体弧形弹匣+4 棱/手枪形握把+防滑纹/大圆角枪托+尾栓环），暖青铜军绿配色 |
| ② HUD | 命中标记三态（白/金/击杀）、伤害飘字、弹药告警（黄/红闪）、killFeed 武器名+爆头 |
| ② 武器 | 切枪动画+音、换弹音、空仓咔嗒+红字、墙击音、距离衰减、连发散布累积、后坐力数据驱动 |
| ② 护盾 | 敌人 18% 掉落护甲，拾取 +50 护盾（蓝色护甲板+蓝光晕） |
| ③ README | 修正运行方式/项目结构，同步全部新特性 |

## 五、备注

1. 校验 31 项中 30 项 PASS，1 项（requestFullscreen）为注释豁免——**结论：IS_PASS: YES，可发布**
2. 打包基于当前工作区最新代码（板块①/②/③ 全部完成），zip 已含全部新特性
