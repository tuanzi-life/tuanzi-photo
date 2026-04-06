## Why

前端目前使用 mock 数据，所有照片、标签、定时任务功能均无真实数据支撑。需要实现完整的后端 REST API，让前端能够读写真实的 SQLite 数据，并通过墨水屏驱动完成照片推送。

## What Changes

- 新增 `packages/shared-types` 中的前后端共享类型定义（PhotoVO、TagVO、ScheduleVO 等）
- 新增 Fastify 插件：`plugins/db.ts`（better-sqlite3 连接）、`plugins/screen.ts`（墨水屏刷新锁）
- 新增路由：`routes/photos.ts`、`routes/tags.ts`、`routes/schedule.ts`
- 新增服务层：`services/photo.service.ts`、`services/tag.service.ts`、`services/schedule.service.ts`
- 上传接口 `POST /api/v1/photos/upload` 保留空实现，未来接入 OSS

## Capabilities

### New Capabilities

- `photo-api`：照片的增删查和推送到墨水屏的完整 REST API（共 4 个接口）
- `tag-api`：标签列表及每个标签照片计数的 REST API（共 1 个接口）
- `schedule-api`：定时刷新配置的读取、保存和立即触发的 REST API（共 3 个接口）
- `shared-types`：前后端共享的请求/响应 TypeScript 类型定义

### Modified Capabilities

（无现有 spec 级别需求变更）

## Impact

- `packages/shared-types`：新增类型导出文件
- `apps/backend/src/`：新增 plugins、routes、services 下的多个文件
- 数据库路径：`data/main/main.db`（运行时，不进版本控制）
- 依赖：`better-sqlite3`（已在 schema.sql 注释中提及）、`@fastify/multipart`（上传接口预留）
- 墨水屏推送通过 `child_process` 调用 Python SPI 驱动脚本，刷新期间使用 `isRefreshing` 布尔锁拒绝重复请求（返回 409）
