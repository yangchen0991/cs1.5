// minitool-zip-builder / 2026-09-01 小红书小工具静态合规回归
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const releaseManifest = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'release-files.json'), 'utf8'));
const releaseFiles = releaseManifest.files;
const supported = new Set(['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json']);
let passed = 0;
let failed = 0;

function ok(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}${detail ? `  (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}${detail ? `  (${detail})` : ''}`);
  }
}

console.log('--- A. ZIP 发布文件集合 ---');
ok(releaseFiles.every(file => fs.existsSync(path.join(root, file))), '发布清单中的文件全部存在');
ok(releaseManifest.version === 4 && releaseFiles.length === 65 && new Set(releaseFiles).size === releaseFiles.length,
  '发布清单 v4 精确包含 65 个不重复文件（P0 裁剪桌面高模与 forge 后新增 three-mesh-bvh 射线加速库）', `count=${releaseFiles.length}`);
ok(releaseFiles.every(file => supported.has(path.extname(file).toLowerCase())), '发布清单仅使用官方允许的文件类型');
ok(releaseFiles.filter(file => file === 'index.html').length === 1, '入口有且只有一个根目录 index.html');

console.log('--- B. index.html、CSP 与页面行为 ---');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
ok(/^<!DOCTYPE html>/i.test(html), '包含 DOCTYPE');
ok(/<html\b[^>]*\blang=["']zh-CN["']/i.test(html), '语言为 zh-CN');
ok(/<meta\b[^>]*charset=["']?UTF-8/i.test(html), '字符集为 UTF-8');
const viewport = (html.match(/<meta\b[^>]*name=["']viewport["'][^>]*>/i) || [''])[0];
ok(['width=device-width', 'initial-scale=1.0', 'viewport-fit=cover'].every(v => viewport.includes(v)), 'viewport 含真机与安全区必填项');
ok(!/<base\b|<iframe\b|<object\b|http-equiv=["']Content-Security-Policy/i.test(html), '无 base/iframe/object/自建 CSP');
ok(!/<form\b/i.test(html), '无 form 跳转提交入口');
ok(!/<a\b[^>]*\bdownload(?:\s|=|>)/i.test(html), '无 a[download] 文件下载入口');
ok(!/target\s*=\s*["']_blank["']/i.test(html), '无 target=_blank 新窗口/外链入口');
ok(!/\son[a-z]+\s*=|javascript:/i.test(html), '无行内事件或 javascript URI');
ok(!/<script\b[^>]*type=["']module["']/i.test(html), '全部脚本为经典脚本');

const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
ok(scriptTags.length > 0 && scriptTags.every(m => /\bsrc=["'][^"']+["']/i.test(m[1]) && !m[2].trim()), '脚本全部外置且无内联内容', `count=${scriptTags.length}`);
const initialScripts = scriptTags.map(match => (match[1].match(/\bsrc=["']([^"']+)["']/i) || [])[1]);
ok(JSON.stringify(initialScripts) === JSON.stringify([
  'config.js', 'three.min.js', 'hud.js', 'audio.js',
  'medal_system.js', 'medal_ui.js', 'medal_share.js', 'resource_loader.js', 'main.js',
]), '首屏同步加载 9 个轻量菜单、勋章与资源调度脚本');
const refs = [...html.matchAll(/<(?:script|link|img|audio|video)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);
ok(refs.every(ref => !/^(?:https?:|\/\/|\/|javascript:)/i.test(ref)), '全部页面资源使用包内相对路径');
ok(refs.every(ref => fs.existsSync(path.join(root, ref.replace(/^\.\//, '')))), '页面引用的资源全部存在', `count=${refs.length}`);
ok(refs.every(ref => releaseFiles.includes(ref.replace(/^\.\//, ''))), '页面引用的资源全部进入发布清单');
const rigJs = fs.readFileSync(path.join(root, 'enemy_rig.js'), 'utf8');
const dynamicTextureRefs = [...rigJs.matchAll(/loadTexture\(['"]\.\/([^'"]+)['"]/g)].map(m => m[1]);
ok(dynamicTextureRefs.every(ref => releaseFiles.includes(ref)), '敌人运行时贴图全部进入发布清单', dynamicTextureRefs.join(','));
const loaderJs = fs.readFileSync(path.join(root, 'resource_loader.js'), 'utf8');
const dynamicScriptRefs = [...loaderJs.matchAll(/['"]([A-Za-z0-9_-]+\.js)['"]/g)].map(m => m[1]);
const dynamicImageRefs = [...loaderJs.matchAll(/['"]([A-Za-z0-9_-]+\.(?:webp|jpg|png))['"]/g)].map(m => m[1]);
ok([...dynamicScriptRefs, ...dynamicImageRefs].every(ref => releaseFiles.includes(ref)),
  '动态加载的脚本与图片全部进入发布清单', `refs=${dynamicScriptRefs.length + dynamicImageRefs.length}`);
ok(!/https?:|fetch\s*\(|XMLHttpRequest|type\s*=\s*['"]module/.test(loaderJs) &&
  /script\.src\s*=\s*`\.\//.test(loaderJs), '资源调度器只创建包内经典脚本请求');
const medalImages = Array.from({ length: 6 }, (_, index) => `medal_0${index + 1}.webp`);
ok(medalImages.every(file => releaseFiles.includes(file) && fs.existsSync(path.join(root, file))),
  '六张勋章运行时图片全部存在并进入发布清单');
ok(medalImages.every(file => !dynamicImageRefs.includes(file)), '勋章图片不进入开局资源预加载计划');

console.log('--- C. 端能力与禁用 Web API / 行为扫描 ---');
const js = releaseFiles.filter(file => file.endsWith('.js')).map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const banned = [
  /fetch\s*\(/, /XMLHttpRequest/, /new\s+WebSocket/, /new\s+EventSource/, /RTCPeerConnection/,
  /navigator\.geolocation/, /navigator\.clipboard/, /document\.execCommand\s*\(/,
  /navigator\.(?:bluetooth|usb|hid|serial|getBattery|connection|credentials|locks)/,
  /enumerateDevices|getDisplayMedia|storage\.persist|serviceWorker\.register/,
  /new\s+(?:Shared)?Worker\s*\(/,
  /Accelerometer|Gyroscope|Magnetometer|AmbientLightSensor|DeviceMotionEvent|DeviceOrientationEvent/,
  /requestFullscreen|webkitRequestFullscreen|requestPointerLock|exitPointerLock|pointerLockElement/,
  /eval\s*\(/, /new\s+Function\s*\(/, /WebAssembly\b/,
  /window\.open\s*\(/, /window\.prompt\s*\(/,
  /\bPaymentRequest\b/, /\bNotification\b/,
];
const hits = banned.filter(pattern => pattern.test(js)).map(pattern => String(pattern));
ok(hits.length === 0, '无网络、动态执行、Worker、设备、支付通知或锁定类禁用能力残留', hits.join(','));
ok(!/^\s*(?:import|export)\b/m.test(js), 'JavaScript 无 import/export 模块语法');
ok(!/useSharedArrayBuffer\s*:\s*true/.test(js), 'BVH/图形路径未启用 SharedArrayBuffer');
ok(!/OffscreenCanvas[\s\S]{0,200}(?:Worker|postMessage)/.test(js), '无 OffscreenCanvas + Worker 组合路径');

console.log('--- D. Chrome 61 / ES2017 JavaScript 基线 ---');
const modernSyntax = [
  /\?\.(?:[A-Za-z_$\[(])/,
  /\?\?/,
  /(?:&&=|\|\|=|\?\?=)/,
  /\b\d+n\b/,
  /\b\d[\d_]*_\d[\d_]*\b/,
  /(^|[;{\s])#[A-Za-z_$][\w$]*/m,
];
const modernHits = modernSyntax.filter(pattern => pattern.test(js)).map(pattern => String(pattern));
ok(modernHits.length === 0, '发布 JavaScript 不含常见 Chrome 61 之后语法', modernHits.join(','));

console.log('--- E. 小红书端能力白名单 ---');
const medalShareJs = fs.readFileSync(path.join(root, 'medal_share.js'), 'utf8');
ok(/root\.xhs\s*&&\s*root\.xhs\.miniTool/.test(medalShareJs) &&
  /sdk\.postNote\(payload\)/.test(medalShareJs) && /sdk\.writeTempFile\(/.test(medalShareJs) &&
  /sdk\.saveImageToPhotosAlbum\(/.test(medalShareJs),
  '勋章分享仅调用 postNote/writeTempFile/saveImageToPhotosAlbum');
const sdkCalls = [...medalShareJs.matchAll(/\bsdk\.([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]);
const allowedMiniToolApis = new Set(['postNote', 'writeTempFile', 'saveImageToPhotosAlbum']);
ok(sdkCalls.every(name => allowedMiniToolApis.has(name)), '没有调用白名单外 miniTool API', [...new Set(sdkCalls)].join(','));
ok(!/https?:|fetch\s*\(|XMLHttpRequest|WebSocket|window\.open\s*\(/.test(medalShareJs),
  '勋章分享不包含网络请求、外链或外部窗口兜底');
ok(/已打开发布页，请检查内容并由你确认发布/.test(medalShareJs) &&
  !/发布成功|审核成功/.test(medalShareJs), '发布端能力只表述为打开发布页，不误报最终发布或审核成功');
ok(/\.slice\(0,\s*20\)/.test(medalShareJs) && /\.slice\(0,\s*1000\)/.test(medalShareJs),
  'postNote 标题与正文分别限制在 20 / 1000 字');

console.log('--- F. 跨端交互与规则版本 ---');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
ok(/touch-action\s*:/.test(css) && /-webkit-touch-callout\s*:/.test(css), '触摸默认行为已控制');
ok(/var\(--safe-area-inset-(?:top|right|bottom|left),\s*env\(safe-area-inset-/.test(css), '安全区兼容模拟器变量与真机 env()');
ok(/addEventListener\(["']pointerdown["']/.test(js) && /addEventListener\(["']touchmove["']/.test(js), 'Pointer Events 与多指触摸链路均存在');
const rulesPath = path.join(root, 'orbital', 'XHS_MINITOOL_CAPABILITY_LIST.md');
ok(fs.existsSync(rulesPath), '项目包含当前权威小工具规则文件');
if (fs.existsSync(rulesPath)) {
  const rules = fs.readFileSync(rulesPath, 'utf8');
  ok(/2026-09-01/.test(rules) && /Chrome \/ WebView 61/.test(rules), '权威规则已升级到 2026-09-01 / Chrome 61 基线');
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
