## 1. 共享类型（packages/shared-types）

- [x] 1.1 检查 `packages/shared-types` 的 `package.json` 和 `tsconfig.json`，确认导出入口配置正确
- [x] 1.2 新增 `src/photo.ts`：定义 `PhotoVO`、`PhotoListResponse`
- [x] 1.3 新增 `src/tag.ts`：定义 `TagVO`、`TagListResponse`
- [x] 1.4 新增 `src/schedule.ts`：定义 `ScheduleVO`、`UpdateScheduleBody`
- [x] 1.5 更新 `src/index.ts`，统一导出所有类型

## 2. 后端依赖安装

- [x] 2.1 在 `apps/backend` 安装 `better-sqlite3` 及 `@types/better-sqlite3`
- [x] 2.2 在 `apps/backend` 安装 `@fastify/multipart`（上传接口预留）
- [x] 2.3 在 `apps/backend` 安装 `fastify-plugin`

## 3. 数据库插件（plugins/db.ts）

- [x] 3.1 新增 `src/plugins/db.ts`，用 `fastify-plugin` 封装 better-sqlite3 连接，挂载到 `fastify.db`
- [x] 3.2 启动时检查并创建 `data/db/` 目录（若不存在）
- [x] 3.3 启动时执行 `schema.sql` 初始化表结构（幂等，`CREATE TABLE IF NOT EXISTS`）
- [x] 3.4 启动时执行 `PRAGMA foreign_keys = ON`
- [x] 3.5 为 TypeScript 添加 `fastify.db` 的类型声明扩展

## 4. 墨水屏插件（plugins/screen.ts）

- [x] 4.1 新增 `src/plugins/screen.ts`，用 `fastify-plugin` 封装，持有 `isRefreshing` 布尔状态
- [x] 4.2 实现 `fastify.screen.pushPhoto(photoId: number): Promise<void>`，调用 Python 脚本，执行前后设置锁
- [x] 4.3 实现 `fastify.screen.isRefreshing` 读取器
- [x] 4.4 为 TypeScript 添加 `fastify.screen` 的类型声明扩展

## 5. 服务层

- [x] 5.1 新增 `src/services/photo.service.ts`：实现 `listPhotos(tags?)`、`getPhotoById(id)`、`deletePhoto(id)` 方法
- [x] 5.2 新增 `src/services/tag.service.ts`：实现 `listTagsWithCount()` 方法
- [x] 5.3 新增 `src/services/schedule.service.ts`：实现 `getSchedule()`、`upsertSchedule(body)`、`calcNextRefreshTime(schedule)` 方法
- [x] 5.4 `getSchedule()` 在表为空时自动插入默认行

## 6. 路由层

- [x] 6.1 新增 `src/routes/photos.ts`，注册以下路由并绑定 JSON Schema：
  - `GET /api/v1/photos`（query: `tags?`）
  - `POST /api/v1/photos/upload`（空实现，返回 201 占位响应）
  - `DELETE /api/v1/photos/:id`
  - `POST /api/v1/photos/:id/push`
- [x] 6.2 新增 `src/routes/tags.ts`，注册 `GET /api/v1/tags`
- [x] 6.3 新增 `src/routes/schedule.ts`，注册以下路由：
  - `GET /api/v1/schedule`
  - `PUT /api/v1/schedule`（含参数校验：`refreshMode`、`timingHour` 0-23、`intervalHours` 1-24、`refreshRule`）
  - `POST /api/v1/schedule/trigger`
- [x] 6.4 所有路由错误响应使用中文提示（`照片不存在`、`墨水屏正在刷新，请稍后再试` 等）

## 7. 注册插件与路由

- [x] 7.1 在 `src/app.ts` 中注册 `plugins/db.ts` 和 `plugins/screen.ts`
- [x] 7.2 在 `src/app.ts` 中注册 `routes/photos.ts`、`routes/tags.ts`、`routes/schedule.ts`，统一挂载 `/api/v1` 前缀
