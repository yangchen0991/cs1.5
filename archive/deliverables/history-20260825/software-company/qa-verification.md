# QA 验证报告：three-cs 融合实现（T01 / T02′ / T04′ / T05）

> **历史快照标记（2026-08-21）**：本报告只覆盖标题所述旧工作树；下文的 `IS_PASS: YES`、16/16、31/31、6 个文件和旧加载顺序均保留为历史记录，不是当前工作区或当前候选包的重新测试结论。
>
> **当前状态（2026-08-25）**：当前入口实际加载顺序为 `config.js → math2d.js → three.min.js → forge.js → ak47_model.js → ak47_tex.js → awp_model.js → awp_tex.js → enemy_model.js → enemy_rig.js → map.js → player.js → enemy.js → textures.js → weapon.js → hud.js → audio.js → pickup.js → main.js`。当前审核候选 `cs1.5-minitool-hybrid-rig-audit.zip` 为 24 文件、5,686,636 B（约 5.69 MB），敌人使用 24 节骨架与 50,008 / 17,990 / 3,999 LOD；Windows PowerShell 5.1 与 `pwsh` 已确认包内文件与当前工作区逐字节一致。本报告正文仍是 2026-08-21 历史审查，不能替代本轮 118 项自动化回归和浏览器/触控模拟记录；真实 Android/iOS 设备尚未连接。

> QA：严过关 ｜ 日期：2026-08-21 ｜ 依据：merge-plan.md v1.1 §10 精确实施规格
> 验证方式：**独立审查**（逐文件读源码，不信任工程师总结）+ 独立 Node 自测（期望值手算）+ 合规扫描 + 行为等价性推理
> 被测版本：cs1.5 工作树 2026-08-21 22:09（index.html → config → math2d → three → forge → map → player → enemy → textures → weapon → hud → audio → pickup → main）

---

## 1. 验证结论

**IS_PASS: ✅ YES**

- 全部 4 个融合任务（T01/T02′/T04′/T05）的规格项逐条核实 **PASS**，无 P0/P1 缺陷。
- 独立自测：Math2D **16/16** 通过；行为测试（boxSegments / _canSeePlayer / _avoidAI / enemyShot3D 回退链）**31/31** 通过。
- 6 个业务文件 `node --check` 语法全部通过。
- 合规扫描：业务文件对受限 API/外部资源 **零命中**。
- 仅发现 5 条 P2 级（文档/流程/边缘）建议项，不影响放行；其中 1 条为**发布流程提醒**（zip 未重新打包，见 §4 P2-5）。

---

## 2. 逐项验证结果与证据

### A. 静态代码审查（重点，逐文件）

#### A1. math2d.js（T01）— ✅ PASS
- 全文 25 行，与规格 §10.1 一致：`ccw / checkLineCross / pointToSegmentDistance / distance` 四方法挂 `window.Math2D`。
- **checkLineCross 数学正确性**：实现为
  `ccw(p1,p3,p4) !== ccw(p2,p3,p4) && ccw(p1,p2,p3) !== ccw(p1,p2,p4)`，标准线段相交判定。
- **ccw 符号约定（关键核查项）**：实现 `(c.x-a.x)*(b.z-a.z) - (b.x-a.x)*(c.z-a.z) > 0` 实为标准叉积 `(b-a)×(c-a)` 的**相反数**（即 `cross(c-a, b-a)`）。但 checkLineCross 的 4 次 ccw 调用**全部使用同一约定**，判定只依赖符号差异，因此**不会导致相交判定反转**——用 9 个手算用例实测（含 X 交叉、垂直交叉、平行、共线、T 端点、共享端点）全部符合预期。⚠️ 注意：该实现是**严格交叉**语义（排除共线/端点相接），与 three-cs 原版一致。
- **pointToSegmentDistance**：`t` 经 `Math.max(0, Math.min(1, t))` 钳制，正确处理投影超出两端；`l2<1e-9` 退化为点到单点距离。3+ 用例通过。
- **distance**：`Math.hypot(a.x-b.x, a.z-b.z)` 正确。2 用例通过。
- ⚠️ P2 观察：方法内部以裸标识 `Math2D.ccw` 自引用（line 11）。浏览器中 `window.Math2D={...}` 使 `Math2D` 成为全局绑定，产品环境可解析；但规格 §10.1 声称"无任何依赖，可独立单测"在 Node 环境需 window 镜像才能成立（详见 §4 P2-2）。

