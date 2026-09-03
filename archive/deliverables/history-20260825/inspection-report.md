# CS1.5 全面代码检查报告

> **历史快照说明（2026-08-15）**：本文的问题数量、行号和“待修复”结论对应旧工作树。当前代码已发生多轮演进；其中本轮修复的击杀提示参数丢失、蹲伏射线高度和切枪散布继承不能再按本文旧结论判断。当前事实以 `README.md`、`PRD.md`、源码和当前审核候选包为准。

| 项目信息 | 内容 |
| --- | --- |
| 项目 | cs15（CS 1.5 浏览器 FPS 游戏） |
| 检查人 | 架构师 高见远（Bob） |
| 检查日期 | 2026-08-15 |
| 检查范围 | config.js / weapon.js / player.js / enemy.js / map.js / main.js / hud.js / audio.js / pickup.js / index.html / style.css（全部通读） |
| 检查维度 | ①功能缺陷/Bug ②性能隐患 ③代码质量 ④一致性 ⑤可维护性 |

---

## 0. 总览

- 项目技术栈：Three.js UMD 经典脚本 + 原生 JS + DOM HUD，按 `index.html` script 顺序加载（config → three → map → player → enemy → weapon → hud → audio → pickup → main），全部类挂 `window`。
- **整体评价**：架构清晰、职责基本合理（WeaponSystem / Player / Enemy / GameMap / HUD / AudioFX 分离），性能优化意识良好（对象池、脏检查、节流、DPR 上限）。核心武器系统（三角级 Raycaster 命中 + 部位倍率 + 墙遮挡 + 弹孔贴墙法线）已完成并可用。
- **主要问题集中在**：反馈链路不完整（音效/准星/告警多处空实现或未接入）、职责错位（命中音效由 HUD 触发）、后坐力数值失衡、部分 HUD 小缺陷、枪模视觉未差异化。

共记录 **37 项问题**：高 10 / 中 16 / 低 11。

---

## 1. 高严重度问题（10 项）

### H-1 换弹音效未接入（对应 PRD D1）
- **位置**：weapon.js L94-101（startReload） / audio.js L118-133（reload 已实现）
- **描述**：`AudioFX.reload()` 已完整实现（三次咔哒），但 `WeaponSystem.startReload()` 中从未调用 `this.audio.reload()`，换弹全程无声。
- **修复**：`startReload()` 成功进入换弹时调用 `this.audio.reload(this.currentId)`；换弹完成时补充完成音（P1 S4 分段音）。

### H-2 空仓反馈弱（对应 PRD D2）
- **位置**：weapon.js L160-167
- **描述**：弹匣空时仅 `hud.toast('弹匣空了！按 R 换弹')`，无空仓"咔嗒"音，弹药数字无红色告警。
- **修复**：空仓分支增加 `audio.dryFire()`（新增短促咔嗒）+ `hud.setAmmoWarning('empty')`（弹药数字红色闪烁 + RELOAD 提示）。

### H-3 `HUD.crosshairFire()` 空实现（对应 PRD D3）
- **位置**：hud.js L86-88；调用点 weapon.js L171
- **描述**：射击时准星无任何扩张/变色反馈，且当前 `firing` 红色 class 被 `hitMarker()` 混用（hud.js L81），导致"射击反馈"与"命中反馈"无法区分。
- **修复**：实现 `crosshairFire(spread)`：准星 gap 短暂 +30%~40%（约 80ms）并加 `firing` class 变色；命中标记改用独立元素（见 M-1/F1-F3）。

### H-4 index.html 初始备弹与 config 不一致（对应 PRD D4）
- **位置**：index.html L70（`<span id="ammoReserve">36</span>`） vs config.js L38（`reserve: 60`）
- **描述**：静态 HTML 写死 36，config 为 60。运行时虽会被 `hud.updateWeapon()` 覆盖，但首帧/无 JS 时显示错误，且违背"config 单一数据源"。
- **修复**：index.html 改为 60（并建议后续 HTML 只保留占位，数值统一由 config 初始化）。

### H-5 低弹量（≤25%）无预警（对应 PRD D5）
- **位置**：hud.js L51-58（updateWeapon）
- **描述**：弹匣将空时无任何视觉预警，玩家常打到空仓才反应。
- **修复**：`updateWeapon` 中按 `mag / magSize` 阈值切换弹药数字 class：≤25% 变黄（`ammo-low`），=0 红色闪烁（`ammo-empty`）。

