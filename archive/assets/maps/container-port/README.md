# 港口集装箱仓库地图源资产

这些文件是用户提供的地图源资产与前期参考图的归档说明。原始大文件仍保留在用户指定的外部目录；历史重建产物保存在本归档目录。当前根目录发布包使用从这些源资产清理得到的独立视觉模型和本地 PBR data URL，视觉模型不携带碰撞代理；本目录中的旧运行时脚本仍不参与入口加载。

## 原始建模资产

源目录：`J:\武器\map\50`

| 文件 | 用途 | SHA-256 |
| --- | --- | --- |
| `c44524a6b39b3eb8a90107bfee9a1fda.obj` | 集装箱仓库合并几何，约 100 MB | `22DB6CB8AF20290FF5E55EA45ACEB7794A08D88324C4D41ED659F01D5D2126CE` |
| `material.mtl` | OBJ 材质映射：baseColor、metallic、roughness、normal | `9850AE5248D6DBF106DAF4D0BA88A74ECFAB339015525940460521A52D6C17F9` |
| `texture_pbr_20250901.png` | 4096 级颜色图集 | `138CB940813DC4B42696617A7FBCA026342BA23B83D1F6BC552D4ADAB8EC6B60` |
| `texture_pbr_20250901_metallic.png` | 4096 级金属度图 | `09D278AB1558C3DD102A29FBBBA0448387F2ACBAD2F84532F425917EFC209AC1` |
| `texture_pbr_20250901_normal.png` | 4096 级切线空间法线图 | `CCD6B8765D4ED3C59396D126620B2633F2BD56A5F92956CA636A46A9C0E56C9D` |
| `texture_pbr_20250901_roughness.png` | 4096 级粗糙度图 | `49F5959B55E98FB8737CFD0E77197DC6DE340EAD4044CBCF3161EFAC542D873E` |

用户同时提供了两张港口/仓库俯视参考图，作为空间排布、集装箱颜色、黄线、混凝土掩体和仓库边界的视觉参考；参考图不作为运行时纹理加载。

## 已归档的旧运行时产物

- `legacy-runtime/map_model.js`：由 OBJ 离线转换、焊接和 4% 简化得到的静态几何数据，约 58,784 顶点、59,874 三角形，位置/法线/UV/Uint16 索引以内嵌 base64 保存。
- `legacy-runtime/map_assets.js`：由四张源 PBR 图缩放到 1024 级后生成的本地 data URL；颜色图使用 WebP，法线使用 PNG，金属度/粗糙度使用 WebP。
- 这两份文件曾被入口作为港口视觉模型和自动碰撞代理使用。实机反馈显示合并代理产生了不可见空气墙，同时导入模型留下浅灰/白色几何；2026-08-27 起这些历史副本不再由 `index.html` 加载，也不进入当前候选 ZIP。当前根目录的 `map_model.js` 是只用于视觉的清理副本，`map_assets.js` 是本地 PBR 资源，二者不包含旧自动碰撞代理。

当前运行时由根目录 `map_model.js` / `map_assets.js` 提供港口视觉和 PBR，`map.js` 只维护可审计的碰撞与射线布局：10 个高位集装箱体块、4 个外围边界盒、混凝土地面、黄线和暗色外围边界。模型视觉与 14 个 AABB 碰撞分离，低矮浅灰体块和 509 个旧模型代理均已退出当前运行时；地面与边界复用公共环境混凝土材质配置，环境层不引用武器色彩。若模型解码失败，程序化布局只作为安全兜底。

## 可重复构建

如需复现旧版导入模型的历史问题，可在项目根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/prepare-map-assets.ps1
```

该流程仅用于历史问题复现和资产追溯，不是当前发布前置。`tools/prepare-map-assets.ps1` 未传 `-OutputDir` 时会直接把生成结果写入 `archive/assets/maps/container-port/legacy-runtime/`；只有显式传入输出目录时才会写入其他位置。不要把生成结果重新接入 `index.html`。小红书 ZIP 中不包含 OBJ、MTL、GLB、Python 或转换器。

当前构建脚本固定 `obj2gltf@3.2.0` 和 `@gltf-transform/cli@4.4.2`，以减少重新构建时的版本漂移；首次执行仍需要开发机具备对应 npm 缓存或网络，发布包本身不依赖网络。