#### A2. enemy.js（T02′ + T04′）— ✅ PASS
- `_canSeePlayer()`（319-349）：
  - ① dist/FOV 检测 **原样保留**（320-331：eye 高 1.6、sightRange、facing 点积 FOV 半角）；
  - ② seg 分支（334-346）为**新增分支**：`useSeg` 判定（losMode==='seg' && window.Math2D && map.boxSegments）→ `checkLineCross` 遍历墙段 → **无遮挡直接 return true**（掩体不遮）→ 有遮挡走 `raycast` 兜底（`wallDist >= dist - 0.5`）；
  - ③ **原 raycast 墙遮挡段仍保留**（347-348），losMode='ray' 时完全回到原逻辑（行为等价性测试 B4 实证）；
  - ④ `_seeTimer` 0.12s 节流原样保留（366-372）。
- `_avoidAI(dt)`（595-617，新增）：
  - ① 只推自己（仅改 `this.position`，循环内 `o === this` 跳过、`!o.alive` 跳过）；
  - ② 推完 `this.map.collide(...)` 防入墙（614-615，行为测试 C3/C4 实证）；
  - ③ 10Hz 节流（`_avoidTimer=0.1`，行为测试 C6 实证）；
  - ④ `this.enemies` null/空/单敌防御（600 行 `if (!others || others.length < 2) return;`，行为测试 C5 实证）。
- update() 中 `this._avoidAI(dt)` 位于 **422 行，mesh.position.set 之前**（423 行）✅。
- 开火处 `enemyShot3D(this.position.clone())`（635 行）带 `clone()` ✅。
- **AI 追击/开火/横移零改动核查**：本次融合在 enemy.js 的全部触点仅为 ①_canSeePlayer 墙遮挡段 ②新增 _avoidAI ③update 加 1 行调用 ④_shootOnce 音效行。`_engage` 中的追击/后撤/横移/开火逻辑为既有代码（merge-plan §10 行号锚点即以含该逻辑的树为基准），本次未引入 L1-2 环绕走位/planning() 任何代码。

#### A3. audio.js（T04′）— ✅ PASS
- `init(camera, scene)`（20-48）：
  - ① `new THREE.AudioListener()` + `camera.add(this.listener)`（35-36）；
  - ② PositionalAudio 池 6 节点：`setBuffer(this._makeShotBuffer())` + `setRefDistance(8)` + `setRolloffFactor(1.2)` + `setMaxDistance(60)` + `scene.add(pa)`（38-46）；
  - ③ 整体 try/catch，失败置 `listener=null; _paPool=[]`（47）。
- `enemyShot3D(pos)`（124-138）：
  - 回退链：`!enabled || !ctx || !listener || 池空` → `enemyShot()`（125-128）；`try { 池循环取用 + position.copy + stop + play } catch { enemyShot() }`（129-137）。**异常/池空/无 listener 均静默回退，不会中断敌人 AI**（行为测试 D1-D6 全部实证，含 play 抛异常用例 D5）。
- `_makeShotBuffer()`（113-121）：0.12s 指数衰减白噪声，与规格一致。

#### A4. map.js boxSegments()（T02′）— ✅ PASS
- 377-390：`yTh = CONFIG.ai.losSegY || 1.55`，`b.maxY < yTh` 过滤。
- **掩体箱过滤正确**：当前地图 8 个掩体箱高 ≤1.4（1.2/1.0/1.4/0.7），全部 <1.55 被过滤；高墙 wallH=5 全部参与（行为测试 A 用真实 Box 类实证：2 高墙×4 边=8 段，掩体 0 段）。
- **惰性缓存**：`this._segs` 首次构建后复用（boxes 在 `_build()` 后静态，无失效风险；行为测试实证第二次调用返回同一引用）。

