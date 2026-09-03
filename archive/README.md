# 项目历史归档

本目录保存不属于当前最新游戏版本、但为可追溯性保留的旧候选、阶段交付物、原始素材、一次性工具和临时验证文件。归档内容不参与当前 `index.html`、测试默认路径或 `tools/package.ps1` 的最新版本构建。

当前版本与归档边界见：[docs/当前版本分析与归档索引.md](../docs/当前版本分析与归档索引.md)。

## 目录

- `releases/`：旧正式基线、平衡性能候选、敌人技术预览和港口地图之前的混合骨骼审核候选 ZIP。
- `deliverables/`：历史根目录 PRD、增量 PRD、架构、纹理、验收和软件团队阶段交付物；根目录旧 PRD 归档为 `deliverables/history-20260825/PRD-历史-20260825.md`。
- `design-references/`：不再驱动当前版本的武器参考资料。
- `marketing/`：旧 CS15/指尖CS 文案、Logo、封面和截图。
- `assets/uploads/uploads/`：原始上传图片（保留原 `uploads/` 目录名）。
- `assets/textures/`：当前运行时不直接加载的历史贴图源；根目录 `textures.js` 才是运行时资源，仅在明确重建时使用归档源。
- `tooling/legacy/`：旧模型/图片分析、重建、缩放、安装脚本及 Python 生成缓存。
- `tooling/skill-copy/.skill/`：旧 `.skill/` 规范副本；当前规范入口是 `.codex/`。
- `tooling/plugins/plugins/`：非运行时内容创作与软件交付插件（保留原 `plugins/` 目录名）。
- `verification/playwright-cli/.playwright-cli/`：自动化浏览器过程日志和快照（保留原 `.playwright-cli/` 目录名）。

归档只做项目内移动，不删除历史文件；原始文件名和内容保留，需恢复时可按索引移回。
