// QA 独立自测：Math2D（期望值全部手算，不依赖工程师实现）
// 运行：node tests/test_math2d.js
'use strict';

// 加载业务文件（经典脚本挂 window）——只读执行，不改源码
// 注：math2d.js 内部以裸标识 Math2D 自引用（checkLineCross 调 ccw）。
// 浏览器中 window.Math2D={...} 使 Math2D 成为全局绑定，可解析；
// Node 需手动镜像"全局对象=window"的语义（与浏览器行为一致）。
global.window = {};
require('../math2d.js');
global.Math2D = global.window.Math2D;   // 镜像浏览器全局作用域
const M = global.window.Math2D;

let pass = 0, fail = 0;
function check(name, got, want, tol = 1e-9) {
  const ok = typeof want === 'boolean' ? got === want : Math.abs(got - want) <= tol;
  if (ok) { pass++; console.log(`  PASS  ${name}  (got=${got})`); }
  else { fail++; console.log(`  FAIL  ${name}  got=${got}  want=${want}`); }
}
function checkCross(name, p1, p2, p3, p4, want) {
  const got = M.checkLineCross(p1, p2, p3, p4);
  const ok = got === want;
  if (ok) { pass++; console.log(`  PASS  ${name}  (got=${got})`); }
  else { fail++; console.log(`  FAIL  ${name}  got=${got}  want=${want}`); }
}

console.log('--- checkLineCross 相交/不相交/共线端点/平行 (>=6 用例) ---');
// 1. X 交叉（两对角线）
checkCross('X-cross', {x:0,z:0}, {x:4,z:4}, {x:0,z:4}, {x:4,z:0}, true);
// 2. 垂直交叉（x=2 竖线与 z=1 横线，交于 (2,1)）
checkCross('vertical×horizontal', {x:2,z:-1}, {x:2,z:3}, {x:0,z:1}, {x:4,z:1}, true);
// 3. 非轴交叉（y=x 与 y=-x+3 交于 (1.5,1.5)）
checkCross('diag-cross', {x:0,z:0}, {x:3,z:3}, {x:0,z:3}, {x:3,z:0}, true);
// 4. 平行（两竖直平行线）
checkCross('parallel', {x:0,z:0}, {x:0,z:4}, {x:1,z:0}, {x:1,z:4}, false);
// 5. 分离（同向水平，不相接）
checkCross('disjoint-h', {x:0,z:0}, {x:1,z:0}, {x:3,z:0}, {x:4,z:0}, false);
// 6. 共线重叠（严格测试排除共线 → false，与 three-cs 原实现一致）
checkCross('collinear-overlap', {x:0,z:0}, {x:3,z:0}, {x:1,z:0}, {x:2,z:0}, false);
// 7. T 型端点相接（端点落在线段上，严格 >0 排除 → false）
checkCross('t-junction-endpoint', {x:0,z:0}, {x:2,z:0}, {x:1,z:0}, {x:1,z:2}, false);
// 8. 共享端点（严格测试排除 → false）
checkCross('shared-endpoint', {x:0,z:0}, {x:2,z:2}, {x:0,z:0}, {x:2,z:-2}, false);
// 9. 明显不相交（远距）
checkCross('far-apart', {x:0,z:0}, {x:1,z:1}, {x:10,z:10}, {x:11,z:9}, false);

console.log('--- pointToSegmentDistance 垂足段内/段外两端/退化 (3+ 用例) ---');
// 1. 垂足在段内：p=(1,1) → 段 (0,0)-(2,0) → 距离 1
check('foot-inside', M.pointToSegmentDistance({x:1,z:1}, {x:0,z:0}, {x:2,z:0}), 1);
// 2. 投影超出 s2：p=(3,1) → 段 (0,0)-(2,0) → 到 (2,0) = √2
check('clamp-beyond-s2', M.pointToSegmentDistance({x:3,z:1}, {x:0,z:0}, {x:2,z:0}), Math.SQRT2);
// 3. 投影超出 s1：p=(-1,1) → 段 (0,0)-(2,0) → 到 (0,0) = √2
check('clamp-beyond-s1', M.pointToSegmentDistance({x:-1,z:1}, {x:0,z:0}, {x:2,z:0}), Math.SQRT2);
// 4. 垂足在段内（斜段）：p=(1,1) → 段 (0,0)-(2,2) → 垂足 (1,1) → 0
check('foot-on-diag', M.pointToSegmentDistance({x:1,z:1}, {x:0,z:0}, {x:2,z:2}), 0);
// 5. 退化线段（s1==s2）：p=(5,5) → (1,1) → √32
check('degenerate-seg', M.pointToSegmentDistance({x:5,z:5}, {x:1,z:1}, {x:1,z:1}), Math.hypot(4,4));

console.log('--- distance (2 用例) ---');
check('dist-3-4-5', M.distance({x:0,z:0}, {x:3,z:4}), 5);
check('dist-neg', M.distance({x:-1,z:-2}, {x:2,z:2}), 5);

console.log('--- ccw 符号约定抽查 ---');
// a=(0,0) b=(1,0) c=(0,1)：几何上 a→b→c 是逆时针（右手系 x 右、z 上）
// 实现 (c-a)×(b-a) = (0,1)×(1,0) = 0*0 - 1*1 = -1 → 返回 false
// 说明：该实现是"标准叉积 (b-a)×(c-a)"的相反数，但 checkLineCross 全部四调用
// 使用同一符号约定，仅比较符号差 → 判定结果与标准逆时针实现完全一致（不反转）
const ccwVal = M.ccw({x:0,z:0}, {x:1,z:0}, {x:0,z:1});
console.log(`  INFO  ccw((0,0),(1,0),(0,1)) = ${ccwVal} (约定为 -(b-a)×(c-a)，checkLineCross 一致性不受影响)`);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
