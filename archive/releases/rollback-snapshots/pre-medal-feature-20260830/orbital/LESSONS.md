<!--format LESSONS entries: numbered durable heuristics and playbooks. Add on error recovery or non-obvious workaround; keep real playbooks intact.-->

# 经验教训

1. 射击求交必须使用当前帧的真实网格 <!--mem id:entry created:2026-08-15 touched:2026-08-15-->
   在 update 阶段开火时，渲染尚未刷新 `matrixWorld`。命中前先对目标调用 `updateMatrixWorld(true)`，再用 `THREE.Raycaster` 对实际命中 Mesh 求交；clone 后显式重设 `userData.part` 和实例引用，不依赖隐式复制。

2. 圆心进入 AABB 时不能按普通最近点推离 <!--mem id:aabb created:2026-08-17 touched:2026-08-17-->
   最近点等于圆心会产生零向量，实体会永久卡墙。必须计算到四个盒面外侧（含半径）的距离，沿最浅穿透轴整段推出；出生点合法性也要使用同一套正确解算。

3. 离线真实资源优先使用包内图片并保留兜底 <!--mem id:base64 created:2026-08-15 touched:2026-08-15-->
   ZIP 根目录的相对 WebP/JPG 同样能保持零联网依赖，并可避免大型 base64 增加脚本解析和 JS 堆驻留；颜色贴图设置 `SRGBColorSpace`，法线和打包 MR 保持线性色彩。加载完成前使用纯色或程序化纹理，避免黑帧和解码失败。

4. Web 横屏要靠布局适配，不能依赖强制锁屏 <!--mem id:web created:2026-08-15 touched:2026-08-15-->
   iOS Safari 和部分 WebView 不能可靠强制横屏。使用 CSS 媒体查询显示旋转提示；监听 `visualViewport` 时要防抖，并在尺寸未变化时跳过 renderer 缓冲重建。

5. CSS 旋转后的屏幕坐标必须转换到内容坐标 <!--mem id:entry-3 created:2026-08-17 touched:2026-08-17-->
   `#gameRoot rotate(90deg)` 后，Pointer Event 的 `clientX/Y` 仍是屏幕坐标。拖拽位置和浮动摇杆方向必须通过逆变换换算；控件尺寸和偏移使用统一缩放变量并保留 safe-area。

6. HUD 可交互元素必须显式打开 pointer events <!--mem id:hud-pointer-events-auto-body created:2026-08-17 touched:2026-08-17-->
   `#hud` 默认 `pointer-events:none`，按钮需要单独设置 `pointer-events:auto`。全屏设置、暂停和结果面板应放在 body 同级，避免穿透和层叠上下文限制；子按钮还要阻止向全屏点击层冒泡。

7. 小工具容器不要依赖 Pointer Lock <!--mem id:cs15 created:2026-08-17 touched:2026-08-17-->
   Pointer Lock 不属于小红书小工具已保证的设备能力，也会让自动化点击重定向到画布。桌面瞄准改用 Pointer Events、拖动和 pointer capture，触屏继续使用同一事件体系。

8. 金属材质需要环境反射 <!--mem id:scene-environment-pmrem created:2026-08-18 touched:2026-08-18-->
   `MeshStandardMaterial` 的金属在没有 `scene.environment` 时会像灰塑料。用轻量场景生成 PMREM 作为 IBL；关键武器部件可配合 `MeshPhysicalMaterial` 和 clearcoat。

9. 高频反馈要复用对象 <!--mem id:dom-worldtoscreen created:2026-08-18 touched:2026-08-18-->
   伤害飘字、弹壳和位置音频都应池化，避免连续射击时频繁分配。重复 CSS 动画需要先移除 class、读取 `offsetWidth` 强制 reflow，再重新添加 class。

10. 满资源时不要消耗补给 <!--mem id:entry-4 created:2026-08-18 touched:2026-08-18-->
    满血、满弹或满盾时保持拾取物 active；动态敌人掉落在新局 reset 时统一清理，避免资源被无意义浪费或跨局累积。

