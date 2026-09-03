# 🔫指尖CS｜Logo 设计提示词（基于 poster-design skill 框架适配）

> **Skill 路由**：`poster-design`（全局最贴合的视觉设计 skill）
> **适配说明**：poster-design 的 12 子类型不含 logo，但其铁律（比例显式 / hex 严执 / 文案唯一 / 极简留白构图）是平面设计通用公约数，已按 logo 场景裁剪。构图模式取 **模式 3 极简留白式**（大片单色背景 + 主体居中 + 文字精致排版 = logo 最佳范式）。

---

## 一、设计概念（Concept）

| 元素 | 设计 | 隐喻 |
|---|---|---|
| **准星四角标** | 4 段细直线，90° 间距，经典枪 sight reticle | CS / FPS 品类一眼识别 |
| **指尖** | 准星正中心一个食指指尖正面剪影（含指甲盖），替代传统准星红点 | 「指尖」= 浏览器零安装、点开即玩、手机也能操作 |
| **组合语义** | 指尖落在准星中心 = 「指尖瞄准」 | 双关：技术零门槛 + 玩法瞄准 |
| **字标** | 「指尖CS」：「指尖」象牙白 + 「CS」琥珀橙，字形稍大 | 品牌名 + 品类色记忆点 |

---

## 二、品牌色（hex 严执 — 项目 Darkroom Cinema 色谱）

| 角色 | hex | 说明 | 用途 |
|---|---|---|---|
| **background** | `#060508` | 近黑根背景（dominant ~70%） | logo 主背景 |
| **secondary bg** | `#0D0D12` | 蓝调暗灰 | 备用背景 / UI 面板 |
| **primary accent** | `#D97035` | 琥珀橙（~20%） | 「CS」字色、指尖暖光晕 |
| **secondary accent** | `#3D8996` | 暗房青（~10%） | 准星四角标 |
| **text** | `#E9E5D6` | 羊皮纸白（<5%） | 「指尖」字色、指尖本体 |

---

## 三、主推 Prompt（Mark + Wordmark，1:1 方版）

```
Logo design for a browser-based CS-style FPS mini-tool named "指尖CS"
(ZhiJian CS = Fingertip CS).

MARK (icon, centered, Heavy visual weight):
A minimalist gun sight reticle composed of four thin teal #3D8996 tick marks
placed at 90-degree intervals (top / bottom / left / right), forming a
classic sniper crosshair. At the exact center where the reticle's red dot
would normally sit, place a single human index fingertip viewed from the
front — clean silhouette in parchment white #E9E5D6, with a subtle
fingernail suggestion. The fingertip replaces the traditional crosshair dot,
creating the concept "aim with your fingertip".
Optional: a faint amber #D97035 glow ring softly haloing the reticle,
low opacity so it never overpowers the mark.

WORDMARK (below the mark, Medium visual weight):
The Chinese brand name "指尖CS" rendered in a bold, condensed, geometric
modern sans-serif typeface, tech-gaming aesthetic, clean sharp edges.
"指尖" (the two Chinese characters) in parchment white #E9E5D6,
"CS" (the two Latin letters) in amber orange #D97035 and slightly larger
— the letters are the hero and carry the accent color.
The wordmark sits directly beneath the mark, centered, with generous
breathing space between mark and text.

BACKGROUND:
Solid near-black #060508, unified single tone, pure negative space.
No gradient, no texture, no pattern, no noise, no color band.

COMPOSITION (Editorial Minimal mode):
Mark occupies the upper-center portion, wordmark centered below it.
Vast single-tone background with generous breathing space on all sides.
Unified visual field — no separate text zone, no geometric division,
no horizontal/vertical color split, no color block.
The logo must remain clean and recognizable when scaled down to
32×32 px (favicon / app icon scale) — every element must stay legible.

STYLE LOCK:
Flat vector logo design, clean lines, sharp edges, minimal precision.
Modern gaming brand identity, tech-minimal aesthetic.
NO 3D rendering, NO gradients, NO bevels, NO drop shadows,
NO photo-realism, NO busy ornament. Pure 2D mark.

TEXT RENDERING DISCIPLINE:
- the brand name "指尖CS" appears exactly once in the composition
- no duplicated copy, no repeated phrases, no echoed text
- Chinese characters only — no English translation overlay
- no auto-translated subtitles, no secondary label

NEGATIVE:
no 3D, no gradients, no shadows, no bevels, no photo-realism
no busy background, no texture, no pattern, no noise
no duplicated text, no watermark, no signature
no blurry elements, all edges sharp and vector-clean
no color blocks, no horizontal split, no PPT-style layout
```

---

