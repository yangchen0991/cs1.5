# 武器纹理升级方案：让枪模"去方块化"

> **历史方案说明（2026-08-22）**：本文是待确认的纹理增强提案，不代表当前已批准范围或当前代码状态。当前 Glock 使用程序化模型，AK/AWP 使用内嵌 OBJ 与离线 PBR 资源；文中的待确认分辨率、文件数和新增 `weapon_tex.js` 方案均不应作为当前发布事实。

> 2026-08-22 · 基于小红书容器能力文档 §5「本地资源 / Canvas / 内存对象作为纹理 ✅」+ 项目代码现状 + 联网核实（Three.js r160 MeshPhysicalMaterial PBR 通道 / CanvasTexture 官方用法）
> 状态：**待用户确认**（分板块推进，每板块确认后执行）

---

## 〇、问题诊断（为什么现在是"方块感"）

当前三把枪的材质现状（weapon.js `_buildViewModel` L460-512）：

| 枪 | 材质 | 贴图 | 法线 | roughness/metalness/ao 通道 | 问题 |
|---|---|---|---|---|---|
| USP/Glock | MeshPhysicalMaterial 纯色 | ❌ 无 | ❌ | ❌ 全局单一值 | **纯色大平面**，PMREM 均匀照亮 → 塑料块 |
| AK-47 | MeshPhysicalMaterial | ✅ 程序化 diffuse 256px | ❌ | ❌ 全局单一值 | diffuse 是"贴画"，表面无凹凸 → 仍显平 |
| AWP | MeshPhysicalMaterial 纯色 4 色 | ❌ 无 | ❌ | ❌ 全局单一值 | 同上，黑聚合物大平面最显块 |
| 木件（AK/AWP 枪托护木） | MeshStandardMaterial | ✅ 256px | ❌ | ❌ | 波浪纹 3 条太卡通，无木纹法线 |

**根因（4 条）**：
1. **缺表面信息**：Glock/AWP 无任何贴图；三把枪全无 normalMap → 光线打在完全光滑的数学平面上
2. **缺分区通道**：无 roughnessMap/metalnessMap/aoMap → 枪管（高光）与聚合物（哑光）质感拉不开
3. **UV 未设计**：BoxGeometry 每面 UV=0..1，贴图被整面拉伸；ExtrudeGeometry 侧面 UV 拉伸 → 即使贴图也错位
4. **缺 uv2**：aoMap 必须第二套 UV（`geometry.setAttribute('uv2', uv)`），当前所有武器几何体没有

---

## 一、方案总览（6 板块，按依赖顺序）

```
A 武器纹理库(Canvas 程序化) ──► B PBR 通道接线(核心收益最大)
        │                            │
        ▼                            ▼
C UV 修正与材质分组 ◄──────── D forge GPU 法线(可选锦上添花)
        │
        ▼
E 细节与标识(点睛层) ──► F 联调验证+打包
```

| 板块 | 名称 | 内容 | 依赖 | 收益 |
|---|---|---|---|---|
| A | 武器纹理库 | Canvas 程序化生成 3 套纹理集（发蓝钢/聚合物/防滑握把）+ 木纹升级 | 无 | 中（素材基础） |
| B | PBR 通道接线 | 三把枪全部接 normalMap/roughnessMap/metalnessMap/aoMap + uv2 + anisotropy | A | **高（去方块核心）** |
| C | UV 修正与材质分组 | 大平面 repeat 平铺、材质按真实分区分组 | A、B | 高（贴图不拉伸） |
| D | forge GPU 法线 | TextureForge 新增武器表面定义（GUNMETAL/POLYMER/GRIP） | B | 中（与地图同体系） |
| E | 细节与标识 | 枪名铭文、序列号、边缘磨损、弹匣刻度纹理 | B、C | 中（点睛） |
| F | 联调验证打包 | 浏览器实测 + node --check + 合规 + 重打包 + md5 | 全部 | — |

---

## 二、板块 A：武器纹理库（新增 weapon_tex.js）

> 容器能力文档 §2.5：`<canvas>` + `CanvasTexture` 是"内存对象纹理"，完全合规；§5 明确"本地资源 / Canvas / 内存对象作为纹理 ✅"

新增 `weapon_tex.js`（经典脚本，`window.WeaponTex`），512×512 Canvas 程序化生成 6 张基础贴图，每张产出 { diffuse, height } 双通道（height 后续转 normal）：

### A1 `bluedSteel` 发蓝钢（枪管 / 滑套 / 拉丝件）
- diffuse：深蓝黑基底（#1a1d24）+ **水平拉丝细线**（2px 半透明亮线，间距 3px，模拟枪管车削纹）+ 轻微金属颗粒 + 顶部渐变高光带 + 底部暗带
- height：拉丝线微凸（+0.08）+ 颗粒（±0.03）+ 磨痕（随机细线）
- 用途：AWP 枪管/制退器、USP 滑套、AK 枪管