11. AK 与 AWP 模型接口和坐标方向不能凭旧文档调用 <!--mem id:weapon-model-split created:2026-08-22 touched:2026-08-23-->
    当前接口是 `build(geometry, material)`，实际调用为 `build(null, material)`。AK 枪口原始方向为 -X，AWP 为 +X，两者旋转映射相反；修改前以源码为准。

12. Windows 下写含中文的 JavaScript 必须显式 UTF-8 <!--mem id:ps-gbk-utf8 created:2026-08-22 touched:2026-08-23-->
    默认 PowerShell 编码曾把中文变成 U+FFFD 并破坏语法。大文件重建优先用 Node.js UTF-8 脚本；不要用默认编码的 `Out-File` 或 `Set-Content`。

13. 发布前必须核验 ZIP，不信任打包脚本的文件数注释 <!--mem id:safe-delete-zip created:2026-08-23 touched:2026-08-23-->
    打包后检查根目录条目、HTML 引用完整性、一方脚本语法，并逐字节比较 ZIP 与工作区。当前 `tools/package.ps1` 已漏掉模型文件，修复前不能用于覆盖正式发布包。

14. 开工前确认真实项目根目录 <!--mem id:j-cs1-5-j-ip-red-red-app-cs1-5 created:2026-08-17 touched:2026-08-17-->
    真实项目是 `J:\个人IP打造\red\red-app\cs1.5`，以 `AGENTS.md` 和 `orbital/` 同时存在为识别标志。不要把 `J:\cs1.5` 等旧副本批量覆盖进来。

15. 不要克隆 WebGLRenderTarget 的纹理当普通贴图
    `WebGLRenderTarget.texture.clone()` 在部分 WebView 会变成缺少可上传图像源的普通纹理，触发 `texSubImage2D` 参数错误。需要独立 repeat 的材质应克隆 Canvas/DataTexture 等可上传纹理；浏览器运行检查必须覆盖首屏渲染，静态测试无法发现此类 GPU 上传问题。

### 2026-08-24 — discovery
**What happened:** 下载的小红书小工具 Skill 会按源码静态扫描网络能力；Three.js r160 UMD 中即使项目未调用的 `fetch` 加载分支也会被判定为违规。
**Do instead:** 更新 Three.js 离线副本后运行 `tools/sanitize-three-offline.ps1`，再执行 `node --check` 和小工具合规测试；保留经典 UMD，避免改成 ES Module。
**Keywords:** minitool, offline, Three.js, fetch, static-scan, UMD

16. FBX 后缀不代表模型已经完成骨骼绑定
   判断角色是否可直接动画必须读取 FBX `Objects` 和 `Connections`：检查 `Model` 的 `LimbNode`、`Deformer` 的 `Skin/Cluster` 以及 `AnimationStack/Curve`。本项目用户 FBX 只有一个 Mesh/Geometry/Material，虽含原生法线，但没有任何骨骼、蒙皮或动画；不能仅因文件是 FBX 就跳过绑定流程。

17. 固定持枪焊接网格需要“离线权重 + 二维移动 + 上下身分层”一起重建
   只证明骨骼矩阵变化不能证明动作可读。离线按关节线段和人体高度生成语义双骨权重，下半身接收前后/横移二维速度，上半身持续瞄准并叠加射击/受击动作，最后必须用真实WebGL画面人工检查步态和枪口位置。

18. 周期动画测试不能断言随机相位的单帧幅度
    每个敌人的步相位随机，某一帧腿部旋转可能恰好过零。浏览器验证应在固定时间窗内记录最大姿态幅度，并单独断言移动混合权重；否则测试会偶发失败但实现并未回退。