### H-6 后坐力恢复速率远小于 AK 连发上抬速率，压枪失衡
- **位置**：player.js L192-197（恢复 `dt * 0.06`，即 0.06 rad/s） vs config.js L53（AK recoil.x=0.020）weapon.js L195（每发 applyRecoil）
- **描述**：AK 600rpm ≈ 10 发/s，每发上抬 0.020 rad → 理论秒上抬 0.20 rad；恢复仅 0.06 rad/s，玩家需持续大幅下拉才能压住，且恢复速率与武器无关（USP 同样 0.06）。恢复过慢 + 无武器差异，手感失衡。
- **修复**：恢复速率改为数据驱动（`recoil.recover` 字段），AK 慢（约 0.05-0.08）、USP 快（约 0.12-0.15）；配合 P1 S2 后坐力模式差异化。

### H-7 命中音效职责错位：`audio.hit()` 由 HUD 触发
- **位置**：hud.js L79-84（hitMarker 内 `this.audio.hit(head)`） / weapon.js L214
- **描述**：命中音效挂在 HUD 层，导致：①击杀音无法区分（hud.hitMarker 无 killed 参数）；②墙击音无处挂；③武器系统持有 audio 引用却未直接用，职责链混乱。后续加"爆头/击杀/墙击"多种音效时必然要重构。
- **修复**：把音效调用从 `hud.hitMarker` 移出，统一由 `WeaponSystem._fire()` 直接调用 `audio.hit(head, killed)` / `audio.wallHit(type)`；HUD 只负责视觉。

### H-8 弹孔池容量不足，AK 连发弹孔丢失
- **位置**：weapon.js L435-447（`_buildImpactPool` 30 个）/ L449-460（`_spawnImpact` 池空直接 return）/ L457（life=6s）
- **描述**：AK 600rpm 每 6s 发射 60 发 > 池容量 30，池耗尽后新弹孔静默丢失（约丢一半）。
- **修复**：池扩至 60-80；或降低 life（6s→3s）；或池满时回收最旧弹孔。推荐"池 64 + life 4s"。

### H-9 射击地面无弹孔、弹道穿地
- **位置**：map.js L209-216（raycastDetailed 只查 `this.boxes`）/ weapon.js L217-220
- **描述**：地面是 PlaneGeometry（map.js L71-90），不在 boxes 中。向脚下射击时墙判定 `wall.t = range`，tracer 延伸到 200m 外、无弹孔，视觉上"子弹穿地"。
- **修复**：将地面加入射线检测（raycastDetailed 增加地面平面求交，法线恒 +Y），或降低向地面射击的 tracer 终点到地面高度。P1 范围（不影响命中，仅视觉）。

### H-10 切枪打断换弹无反馈 + `_semiPending` 残留导致切枪后意外开火
- **位置**：weapon.js L79-92（switchTo）/ L153-156（triggerSemi）/ L126-131
- **描述**：①`switchTo()` 直接把 `reloadTimer=0`（换弹静默取消，无提示/无音效）；②`switchTo()` 只清 `firing=false` 未清 `_semiPending`，若换弹/冷却中点击过半自动（`_semiPending=true` 挂起），切枪后冷却结束会**自动打出新武器一发**。
- **修复**：①切枪时若 `reloadTimer>0` 播放取消提示；②`switchTo()` 里 `this._semiPending = false`；③换弹中/切枪中调用 `triggerSemi` 直接忽略（不挂起 pending）。

---

## 2. 中严重度问题（16 项）

### M-1 命中标记与射击闪红混用同一 CSS class（对应 PRD F1-F3 前置缺陷）
- **位置**：hud.js L81 / style.css L83
- **描述**：`hitMarker()` 复用 `firing` class 闪红，既表达"射击中"又表达"命中"，且 80ms setTimeout 在 AK 连发（99ms 间隔）下基本失效（第二次命中时前一次 remove 定时器可能先触发，标记提前消失）。
- **修复**：新增独立 `#hitmarker` DOM 元素（X 形），按 普通命中(白)/爆头(金放大)/击杀(更醒目) 分级显示，时长 150-300ms，用 CSS 动画而非 setTimeout 复位。

### M-2 killFeed 无武器名/爆头标识（对应 PRD F3）
- **位置**：weapon.js L216 / hud.js L71-77 / main.js L460-464
- **描述**：击杀播报仅显示 "你 ✕ 敌人名"，无武器名、无爆头标识；且击杀统计用 `HUD.prototype.killFeed` 猴子补丁（main.js）实现，可维护性差。
- **修复**：`killFeed(name, weaponName, headshot)` 增强显示；统计改用显式回调（如 `hud.onKill` 事件或 weapon 直接调用 main 注入的 `onKill`）。