### A2 `polymer` 聚合物（机匣 / 枪托 / 护木 / 握把主体）
- diffuse：基色由材质 color 决定（黑 #2b2b2b / 橄榄绿 #4a5d3f），画 **细颗粒**（800 点 ±0.04）+ 指纹油光斑（2-3 处椭圆渐变，粗糙度拉高）+ 边缘磨损（轮廓内缩 4px 提亮带）
- height：颗粒 ±0.04 + 边缘磨损微凸
- 用途：AWP 机匣/拇指孔枪托、Glock 滑套/框架、AK 机匣

### A3 `gripPattern` 防滑握把（握把 / 护木防滑区）
- diffuse：基色 + **菱形防滑纹**（双斜线 45° 交叉，间距 8px）+ 颗粒
- height：菱形纹凸 0.12（与已写的 `applyDiamondTexture` GLSL 注入版二选一，见板块 D 决策）
- 用途：AWP 握把（蓝图明确要求 subtle diamond pattern）、USP 握把、AK 握把

### A4 `wood` 木纹升级（AK/AWP 木件，替换 `_makeWoodTexture`）
- 从 256px → 512px；粗波浪纹 3 条 → **程序化年轮**（同心椭圆生长）+ 细木纹 + 结疤（2 个暗点）+ 高光/阴影带保留
- height：年轮凸 0.06 + 细纹 ±0.02 → 木纹在光照下立体

### A5 `edgeWear` 磨损遮罩（叠加层，可选）
- 黑白遮罩：边缘 1-2px 白（磨损高光）+ 随机擦痕
- 用途：B 板块用 `aoMap`/diffuse 调制

### A6 `heightToNormal` 转换器
- CPU 有限差分（联网核实：Three.js 官方 NormalMapShader 即 Sobel/Scharr 高度图→法线；512px 全 CPU 计算 <10ms，无需 GPU）
- 输出 `THREE.CanvasTexture`，`normal.wrapS/T = RepeatWrapping`，`colorSpace` 视通道设置（normal 用 NoColorSpace）

**分辨率决策点**：512（推荐，移动端显存稳、加载快）vs 1024（细节多但 3 枪 × 6 贴图 × 4 通道 ≈ 显存翻倍）→ **待用户确认**

---

## 三、板块 B：PBR 通道接线（去方块核心）

### B1 几何体补 uv2（前置，必做）
所有武器几何体（Box/Extrude/Cylinder/Torus/Sphere/Tube/Circle）统一补：
```js
geo.setAttribute('uv2', geo.attributes.uv);  // aoMap 必需
```
在 `_buildGlock/_buildAK/_buildAwp` 每个 `new THREE.Mesh(geo, mat)` 处包装，或写 `_readyPBR(geo)` 工具函数批量处理（**只加 uv2，不动原 uv**——零风险，几何体改动 1 行/个）。

### B2 材质通道接线（weapon.js `_buildViewModel` 重构）
每把枪的材质从"单 map"升级为完整 PBR 通道组：
```js
// 示例：AWP 枪管材质（发蓝钢）
const steel = new THREE.MeshPhysicalMaterial({
  map: tex.bluedSteel.diffuse,
  normalMap: tex.bluedSteel.normal,
  normalScale: new THREE.Vector2(0.6, 0.6),      // 拉丝纹弱化，避免过强
  roughnessMap: tex.bluedSteel.roughness,          // 拉丝区低粗糙
  metalnessMap: tex.bluedSteel.metalness,          // 全金属
  aoMap: tex.bluedSteel.ao, aoMapIntensity: 0.8,   // 边缘 AO
  roughness: 0.28, metalness: 0.95,                // 基础值（被 map 调制）
  anisotropy: 0.8, anisotropyMap: tex.bluedSteel.aniso,  // r160 拉丝金属方向
});
```
通道矩阵（3 枪 × 材质分组）：

| 材质组 | 枪件 | diffuse | normal | rough | metal | ao | anisotropy |
|---|---|---|---|---|---|---|---|
| bluedSteel | 枪管/滑套/制退器 | ✅ | ✅ 0.5-0.7 | ✅ | ✅ | ✅ | ✅ 0.6-0.9 |
| polymer | 机匣/枪托/框架 | ✅ | ✅ 0.4-0.6 | ✅ | ✅(低) | ✅ | ❌ |
| gripPattern | 握把/防滑区 | ✅ | ✅ 0.8-1.0 | ✅ | ✅ | ✅ | ❌ |
| wood | 木件 | ✅ | ✅ 0.3-0.5 | ✅ | ✅(0) | ✅ | ❌ |
| detail(细节件) | 准星/扳机/弹匣 | ✅ | 可选 | ✅ | ✅ | ✅ | ❌ |

### B3 关键注意点
- **normalScale 强度克制**（0.4-0.7）：本项目是卡通+冷峻军事风格，法线过强会脏（参考 forge.js NYQUIST 纪律的"近看砂纸"教训）
- **metalnessMap 需分区**：聚合物件 metalness≈0.2-0.4、金属件≈0.9-1.0，否则 IBL 反射全糊
- **aoMap 与 uv2 强绑定**：B1 不做，B2 的 ao 静默失效（不报错但无效果）——顺序不能反
- 现有 `_texMats` 懒加载替换逻辑保留（`map` 替换时同步换 normalMap/roughnessMap 等，见 L504-508）