19. 当前小红书能力文档优先于不完整或较旧的本地摘录
    用户指定的《小工具容器 · 能力清单》已完整写入 `orbital/XHS_MINITOOL_CAPABILITY_LIST.md`。它的 §3.2 只列出 `postNote`、`saveImageToPhotosAlbum`、`writeTempFile`；旧版 `.codex/.skill` 参考若出现 `openRedPage`、额外 `postNote` 字段或不同的 data URI 约束，必须先重新取得官方依据，不能直接沿用。每次新增容器能力调用前，先判空 `window.xhs?.miniTool`、只传当前表中声明字段，并保留普通浏览器降级路径。

20. 当前版本根目录与历史归档必须保持单一边界
    当前 ZIP、发布源文件、可重复构建工具和当前验收资料留在根目录；历史 ZIP、旧文档、一次性工具、原始素材和过程日志移动到 `archive/` 后，所有仍需读取历史正式基线的校验脚本必须使用明确的 `archive/releases/` 路径。Windows `$RECYCLE.BIN` 是系统回收站元数据，不要作为项目历史内容迁移。

21. 旋转移动 WebView 的 range 不能只依赖原生 input
    设置页的 range 在旋转容器中应使用 `getBoundingClientRect()` 的可视轨道计算；Pointer Events 和 Touch Events 降级都要绑定单指占用、pointer/touch capture 或 identifier 过滤，否则第二根手指可能覆盖当前拖动。数值变更后同时更新标签、布局/玩家状态和 localStorage。

22. 常驻准星与命中 X 必须是两个视觉层
    `#crosshair` 负责持续瞄准定位并允许样式切换，`#hitmarker` 只在命中/爆头/击杀后短暂显示。不要把红色命中 X 当作常驻准星，也不要让准星外观设置改变命中反馈、射线或武器散布。
23. 全局禁止触摸手势时，设置页必须显式切换滚动状态
    游戏态的 `html/body touch-action:none` 能避免摇杆、视角和 FIRE 被浏览器默认手势抢走，但设置中心需要独立的 `overflow-y:auto` 滚动层；打开设置时同步放行 html、body 和菜单的 `pan-y`，关闭或进入布局编辑时恢复原策略。
24. 可滚动设置按钮要延迟点按判定
    设置按钮若在 `pointerdown` 直接 `preventDefault()`，从按钮区域开始上滑可能无法滚动；用约 8px 位移阈值区分点击和滑动，滑动交给滚动容器，未移动才执行按钮动作。
25. 小红书 WebView 的 Touch.target 不能视为必填
    文档级 `touchstart` 监听直接读取 `t.target.closest(...)` 会在真机触发 `Cannot read properties of undefined`；必须先检查触点对象、`target` 和 `closest`。同时，整页旋转后原生 overflow 滚动在触摸链路上可能失效，设置页需要 Touch Events 手动 `scrollTop` 兜底，并保留主轴与边界限制。
26. 设置清理必须覆盖闭包状态和旧 WebView 事件链
    仅把 `_firePointerId`、`firing` 或 CSS active 清零不够；浮动摇杆的 `joyId` 可能仍占用，Touch Events 还可能把结束事件派发到 document、window 或直接在切后台时丢失。清理函数要持有幂等的 `joyEnd`，按 `pointerId`/touch `identifier` 过滤，并覆盖 `pointerup`、`touchend`、`cancel`、`blur`、`pagehide` 和可见性变化。
27. 后坐力方向要和 Three.js 前向量约定一起验证
    本项目的射线前向是 `-Z`，正向 `rotation.x` 把前方抬向 `+Y`；因此射击后增加 pitch、恢复时减少 pitch。相机后坐力、枪模后坐位移和开镜 FOV 都必须在静止帧保持可复位，不能用持续动画模拟后坐。

