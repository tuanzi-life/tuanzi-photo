## Context

当前后端已经有 `schedule` 配置表、`POST /api/v1/schedule/trigger` 接口和 `POST /api/v1/photos/:id/push` 接口，但没有任何推送历史记录，也没有后台任务自动按整点调用调度入口。`pickPhotoForRefresh` 目前只按 `random` / `created_at` 选图，无法避免某些照片被重复推送。

项目运行在树莓派 Zero 2W 上，后端使用 Fastify v5 与 `better-sqlite3`，因此设计上需要保持单进程、低内存和尽量少的外部依赖。本次需求还要求在数据库之外维护一个本地 JSON 文件，用于记录每张照片按手动/定时维度的成功渲染次数。

## Goals / Non-Goals

**Goals:**

- 为手动推送和定时推送建立统一的渲染历史记录能力
- 让后端在每个整点自动执行一次调度检查，但只有真正到达用户配置时间时才触发后续逻辑
- 基于历史成功渲染次数优化选图，让未渲染或较少渲染的照片优先展示
- 保持现有接口路径不变，尽量复用已有路由和屏幕推送能力

**Non-Goals:**

- 不新增前端页面或渲染历史查询接口
- 不引入 Redis、消息队列或独立任务进程
- 不改变现有 `schedule` 配置结构和对外响应格式
- 不实现秒级或分钟级精度的调度，后台任务仍以整点轮询为准

## Decisions

### 1. 使用 `render_history` 作为事实来源，JSON 文件作为派生快照

数据库中的 `render_history` 表保存每次推送尝试的完整结果，字段包含 `id`、`time`、`photo_id`、`type`、`result`。其中 `time` 存储 Unix 时间戳，`result = 'success'` 表示真正完成渲染，其他值保存失败原因或驱动返回信息。

`data/main/render_history.json` 只记录成功渲染次数，结构为 `{ "<photo-id>": { "manual": number, "schedule": number } }`。这样既能满足本地统计文件要求，又不会把失败尝试错误计入“已渲染次数”。

备选方案：直接把 JSON 作为唯一统计来源。放弃原因是 JSON 不适合保存失败原因和审计明细，且更容易在异常写入时丢失上下文。

### 2. 新增独立的 `render-history.service.ts` 封装写库与写文件

所有与渲染历史相关的逻辑集中在单独 service 中，至少包含：

- 写入一条历史记录
- 在成功渲染时递增 JSON 中对应照片与类型的计数
- 读取某张照片或一批照片的成功渲染次数（供选图逻辑使用或重建快照）

手动推送和定时推送都通过该 service 记录结果，避免路由层各自处理数据库和文件写入。

备选方案：把写历史逻辑直接散落在 `photos.ts` 与 `schedule.ts`。放弃原因是重复代码会让成功/失败记录规则逐步分叉。

### 3. `POST /api/v1/schedule/trigger` 继续作为统一入口，但变为“调度检查接口”

后台整点任务不会直接调用 service，而是通过 Fastify 内部请求访问现有 `POST /api/v1/schedule/trigger`。这个接口在语义上是内部调度 trigger，不承担用户手动刷新的职责；手动刷新仍使用 `POST /api/v1/photos/:id/push`。实现上优先使用 `fastify.inject()`，这样不依赖本机端口监听状态，也不会产生额外网络开销。

该接口收到请求后，首先读取 schedule 配置并执行 `shouldTriggerNow(schedule, now)`：

- `timing` 模式：仅当当前小时等于 `timingHour` 时返回 `true`
- `interval` 模式：以当天 `00:00` 作为起算点，仅当当前时间恰好落在 `intervalHours` 对应的整点槽位时返回 `true`

当结果为 `false` 时直接返回成功响应，不做选图、不做推送、不写历史；当结果为 `true` 时才执行锁检查、选图和推送。由于该接口只会被程序按小时触发一次，不额外引入“同一小时去重”的状态。

备选方案：新增一个内部 service 专供定时器调用，绕开 HTTP 路由。放弃原因是会形成两套触发入口，后续行为更容易漂移。

### 4. 选图算法采用“最少成功渲染次数优先，规则决定同分照片顺序”

`pickPhotoForRefresh` 改为先筛出符合 tag 条件的候选照片，再基于历史成功渲染次数排序：

- 总成功渲染次数最少的照片优先
- 从未成功渲染过的照片视为次数 `0`
- 当 `refreshRule = time` 时，在最小次数集合里按 `created_at asc` 取最早照片
- 当 `refreshRule = random` 时，在最小次数集合里随机选择一张

这里的“总成功渲染次数”使用 `manual + schedule` 合计值，目标是让所有照片的总体展示机会趋于平衡，而不是只平衡某一种触发方式。

备选方案：继续纯随机，再结合最近一次渲染做简单排除。放弃原因是随机在小样本下仍容易重复，无法满足“尽量不要再渲染”和“次数趋于平衡”的要求。

### 5. 接受请求后仍保持异步推送，但结果记录放进统一包装函数

现有两个接口在接受请求后立即返回 `200`，真正的屏幕推送在后台 Promise 中执行。本次保持这个交互不变，但将 `fastify.screen.pushPhoto(objectKey)` 包装成统一流程：

1. 发起异步推送
2. 成功时写入 `render_history(result='success')`，并更新 JSON 成功计数
3. 失败时写入 `render_history(result='<失败原因>')`
4. 同时记录 Fastify 日志

这样既保留现有异步模型，也能完整记录最终结果。

### 6. `render_history` 不建立级联删除外键，JSON 写入失败不影响主流程

`render_history.photo_id` 不做 `on delete cascade`。照片被删除后，历史记录继续保留，作为审计信息存在。

`render_history.json` 只是选图算法的派生计数文件。写入失败时，只记录日志，不回滚已经成功的推送结果，也不让接口转为失败；后续选图最多暂时使用过期计数。

## Risks / Trade-offs

- [整点任务与人工请求共用同一路由] → 通过 `shouldTriggerNow` 先做时间判断，避免后台轮询造成误触发；同时保留 `isRefreshing` 锁语义
- [JSON 文件与数据库可能短暂不一致] → 以 `render_history` 为事实来源，JSON 只作派生快照；文件写入失败只记日志，文件缺失或损坏时允许根据成功历史重建
- [`interval` 模式的边界时间需要稳定定义] → 固定以每日 `00:00` 为起点，按 `intervalHours` 的整点槽位判断是否触发
- [随机规则下难以完全公平] → 仅在“最少成功次数”的候选集合中随机，公平性和随机性同时兼顾
- [后台任务通过 `fastify.inject()` 不经过网络] → 与真实外部 HTTP 行为略有差异，但更稳定，且足以覆盖当前单进程部署模型
- [历史记录与照片删除解耦] → 不做级联删除，允许出现引用已删除照片 ID 的历史记录，这是刻意保留的审计行为

## Migration Plan

1. 在后端 workspace 安装 `@fastify/schedule` 与 `toad-scheduler`
2. 更新 `schema.sql`，应用启动时自动创建 `render_history` 表
3. 扩展 `paths.ts`，确保 `data/main/` 目录和 `render_history.json` 路径可解析
4. 上线后由新逻辑逐步累积历史数据；若 JSON 文件不存在，由服务首次成功写入时创建，写入失败仅记录日志
5. 如需回滚，移除调度插件注册与历史记录写入逻辑即可；遗留表和 JSON 文件不会影响旧逻辑运行

## Open Questions

- 是否需要在后续补一个离线重建 `render_history.json` 的维护脚本，用于手工修复文件损坏场景？本次先不加入范围