### M-3 换弹音效与换弹时长不同步、无分段
- **位置**：audio.js L118-133（三次 click 共 0.5s 结束） vs config.js reloadTime 1.6/2.4s
- **描述**：换弹音 0.5s 播完，动作持续 1.6-2.4s，后半段无声；无弹匣抽出/插入分段（P1 S6）。
- **修复**：换弹动画分阶段（下倾→抽匣→插匣→复位），音效按阶段触发（`audio.reloadPhase(phase)`）。

### M-4 换弹完成瞬间枪模跳动
- **位置**：weapon.js L371-377（`dip = Math.sin(t*π)*0.4`）
- **描述**：`reloadTimer` 归零瞬间 dip 从接近 0 突变到 0，无平滑过渡，枪模抖动。
- **修复**：换弹结束阶段用平滑曲线（如 `sin((t-0.8)/0.2*π)` 复位段）或 lerp 回位。

### M-5 USP/AK 枪模几乎相同（对应 PRD S5）
- **位置**：weapon.js L301-340（_buildViewModel 共用一套盒子，仅 AK 多一个弹匣）
- **描述**：两把武器第一人称视觉几乎无差别，仅弹匣显隐，缺乏武器辨识度；枪口火光位置/大小/颜色也共用。
- **修复**：按武器 id 参数化/独立构建枪模（USP 短管小手枪 vs AK 长管+木护木+弯弹匣），枪口火光 per-weapon（USP 小黄、AK 大橙红）。

### M-6 敌人开火无任何视觉反馈
- **位置**：enemy.js L375-388（_shootOnce 注释"枪口火光"未实现）
- **描述**：敌人射击只有音效（且经 hud.audio 间接调用），无 tracer、无枪口火光，打击感弱。
- **修复**：enemy 增加枪口火光/tracer 特效（P2 可选，或复用 weapon 的 tracer 池）。

### M-7 玩家不能跳上箱子（地图注释与实现不符）
- **位置**：map.js L184-185（注释"登记为可踩踏碰撞体"） / player.js L176-182（y≤0 即落地）
- **描述**：所有碰撞均为 XZ 平面 2D 解算，玩家 y 恒为 0，无法站上 1.2m 高的箱子；跳跃形同虚设（只能越障）。
- **修复**：若需箱上作战，需引入 Y 轴 AABB 碰撞 + 顶面站立检测（较大改动，建议 P2+；或先删除误导性注释）。

### M-8 半自动点射挂起缓冲，换弹/冷却中点击会在结束后自动开火
- **位置**：weapon.js L126-131 / L153-156
- **描述**：`triggerSemi()` 无条件设 `_semiPending=true`，若在冷却中/换弹中点按，会挂起到条件满足后自动打出（用户可能已移开准星，产生"幽灵子弹"）。
- **修复**：`triggerSemi()` 增加条件：`if (this.fireCooldown > 0 || this.reloadTimer > 0 || this._switching) return;`（或保留缓冲但限制 150ms）。

### M-9 空仓且备弹为 0 时无差异化提示
- **位置**：weapon.js L160-167 / startReload L94-101
- **描述**：`reserve<=0` 时 `startReload()` 静默 return，玩家不知道是"无备弹"而非"换弹失败"。
- **修复**：空仓分支检测 `reserve<=0` 时 toast 差异化文案"备弹耗尽！"。

### M-10 命中火花池/准星等无 3D 世界坐标→屏幕投影工具
- **位置**：hud.js 全局
- **描述**：新增伤害飘字（用户已确认）需要在世界命中点投影到屏幕坐标，当前 HUD 无此工具方法。
- **修复**：HUD 增加 `worldToScreen(point, camera)` 工具 + 飘字 DOM 池（见架构设计 F-飘字）。

### M-11 audio 高频创建 AudioNode 无节流
- **位置**：audio.js L40-71（每次 shot 创建 BufferSource+BiquadFilter+Gain ×2）
- **描述**：AK 10 发/s × 每发 2 组节点 = 20+ nodes/s；多敌人同时开火时叠加，长期运行 GC 压力累积。
- **修复**：shot 加最小间隔节流（如 30ms 内合并），或复用节点池（复杂度高，可先节流）。