28. 大型环境模型必须在构建期压缩，并把可视层与玩法碰撞层拆开
    OBJ/MTL 只作为离线输入：先把 4096 PBR 贴图缩放/转码为包内 WebP，再将模型简化或量化到可用的三角形和 `Uint16` 顶点预算，构建成静态经典脚本。运行时不加载 OBJ/MTL/GLB，也不为每个三角形创建碰撞体；构建期从模型垂直面及高于地面的结构性水平面生成栅格并合并为 AABB 代理，地图视觉模型、低端程序化兜底、碰撞代理、出生点和射线/AI 可见性布局分别验证。
29. AABB 代理不能只靠单帧终点解算
     模型碰撞代理可能只有 0.5m 厚，玩家或敌人用较大步长直接查询终点会跨过薄墙；统一由 `GameMap.moveCircle()` 按不超过 0.2m 的轨迹分步调用 `collide()`，并让外围 bounds 与边界碰撞盒错开，避免边界裁剪把实体反复推回墙内。

30. 模型简化后只剩结构顶面的白墙仍要进入碰撞层
    只按法线筛垂直面会漏掉被简化网格保留下来的水平顶面；对高于地面的、尺寸受限的结构性水平面生成从地面起算的全高 AABB，才能同时阻挡低姿态玩家、敌人和射线。该策略是保守玩法代理，源模型变更后必须重新生成并做出生点/通道复核。

31. 短时枪口火光的透明层要使用真实对象引用
    `userData.parts` 应保存 `{ object, opacity }`，统一由 `_setMuzzleOpacity()` 控制 Mesh 和 Sprite 的材质透明度；浏览器视觉复核时不要把包装对象误当成 Mesh。火舌使用透明收尖 Canvas 纹理，避免近景纯色平面呈现为白色方片。

32. 代码新增回归项后必须重新计算文档测试总数
    当前 7 个测试文件的通过项是各文件输出之和，而不是沿用旧文档数字；本轮由 149 更新为 158，README/PRD/当前版本状态需与实际命令输出同步。

33. 地图切换必须和回合生命周期、资源释放一起设计
     选择器只改 `mapId` 不够：开始后必须锁定，死亡结算返回菜单才解锁，胜利重开沿用原图；切图时要同步玩家、武器、补给和小地图引用，并释放旧地图的根节点、材质、贴图、阴影和固定拾取物。新增地图只有在出生点、视觉层、碰撞、射线和回归测试齐全时才能进入选择器。

34. 模型行走代理不能只按长边、面积和高度粗筛
    港口模型中的窄墙、门框和竖向结构可能不满足长边或面积阈值，却仍是玩家和敌人的真实阻挡。构建期应先从地面连接的结构盒写入细粒度占用栅格，再按高度层合并为 AABB，并在源模型变化后复核开放通道和出生点。

35. 玩家、敌人、子弹和视线必须共享同一阻挡依据
    仅修玩家移动或仅修玩家弹道会留下敌我规则不一致。当前港口以真实视觉网格射线为弹道/视线主路径，以同版本模型派生盒作漏检兜底，移动和敌人分离推力也使用同一派生层；新增地图必须覆盖四类主体的同墙测试。

36. 旋转 WebView 输入要先转换到逻辑内容坐标
    屏幕旋转后，右半屏判定、摇杆轨道和视角增量不能直接混用物理屏幕轴。统一通过可视尺寸和旋转逆变换获得逻辑坐标，摇杆保留输入幅度，视角采样可消费 `getCoalescedEvents()`，并让枪模相位与晃动幅度分离以保证静止帧稳定。

37. 布局编辑控件不能放在会整体隐藏的 HUD 父节点下
    游戏态为避免误触会隐藏 HUD；如果虚拟控制同时嵌在 HUD 中，编辑按钮虽然保存了坐标，控件仍没有可见矩形，用户无法拖动。需要让控制层与 HUD 同级，编辑态显式显示，退出时按进入来源单独恢复控制层可见性。

38. 敌人资源逻辑要和玩家补给共用消耗路径
    敌人有限弹匣、换弹读条和主动取弹如果各自实现，容易出现“看得见但拿不到”或补给不重生。弹药包的活动/消耗/重生应由 `Pickup` 统一维护，敌人只负责搜索、移动到拾取范围和增加自己的备用弹量。