---

## 四、板块 C：UV 修正与材质分组

### C1 大平面平铺（机匣侧面 / 枪托面）
- 对重复纹理材质（polymer/bluedSteel）设 `texture.repeat`：机匣侧面 ×(2,1)、枪托 ×(1.5,1.5) 等，**每件独立 clone**（教训：map.js 的 RT 共享 repeat 冲突——forge.js L142 已踩过，base+clone 模式复用）
- 需逐件评估：BoxGeometry 6 面独立 UV，侧面 repeat 后顶面会同步放大 → 对可见大面单独拆材质或接受整体放大（小件影响小）

### C2 ExtrudeGeometry 侧面 UV 拉伸
- ExtrudeGeometry UV = 轮廓平面投影，侧面（z 方向）拉伸。影响件：AK 枪托/握把/护木、AWP 枪托、USP 握把
- 处理方案（二选一，**待用户确认**）：
  - 方案①（推荐，零几何风险）：小件（握把/护木）接受拉伸——纹理颗粒均匀，肉眼难辨
  - 方案②：自定义 `uvGenerator` 重映射侧面 UV（ExtrudeGeometry 构造参数支持），让侧面沿长边平铺——改动大、需逐件调

### C3 材质分组清单（每把枪的最终材质表）
在板块 B2 矩阵基础上，明确每把枪各零件归属的材质组，实施时按表接线、验收时按表核对。

---

## 五、板块 D：forge GPU 法线（可选，与 A 二选一或并存）

> 容器能力文档 §5：WebGL 纯渲染可用、内存对象纹理可用 → forge 4-pass 管线完全合规（已在 map.js 验证）

- TextureForge 新增表面定义：`GUNMETAL_FRAG`（发蓝钢颗粒+拉丝）、`POLYMER_FRAG`（聚合物颗粒+刻线+油光）、`GRIP_FRAG`（菱形防滑纹，可直接用 `applyDiamondTexture` 的 GLSL 思想）
- 产出 512px normal（+ORM），与地图砖/混凝土同一质量体系
- **决策点**：A 板块 CPU Canvas 已能出法线且 <10ms；D 板块 GPU 的优势是 ORM 打包 + 与地图一致性。建议：**CPU 起步（板块 A），D 作为板块 A 之后的增强项**——待用户确认是否需要

---

## 六、板块 E：细节与标识（点睛层）

- **铭文**：Canvas `fillText` 画 "USP" / "AK-47" / "AWP" 枪名 + 序列号数字，贴在机匣/滑套可见面（材质分组里单独一层 map 叠加或画进 diffuse）
- **警示刻线**：机匣侧面的细横线组（3-5 条 1px）
- **边缘磨损**：`edgeWear` 遮罩混入 diffuse 高光 + aoMap 加深边缘
- **弹匣刻度**：画进弹匣 diffuse（小圆孔/刻度线）
- 注意：字体用系统 sans-serif（不能打包字体文件就避免特殊字体；`.woff` 虽允许但增加包体）

---

## 七、板块 F：联调验证 + 打包

1. **浏览器实测**（no-cache 服务器 809x 新端口）：
   - 每把枪截图对比（前后）：大平面是否有凹凸、拉丝方向是否正确、AO 边缘是否加深
   - 法线方向验证：固定光源下旋转枪模，凹凸随光变化（反了就 `normalScale` 取负）
   - 性能：帧率对比（512px 通道组预计 +0.5-1ms/帧，可接受）
2. **合规**：全量 `node --check`；grep 确认无内联/eval/fetch/外链（新增 weapon_tex.js 无违规面）
3. **打包**：旧 zip 备份 → 14→15 文件（+weapon_tex.js）→ zipfile 打包 → md5 硬校验 → 引用完整性
4. **验收标准**：三把枪在 809x 服务器 + 截图证据下，去掉"纯色大平面"观感；UV 无错位；性能不掉帧

---

## 八、待用户确认的决策点（5 个）

| # | 决策点 | 选项 | 建议 |
|---|---|---|---|
| 1 | 实施范围 | ① 三把枪全做 ② 先 AWP 验证后再推 ③ 先一把试水 | ②（AWP 你最关注，先验证方案） |
| 2 | 纹理分辨率 | ① 512（移动端稳） ② 1024 | ① |
| 3 | 法线生成路径 | ① CPU Canvas（简单 <10ms） ② forge GPU（与地图一致） ③ CPU 起步、GPU 后补 | ③ |
| 4 | ExtrudeGeometry 侧面 | ① 接受拉伸（零风险） ② uvGenerator 重映射 | ① |
| 5 | 风格取向 | ① 保持卡通色块 + 加物理质感（推荐：不破坏现有皮克斯/冷峻军事配色） ② 全面写实化（动配色） | ① |

确认后按板块 A→B→C→E→F 顺序推进（D 按决策点 3 决定），每板块完成实测确认再进下一板块。