### M-12 玩家受伤音效与死亡音效缺失细分
- **位置**：audio.js L106-110（hurt）
- **描述**：只有统一 hurt 音，无"低血量/死亡"区分；`player.takeDamage` 死亡时无额外反馈。
- **修复**：低血量（≤25%）hurt 音调变低；死亡时播放短促心搏音（P2）。

### M-13 `updateScore` 脏检查初始状态未定义
- **位置**：hud.js L60-69
- **描述**：`_lastEnemiesLeft` 等首次调用时为 undefined，与数字比较成立（undefined !== 数字）触发写入，功能正常但依赖隐式行为；`updateScore` 仅在主循环调用。
- **修复**：构造时初始化 `_lastEnemiesLeft = _lastKills = _lastWave = -1`。

### M-14 `hitMarker` 用 setTimeout 复位，AK 连发下闪烁异常（与 M-1 同源）
- **位置**：hud.js L79-84
- **描述**：连续命中时多次 setTimeout 竞争，标记可能提前消失或闪烁不均。
- **修复**：随 M-1 一并改为独立元素 + CSS 动画（animation restart 用 `void el.offsetWidth` 技巧）。

### M-15 地图射线检测每帧/每敌人遍历全部 boxes
- **位置**：map.js L209-216 / enemy.js L202-209
- **描述**：敌人视线检测已节流 0.12s；但每次仍线性遍历 ~30 boxes（含 6 敌人×8.3/s ≈ 1500 次 slab 求交/s），可接受但无空间加速（如按轴排序二分）。
- **修复**：P2 优化（按 X 轴排序 boxes 后对射线范围剪枝），当前无感知瓶颈。

### M-16 `Enemy` 通过 `hud.audio` 间接访问音频
- **位置**：enemy.js L387 / main.js L11
- **描述**：敌人音效依赖 HUD 上挂的 audio 引用（hud.js L31 `this.audio=null` 由 main 注入），Enemy 构造未接收 audio，链路脆弱（若 HUD 复用场景无 audio 则静默）。
- **修复**：Enemy 构造增加 audio 参数（或由 main 注入），消除隐式依赖。

---

## 3. 低严重度问题（11 项）

### L-1 触屏检测逻辑重复
- **位置**：weapon.js L66 / main.js L17、L102、L178
- **描述**：`('ontouchstart' in window) || navigator.maxTouchPoints > 0` 出现 4 次。
- **修复**：config.js 增加 `CONFIG.isTouch` 工具常量（或 window 工具函数）。

### L-2 `_fire()` 内每发创建大量临时 Vector3
- **位置**：weapon.js L179-206
- **描述**：每发 clone/addScaledVector/new 多个 Vector3，AK 10 发/s 小对象分配，GC 压力可忽略但可优化。
- **修复**：复用成员临时向量（低优先）。

### L-3 `_hitscan` 每发重建 targets 数组
- **位置**：weapon.js L229-236
- **描述**：每发 push 全部敌人 hitMeshes（最多 8×7=56 个引用）到新数组。
- **修复**：缓存 targets 数组，每次清空重填（低优先）。

### L-4 敌人死亡结算与玩家死亡同帧竞争
- **位置**：main.js L420-436
- **描述**：玩家死亡当帧若敌人也全清，会先 `_nextWave()` 刷出下一波再 `_endRun(false)`，结算界面出现但场上已有新敌人。
- **修复**：`_update` 中把玩家死亡判定提到波次判定之前。

### L-5 `_fireBurst` 是空函数，命名误导
- **位置**：enemy.js L371-373
- **描述**：`_fireBurst(dist)` 只设 `burstTimer=0` 不真正开火（实际开火在 update 的 burstLeft 循环）。
- **修复**：删除或重命名为 `_startBurst()`。

### L-6 玩家按住 Space 无限连跳（bunny hop）
- **位置**：player.js L146-149
- **描述**：落地瞬间若 Space 仍按住立即再跳，无"按住不连跳"检查。
- **修复**：记录 `spaceWasDown`，落地后需松开再按才跳（CS 风格）。

### L-7 血包满血时无提示
- **位置**：pickup.js L63-65
- **描述**：满血接触血包静默保留，玩家不知道"满血不消耗"。
- **修复**：满血时 toast"已满血"或不做（低优先）。

### L-8 弹孔/火花池满时静默丢弃
- **位置**：weapon.js L449-451 / L287-289
- **描述**：池空直接 return，无降级策略（H-8 已提扩容，火花池 30 个 × life 0.12s 够用）。
- **修复**：随 H-8 处理。

