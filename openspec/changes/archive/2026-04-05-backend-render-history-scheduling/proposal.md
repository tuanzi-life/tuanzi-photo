## Why

当前后端缺少照片推送的持久化审计记录，定时任务也没有和用户配置的触发时间严格对齐。随着电子相册开始依赖自动刷新，系统需要同时解决“何时触发”“推了什么”“是否成功”和“如何尽量避免重复渲染同一张照片”这几件事。

## What Changes

- 新增 `render_history` 数据表，持久化记录手动推送和定时推送的照片、触发时间戳、触发类型与最终结果
- 新增独立的渲染历史服务，统一负责写入 `render_history` 和维护 `data/main/render_history.json` 本地计数文件
- 在后端接入 `@fastify/schedule` 与 `toad-scheduler`，注册每个整点执行的后台任务，并通过现有 `POST /api/v1/schedule/trigger` 入口触发调度检查
- 明确 `POST /api/v1/schedule/trigger` 为内部调度触发入口，仅由 `@fastify/schedule` 的整点任务调用；接口先判断当前是否到达配置的触发时间，未到时直接空操作，已到时才继续选图和推送
- 优化 `pickPhotoForRefresh` 的选图策略，优先选择历史成功渲染次数最少的候选照片，并结合现有刷新规则处理同次数照片的排序
- 让手动推送和定时推送都记录渲染历史，失败时写入失败原因，成功时写入 `success`

## Capabilities

### New Capabilities

- `render-history`: 记录每次照片推送结果，并维护每张照片按 `manual` / `schedule` 维度统计的本地渲染次数快照

### Modified Capabilities

- `schedule-api`: 定时触发接口改为“按配置判断是否应触发”，并新增整点后台调度与基于历史计数的均衡选图行为
- `photo-api`: 手动推送照片时同步写入渲染历史，并在推送失败时保留失败原因

## Impact

- `apps/backend/sql/schema.sql`：新增 `render_history` 表
- `apps/backend/src/services/`：新增 `render-history.service.ts`，修改 `schedule.service.ts`
- `apps/backend/src/routes/`：修改 `schedule.ts`、`photos.ts`
- `apps/backend/src/paths.ts`：新增 `data/main/render_history.json` 路径约定
- `apps/backend/src/plugins/` 或 `app.ts`：接入 `@fastify/schedule` / `toad-scheduler` 后台任务注册
- 后端依赖：新增 `@fastify/schedule`、`toad-scheduler`
