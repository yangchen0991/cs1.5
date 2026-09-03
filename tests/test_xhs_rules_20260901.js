// 小红书小工具 2026-09-01 官方规则独立门禁
// 该测试不依赖 tools/release-files.json，可在当前 GitHub checkout 单独运行。
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let passed = 0;
let failed = 0;
let warned = 0;

function ok(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}${detail ? `  (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}${detail ? `  (${detail})` : ''}`);
  }
}

function warn(condition, label, detail = '') {
  if (!condition) return;
  warned++;
  console.warn(`  WARN  ${label}${detail ? `  (${detail})` : ''}`);
}

const rootFiles = fs.readdirSync(root, { withFileTypes: true });
const runtimeJsFiles = rootFiles
  .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
  .map(entry => entry.name);
const jsByFile = new Map(runtimeJsFiles.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
const js = [...jsByFile.values()].join('\n');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

console.log('--- A. 2026-09-01 规则文件存在 ---');
ok(fs.existsSync(path.join(root, 'orbital', 'XHS_MINITOOL_CAPABILITY_LIST.md')), '存在当前权威能力清单');
ok(fs.existsSync(path.join(root, 'docs', '小红书小工具开发规则-2026-09-01.md')), '存在 2026-09-01 人工发布清单');
const rules = fs.readFileSync(path.join(root, 'orbital', 'XHS_MINITOOL_CAPABILITY_LIST.md'), 'utf8');
ok(/2026-09-01/.test(rules) && /Chrome \/ WebView 61/.test(rules), '规则文件锁定 2026-09-01 与 Chrome 61 基线');
ok(/postNote/.test(rules) && /saveImageToPhotosAlbum/.test(rules) && /writeTempFile/.test(rules), '规则文件记录三项端能力白名单');

console.log('--- B. HTML / CSP / 页面行为 ---');
ok(/^<!DOCTYPE html>/i.test(html), '入口包含 DOCTYPE');
ok(!/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(html), '无内联 script');
ok(!/\son[a-z]+\s*=|javascript:/i.test(html), '无行内事件或 javascript URI');
ok(!/<script\b[^>]*type=["']module["']/i.test(html), '无 ES Module 入口');
ok(!/<iframe\b|<object\b/i.test(html), '无 iframe / object');
ok(!/<form\b/i.test(html), '无表单跳转提交入口');
ok(!/<a\b[^>]*\bdownload(?:\s|=|>)/i.test(html), '无 download 链接');
ok(!/target\s*=\s*["']_blank["']/i.test(html), '无 target=_blank');
const refs = [...html.matchAll(/<(?:script|link|img|audio|video)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);
ok(refs.every(ref => !/^(?:https?:|\/\/|javascript:)/i.test(ref)), 'HTML 静态资源无网络或外链引用');

console.log('--- C. 禁用 Web API / 网络 / 动态代码 ---');
const banned = [
  ['fetch', /\bfetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /new\s+WebSocket\b/],
  ['EventSource', /new\s+EventSource\b/],
  ['WebRTC', /\bRTCPeerConnection\b/],
  ['geolocation', /navigator\.geolocation/],
  ['clipboard', /navigator\.clipboard|document\.execCommand\s*\(/],
  ['hardware API', /navigator\.(?:bluetooth|usb|hid|serial)\b/],
  ['device sensor', /\b(?:Accelerometer|Gyroscope|Magnetometer|AmbientLightSensor|DeviceMotionEvent|DeviceOrientationEvent)\b/],
  ['Worker', /new\s+(?:Shared)?Worker\s*\(/],
  ['ServiceWorker', /serviceWorker\.register\s*\(/],
  ['screen sharing', /getDisplayMedia\s*\(/],
  ['fullscreen', /requestFullscreen|webkitRequestFullscreen/],
  ['battery/network/device enumeration', /navigator\.(?:getBattery|connection)\b|enumerateDevices\s*\(/],
  ['persistent storage', /storage\.persist\s*\(/],
  ['credentials/locks', /navigator\.(?:credentials|locks)\b/],
  ['window.open', /window\.open\s*\(/],
  ['window.prompt', /window\.prompt\s*\(/],
  ['eval', /\beval\s*\(/],
  ['new Function', /new\s+Function\s*\(/],
  ['WebAssembly', /\bWebAssembly\b/],
  ['PaymentRequest', /\bPaymentRequest\b/],
  ['Notification', /\bNotification\b/],
  ['Pointer Lock', /requestPointerLock|exitPointerLock|pointerLockElement/],
  ['direct bridge postMessage', /(?:miniTool|xhs|bridge)[\s\S]{0,80}\.postMessage\s*\(/i],
];
for (const [name, pattern] of banned) ok(!pattern.test(js), `无 ${name}`);
ok(!/useSharedArrayBuffer\s*:\s*true/.test(js), '未启用 SharedArrayBuffer BVH 路径');
ok(!/OffscreenCanvas[\s\S]{0,200}(?:Worker|postMessage)/.test(js), '无 OffscreenCanvas + Worker 组合路径');

console.log('--- D. Chrome 61 / ES2017 语法防线 ---');
const modernSyntax = [
  ['optional chaining', /\?\.(?:[A-Za-z_$\[(])/],
  ['nullish coalescing', /\?\?/],
  ['logical assignment', /(?:&&=|\|\|=|\?\?=)/],
  ['BigInt literal', /\b\d+n\b/],
  ['numeric separator', /\b\d[\d_]*_\d[\d_]*\b/],
  ['private class field', /(^|[;{\s])#[A-Za-z_$][\w$]*/m],
];
for (const [name, pattern] of modernSyntax) ok(!pattern.test(js), `发布根 JS 无 ${name}`);

console.log('--- E. 小红书端能力白名单 ---');
const sharePath = path.join(root, 'medal_share.js');
const shareJs = fs.existsSync(sharePath) ? fs.readFileSync(sharePath, 'utf8') : '';
const allowed = new Set(['postNote', 'saveImageToPhotosAlbum', 'writeTempFile']);
const apiCalls = [...shareJs.matchAll(/\bsdk\.([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]);
ok(apiCalls.every(name => allowed.has(name)), 'medal_share 只调用允许的三项 miniTool API', [...new Set(apiCalls)].join(','));
ok(/root\.xhs\s*&&\s*root\.xhs\.miniTool/.test(shareJs), '端能力调用前检查 SDK 注入');
ok(!/发布成功|审核成功/.test(shareJs), 'postNote 不误报最终发布/审核成功');
ok(/\.slice\(0,\s*20\)/.test(shareJs) && /\.slice\(0,\s*1000\)/.test(shareJs), '分享标题/正文限制 20/1000 字');

console.log('--- F. Chrome 61 CSS 渐进增强审计 ---');
// 以下特性本身不直接判失败：允许继续存在，但必须在发布前按人工清单验证基础 fallback。
// 保留 WARN 是为了让当前技术债在每次规则测试中可见，避免被误认为已完成兼容。
const cssDebt = [
  ['inset shorthand', /(?:^|[;{\s])inset\s*:/gm],
  ['CSS min/max/clamp function', /(?:^|[\s:(,])(?:min|max|clamp)\s*\(/gm],
  ['flex gap', /display\s*:\s*flex[\s\S]{0,220}\bgap\s*:/gm],
  ['env() safe area', /\benv\s*\(/gm],
  ['backdrop-filter', /\bbackdrop-filter\s*:/gm],
  ['overscroll-behavior', /\boverscroll-behavior(?:-[xy])?\s*:/gm],
];
for (const [name, pattern] of cssDebt) {
  const matches = css.match(pattern) || [];
  warn(matches.length > 0, `${name} 晚于 Chrome 61；发布前必须确认基础 fallback`, `matches=${matches.length}`);
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed, ${warned} warnings`);
if (failed) process.exit(1);