### L-9 `switchTo` 中 `fireCooldown=0.3` 与 config 无关联
- **位置**：weapon.js L88
- **描述**：切枪延迟硬编码 0.3s，与 PRD F5 切枪动画时长应一致，建议 config 化（`switchTime`）。
- **修复**：config.weapons 增加 `switchTime`，switchTo 与动画共用。

### L-10 HUD DOM 元素无空值保护
- **位置**：hud.js L8-29
- **描述**：所有 `getElementById` 假设存在，若 HTML 改动漏元素则 TypeError。
- **修复**：可加 `?` 保护或构造校验（低优先）。

### L-11 全局命名空间无前缀
- **位置**：全部文件
- **描述**：`Box`/`Player`/`Enemy`/`Game` 等类名全局无前缀，经典脚本约定下可接受，但多游戏共存有冲突风险。
- **修复**：不改（约定俗成），仅记录。

---

## 4. 一致性专项核对（config 单数据源）

| 项 | 位置 | 状态 |
| --- | --- | --- |
| 弹药备弹 36 vs config 60 | index.html L70 vs config.js L38 | ❌ 不一致（H-4） |
| 弹匣 12 vs config magSize 12 | index.html L70 vs config.js L38 | ✅ |
| 血量/护甲 100 | index.html L58/L63 vs config.js L23-24 | ✅ |
| fov 75 | main.js L25 vs config.js L6 | ✅ |
| shadowMapSize 1024 | map.js L149 vs config.js L9 | ✅ |
| armMult/gunMult/legMult 使用 | weapon.js L263-267 vs config.js L36/L48 | ✅（含 ?? 兜底） |
| 部位伤害倍率 | weapon.js `_damageForPart` vs config | ✅ |
| 敌人 fireRange 45 / hitChance 0.45 | enemy.js vs config.js | ✅ |
| 切枪延迟 0.3 硬编码 | weapon.js L88 | ⚠️ 未 config 化（L-9） |
| 恢复速率 0.06 硬编码 | player.js L194 | ⚠️ 未 config 化（H-6） |
| 小地图重绘节流 100ms | hud.js L142 | ✅（合理硬编码） |
| 脚本加载顺序 | index.html L130-141 | ✅ 与各文件注释一致 |

---

## 5. 性能清单（重点结论）

| 项 | 现状 | 结论 |
| --- | --- | --- |
| 渲染像素比 | 触屏 ≤1.5 / 桌面 ≤2（main.js L17-18） | ✅ 良好 |
| 阴影 | 1024 + PCFSoft | ✅ 可接受 |
| 对象池 | tracer / impact / hitSpark / raycaster 复用 | ✅ 良好（除 H-8 池容量） |
| 脏检查 | updateScore / setCrosshairSpread / minimap 节流 | ✅ 良好 |
| 敌人视线射线 | 0.12s 节流 | ✅ 良好 |
| AudioNode 高频创建 | 无节流（M-11） | ⚠️ 建议节流 |
| 每发临时对象 | 多 Vector3（L-2/L-3） | ⚠️ 可优化，非瓶颈 |

---

## 6. 与 PRD 需求对应关系

| PRD 条目 | 对应问题 | 状态 |
| --- | --- | --- |
| D1 换弹音效未接入 | H-1 | 待修 |
| D2 空仓反馈弱 | H-2 | 待修 |
| D3 crosshairFire 空实现 | H-3 | 待修 |
| D4 初始备弹不一致 | H-4 | 待修 |
| D5 低弹量无预警 | H-5 | 待修 |
| F1-F3 命中/爆头/击杀标记 | M-1、M-2 | 待新增 |
| F4 部位/击杀音效区分 | H-7、M-1 | 待重构 |
| F5-F6 切枪动画+音效 | L-9（需新增状态机） | 待新增 |
| F7-F8 距离衰减 | 无现成 | 待新增（架构设计） |
| F9-F10 穿墙 | —— | 用户已拍板**不做**，保持墙全挡 |
| S1 连发散布 | H-3（准星未联动） | 待新增 |
| S2 后坐力差异化 | H-6 | 待新增 |
| S3 数值校准 | 已满足（30×4=120 / 24×4=96） | ✅ 确认 |
| S4 音效增强 | H-1/H-2/M-3 | 待新增 |
| S5 枪模视觉升级 | M-5 | 待新增 |
| S6 换弹动作分段 | M-3、M-4 | 待新增 |
| N4 伤害飘字 | M-10 | 用户已确认加入（升级 P0） |

---

*检查完毕。完整架构设计见 `deliverables/architecture-weapon-system.md`。*