39. 一次性 GPU 预热不能插入开始战斗的关键帧
    PMREM 或大批模型构建应在首帧菜单之后的空闲回调/延迟任务中执行；若用户已经开始战斗则暂缓，结算后再安排，避免冷启动和第一波刷怪同帧出现长帧。文档和测试必须区分“浏览器观察到无应用长任务”和“真实设备性能已验收”。

40. 首屏脚本少不等于资源已经准备好
    把模型脚本从 `index.html` 移走后，点击开始必须有明确加载状态，并等待脚本、图片解码、地图纹理、着色器编译和必要的非低端 PMREM 全部完成后再进入 `playing`；音频解锁仍要留在真实用户手势的同步调用栈内。否则会把启动卡顿变成开局黑面、无贴图或首发长帧。

41. 几何量化必须用拓扑和误差双证据验收
    只比较文件大小无法证明地图和枪没有变形。量化工具应固定读取归档源，逐字节比较索引、核对顶点/三角形数量，并计算世界坐标、第一人称模型位置和法线角误差；重复运行还要得到同一输出哈希。敌人按设备拆载荷时，桌面高模与完整骨骼数据仍需随包保留。

42. 发布清单应成为打包、校验和测试的单一事实源
    文件从内嵌贴图改为包内图片后，手写在三个脚本里的文件列表很容易漂移。`tools/release-files.json` 应同时驱动打包、ZIP 精确校验和小工具合规测试；新候选默认写入独立目录，并用 Windows PowerShell 5.1、`pwsh`、重复构建哈希和根候选哈希共同证明边界。

43. 静态双手 OBJ 要把可实现边界写进资产契约
    先按连通组件和空间侧别确认左右手，再以腕部为枢轴做简化、量化和误差检查；运行时让三把枪复用几何和材质，姿势差异只进入配置。没有骨骼和手指关节的 OBJ 只能做整手刚性定位，截图看似靠近枪柄不代表五指已经真实包握；空闲、切枪、换弹、低端贴图分支和真机遮挡必须分别验收。
44. 焊接的 AK 整体握持网格不能再拆成通用双手
    用户提供的 AK+双臂+双手 OBJ 只有一个连通组件，正确策略是保留为 AK 专属视图模型；运行时隐藏通用双手，Glock/AWP 不复用它。减面时必须以 `(位置簇, UV)` 保留图集接缝，并在 Uint16 顶点上限、PBR 贴图和浏览器遮挡截图上分别验收。

45. 第一人称融合模型必须先固定枪口轴再调视图位置
    文件夹名不同不代表资源不同；本次 `wz50` 与 `wz` 六个文件哈希完全一致，真正错误是把 +X 枪口沿用旧 AK 的 `-PI/2`，导致真机从枪口看向枪托。生成器应把源轴、运行时轴和旋转写入清单与测试；浏览器验收要等待 `playing` 并通过公开 `switchTo()` 切枪，自动截图不能替代当前候选真机复测。

46. 贴图清晰度、几何密度和采样过滤必须一起做容量预算
    放大 WebP 不能消除 98% 减面造成的折面，只加面数也不能解决斜视角纹理模糊。融合档应分别固定三角面/顶点/索引格式、PBR 尺寸与编码、各向异性设备上限和 ZIP 预算；资源预热早于武器构建时必须把过滤参数传入首次缓存调用，否则后续设置会被已缓存的 1×纹理吞掉。

47. 回滚到用户确认版本必须以原始 ZIP 本体为锚点
    非 Git 工作区回滚时，先备份当前活动文件，再从用户确认 ZIP 恢复并逐文件校验哈希；重新压缩即使内部文件一致，也可能因 .NET 压缩器版本产生不同 ZIP 字节和哈希。最终交付应复制原始确认 ZIP 本体，并让发布清单、测试和文档同步回到同一版本边界。