## 四、备选 Prompt（Mark-Only 方版，1:1）

> 用于 favicon / 社交头像 / 账号头像。只出 mark，不带字标。

```
Minimalist logo mark for "指尖CS" (Fingertip CS), a browser FPS mini-tool.
Center: a single human index fingertip viewed from the front, clean
silhouette in parchment white #E9E5D6 with subtle fingernail detail,
replacing the center dot of a gun sight reticle.
Surrounding: four thin teal #3D8996 tick marks at 90-degree intervals
forming a sniper crosshair, the fingertip sitting exactly at the intersection.
Faint low-opacity amber #D97035 glow halo softly around the reticle.
Background: solid near-black #060508, unified single tone, pure negative
space, no gradient, no texture, no pattern.
Composition: mark centered, vast breathing space, editorial minimal,
unified visual field, no separate zones.
Style: flat vector 2D logo, clean sharp edges, modern gaming tech aesthetic,
no 3D, no gradients, no shadows, no photo-realism.
Must stay recognizable at 32×32 px scale.
Text discipline: no text in this variant (mark-only).
Negative: no 3D, no gradients, no shadows, no busy background,
no texture, no watermark, no blurry edges.
```

---

## 五、浅色版 Prompt（Light Variant）

> 用于白色 / 浅色背景（邮件签名、浅色 UI、印刷物料）。配色反转。

```
Logo mark + wordmark for "指尖CS" on a clean white #FFFFFF background.
The gun sight reticle in teal #3D8996 with a parchment-beige #E9E5D6
fingertip at center, faint amber #D97035 glow halo.
Wordmark "指尖CS" below: "指尖" in near-black #060508, "CS" in amber
#D97035, bold condensed geometric sans-serif.
Background: solid white #FFFFFF, unified single tone, no gradient,
no texture, no pattern.
Composition: editorial minimal, mark upper-center, wordmark centered
below, generous breathing space, unified field, no color blocks.
Style: flat vector 2D, sharp edges, no 3D, no gradients, no shadows.
Text: "指尖CS" appears exactly once, Chinese only, no English overlay.
Negative: no 3D, no gradients, no shadows, no busy background,
no texture, no watermark, no duplicated text.
```

---

## 六、模型路由建议

| 优先级 | 模型 | 理由 |
|---|---|---|
| **A（推荐）** | **qwen** | 中文 3 字 + 2 字母短文本稳定渲染（≤15 字），扁平矢量 logo 风格 qwen 几何感强 |
| B | **gpt-image-2 (openai)** | 中文 ≤20 字可用，扁平设计质量高，但 logo 极简风偶尔偏"插画化" |
| C | **midjourney** | 强于氛围/质感，扁平 logo 非其长项，仅作底图 + 后期合成兜底 |

> 按 skill `model-routing.md` 默认策略 A：短中文直接渲染，不走"底图+后期"。

---

## 七、出图后自检（skill quality-scoring 5 模块精简版）

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | **眯眼测试** | 缩到拇指大小仍能一眼看出"准星 + 指尖"的 mark，不是一团糊 |
| 2 | **32px 测试** | 缩到 32×32 px，四角标与指尖轮廓仍可辨（ favicon 可用性） |
| 3 | **色值核对** | 准星 = `#3D8996` 青、指尖/「指尖」= `#E9E5D6` 白、「CS」/光晕 = `#D97035` 橙、背景 = `#060508` 近黑，无偏色 |
| 4 | **文案唯一性** | 「指尖CS」全图只出现 1 次，无英译叠加、无重复 |
| 5 | **无几何分割** | 背景是统一单色，无上下/左右色块拼贴 |
| 6 | **无 3D/渐变** | 全扁平 2D，无 bevel / shadow / photo-real 元素 |
| 7 | **无乱码** | 中文「指尖」两字渲染正确，无方块/缺笔画 |

任一项不过 → 按 skill Iron Law #7 降氛围权重重出，或切模型 B/C。

---

## 八、交付物清单（待办）

| 项 | 状态 | 说明 |
|---|---|---|
| logo 提示词 | ✅ 本文档 | 主推 / Mark-Only / 浅色版 3 套 |
| logo 出图 | ⬜ 待用户确认模型后生成 | 按第六节路由走 qwen 或 gpt-image-2 |
| 浅色版适配 | ⬜ 同上 | 用于白色背景场景 |
| 应用延展 | ⬜ 待定 | 社交头像 / 笔记封面角标 / 离线包内 icon |

---
*以上提示词基于 poster-design skill 框架（iron-laws / composition-modes / defaults）适配 logo 场景生成，品牌色严格绑定项目 Darkroom Cinema 色谱。未确认项已标注，未擅自补全。*