#### A5. main.js（T04′/T05）— ✅ PASS
- 848 行 `this.audio.init(this.camera, this.scene)`：相机（64 行）/场景（61 行）均已先创建，且在 `_beginRun()` 用户手势内调用（AudioContext 合规）✅。
- 933 行 `en.enemies = this.enemies`：`new Enemy(...)` + `spawnAt` 之后、`push` 之前注入动态数组引用 ✅（注入时机正确：push 后数组含自身，满足 `_avoidAI` 的 `length<2` 判断语义，行为测试 C 系列按此生产语义实证通过）。

#### A6. config.js（T01）— ✅ PASS
- 112-117 行 `CONFIG.ai` 三字段齐全：`losMode:'seg'`、`losSegY:1.55`、`aiSpacing:0.9`，位置在 enemy 块之后 ✅。

#### A7. index.html / tools/package.ps1（T01/T05）— ✅ PASS
- index.html 189 行 `<script src="math2d.js">` 位于 config.js（188）与 three.min.js（190）之间 ✅。
- package.ps1 第 5 行 `$files` 数组含 `"math2d.js"`（config.js 之后），注释"14 release files" ✅。
- README 新增 2 条特性（14 行视线轻量化+间距防重叠、15 行 3D 空间音频）✅（T05 要求达成）。

### B. 独立运行测试（自写，期望值手算）— ✅ PASS

| 套件 | 文件 | 用例 | 结果 |
|---|---|---|---|
| Math2D 单测 | `tests/test_math2d.js` | checkLineCross 9（相交/垂直/非轴/平行/分离/共线/T端点/共享端点/远距）+ pointToSegmentDistance 5（段内垂足/两端钳制/斜段/退化）+ distance 2 + ccw 抽查 | **16/16 PASS** |
| 行为测试 | `tests/test_behaviors.js` | boxSegments 5 + _canSeePlayer 9（seg无遮/有遮兜底/近墙/ray回退/dist/FOV/Math2D缺失防御）+ _avoidAI 10（半距推开/只推自己/远距不推/collide防入墙/墙修正/null防御/节流/重合防御/死亡跳过）+ enemyShot3D 7（enabled=false/listener=null/池空/正常/异常回退/池循环） | **31/31 PASS** |

- `node --check` 语法检查：math2d.js / config.js / map.js / enemy.js / audio.js / main.js **全部 OK**。

### C. 合规扫描 — ✅ PASS（业务文件零命中）

对 math2d.js / config.js / map.js / enemy.js / audio.js / main.js / index.html / tools/package.ps1 grep：

| 模式 | 结果 |
|---|---|
| `fetch(` / `XMLHttpRequest` / `new WebSocket` / `new EventSource` / `new Worker` | 0 命中 |
| `eval(` / `new Function` / `WebAssembly` / `type="module"` | 0 命中 |
| `<iframe` / `<object` / `<base href` | 0 命中 |
| `http://` / `https://` | 0 命中（仅 three.min.js 内部注释，vendored 库豁免） |
| `import` / `export` | 业务文件 0 命中；仅 mobile.js（未被 index.html 加载、不在打包清单的遗留文件）含 ESM 语法，**不在交付范围** |

### D. 行为等价性推理（关键）— ✅ PASS

1. **losMode='ray' 回退开关**：`useSeg` 判定失败 → 直接落入 347-348 行原 raycast 逻辑；行为测试 B4 实证（losMode 切 'ray' 后 boxSegments 不再被调用、raycast 调用 1 次、结果与原逻辑一致）。**seg 分支是新增分支而非替换原逻辑**，原 raycast 墙遮挡段仍在。
2. **enemyShot3D 静默回退**：WebAudio 不可用（ctx 创建失败 → enabled=false）、listener/池创建失败（catch 置空）、运行期 play 抛异常——三条路径全部回退 `enemyShot()` 且不回抛，敌人 AI 开火循环不中断（D1/D2/D3/D5 实证）。
3. **行为不变验证**：掩体箱（h≤1.4）不参与 2D 遮挡 → 掩体后敌人可见性与旧版 raycast 一致（boxSegments 过滤实证 + _canSeePlayer seg 分支"无遮挡即可见"）。

---

## 3. 测试覆盖说明（诚实声明）

- 独立自测覆盖了**纯逻辑层**（Math2D 数学、boxSegments 过滤、_canSeePlayer 分支选择、_avoidAI 位置约束、enemyShot3D 回退链），均在 Node 中以真实业务文件 + 原型注入方式执行（未改源码）。
- **未覆盖**：真实 WebGL 渲染、THREE.PositionalAudio 实际出声/方位衰减、PointerLock/触屏容器交互、AudioContext 真机策略——这些必须真机验证（见 §5）。

---

## 4. 发现的 Bug / 风险（无 P0/P1，全部 P2）

| # | 级别 | 类型 | 位置 | 描述 | 建议 |
|---|---|---|---|---|---|
| P2-1 | 文档 | README | README.md 22/64/122 行 | 新增 math2d.js 后文件数应为 **14**，README 仍写"13 个文件/13 文件/13 文件清单"（3 处）；且 76 行项目结构、89 行加载顺序注释均未列 math2d.js | 改为 14，结构/顺序注释补 math2d.js |
| P2-2 | 健壮性 | math2d.js | line 11 | 内部以裸标识 `Math2D.ccw` 自引用。浏览器全局作用域可解析（产品无影响），但规格"无依赖可独立单测"在非浏览器环境需 window 镜像 | （可选）内部改 `this.ccw` 或 `window.Math2D.ccw`，增强环境无关性 |
| P2-3 | 边缘 | enemy.js | 608 行 | `dSq < 1e-6` 跳过完全重合敌人（防除零）。若两敌恰好同坐标出生（randomSpawn 兜底仅 6 固定点，理论可能）会保持重叠 | 可接受；如需更稳可在重合时沿随机方向推 0.01 |
| P2-4 | 边缘 | audio.js | 33-47 行 | ctx 创建失败时 3D 块仍执行，`_makeShotBuffer()` 对 null ctx 抛错被 catch 重置（安全但浪费），且 camera 上残留 1 个无 ctx 的 listener（无害） | （可选）3D 块前加 `if (!this.ctx) return` |
| P2-5 | 流程 | 打包 | _release/ 与 cs1.5-minitool.zip | 均为 16:27 旧产物（含旧 13 文件、**不含 math2d.js**）；package.ps1 已更新但**未重新执行** | 发布前必须重跑 `tools/package.ps1`，并核对 zip 内含 math2d.js |

**未发现**：P0（必须修）与 P1（建议修）级缺陷。

---

## 5. 真机验证建议点（放行后）

1. **视线行为对比**：掩体箱后敌人仍可被看见、高墙后敌人不可见——与旧版一致（T02′ 最大风险 R2）。
2. **FPS 无回退**：多敌波次下 seg 判定节流 0.12s，低端机帧率不低于旧版（R5）。
3. **AI-AI 不重叠**：18 敌满编波观察敌人不再穿模，且无人被推入墙内（R4）。
4. **3D 音频方位**：敌人在左/右/远/近时枪声有方位与距离衰减；静音/WebAudio 异常时游戏不崩（R6）。
5. **重打包**：确认 zip 含 math2d.js、体积 ~3.07MB、离线双击可玩（T05/R6）。

---

## 6. 路由决策

- **Send To: NoOne**（无需返工）
- 全部验证项 PASS；仅 P2 级文档/流程建议，可由工程师顺手处理（README 文件数、重新打包），不阻塞放行。

*QA 独立验证完毕。测试脚本留存：`cs1.5/tests/test_math2d.js`、`cs1.5/tests/test_behaviors.js`（不在打包清单）。*
