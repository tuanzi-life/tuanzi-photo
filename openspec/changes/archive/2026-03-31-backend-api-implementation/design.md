## Context

项目为树莓派 Zero 2W + 6色墨水屏电子相册，前端（Vue 3 + Nuxt UI）目前使用 mock 数据。后端框架为 Fastify v5，数据库为 SQLite（better-sqlite3），运行时内存约束为 512MB（Node.js 限制 128MB）。

数据库已有 Schema：`photo`、`tag`、`photo_tag`、`schedule` 四张表，存储路径 `data/main/main.db`。

## Goals / Non-Goals

**Goals:**

- 实现 8 个 REST API，覆盖照片、标签、定时任务全部功能
- 在 `packages/shared-types` 中集中定义请求/响应 TypeScript 类型，前后端复用
- 遵循 Fastify 插件化最佳实践（fp 封装、生命周期管理）
- 墨水屏推送使用 `isRefreshing` 布尔锁防重入，409 拒绝冲突请求

**Non-Goals:**

- 上传功能（OSS 集成留作后续，接口保留空实现）
- 前端 store 与真实 API 的对接（本次只做后端）
- 图片缩略图生成（sharp 处理留作后续）
- 认证/鉴权

## Decisions

### 1. shared-types 使用纯类型导出

`packages/shared-types` 只放 TypeScript 类型（interface/type），不放运行时代码。Fastify JSON Schema 校验使用 Zod 或手写 JSON Schema Object，但类型复用 shared-types 中的定义。

**备选方案**：用 Zod schema 同时做运行时校验和类型推导 → 会引入运行时依赖，与 shared-types 只导出类型的约定冲突，放弃。

### 2. 数据库插件使用 fastify-plugin 封装

`plugins/db.ts` 用 `fastify-plugin`（fp）封装 better-sqlite3，挂载到 `fastify.db`，所有路由通过装饰器访问，避免作用域隔离导致无法跨插件共享。

### 3. 服务层与路由层分离

路由只做 HTTP 参数解析和响应格式化，业务逻辑（SQL 查询、计算 nextRefreshTime）集中在 `services/` 中。便于测试和后续替换。

### 4. isRefreshing 布尔锁挂在 screen 插件上

`plugins/screen.ts` 持有 `isRefreshing` 状态并暴露 `pushToScreen(photoId)`、`triggerRefresh()` 方法。路由直接调用，保证单进程内状态一致。

### 5. nextRefreshTime 在读取时实时计算

`GET /api/v1/schedule` 响应中的 `nextRefreshTime` 由服务层根据当前时间和配置实时计算，不持久化到数据库，减少写入次数。

### 6. 所有接口统一返回 ApiResponse 包装格式

所有路由返回 HTTP 200，业务状态通过 `ApiResponse.code` 区分：`0` 表示成功，其余值（400/404/409/500 等）表示具体错误。前端只需检查一个字段，无需处理多种 HTTP 状态码。

```ts
// 成功
{ code: 0, message: "ok", data: { ... } }
// 业务错误
{ code: 404, message: "照片不存在", data: null }
```

`src/utils/response.ts` 提供 `ok(data)` 和 `err(code, message)` 两个工厂函数供路由使用。Fastify 的全局 `setErrorHandler` 将 Schema 校验失败等框架级错误也统一包装为 ApiResponse（code: 400），保证整个 API 层响应格式一致。

**备选方案**：继续使用 HTTP 状态码语义区分错误 → 前端需同时处理 HTTP 状态码和响应体，增加集成复杂度，放弃。

### 7. relatedTags 在数据库中存储为 JSON 字符串

`schedule.related_tags` 字段存储为 JSON 数组字符串（如 `'["风景","自然"]'`），读取时 `JSON.parse`，写入时 `JSON.stringify`，无需增加关联表。

## Risks / Trade-offs

- **SQLite 单线程写入** → Fastify 默认单线程，better-sqlite3 同步驱动，无并发写入冲突风险
- **isRefreshing 锁进程重启后丢失** → 重启后锁自动重置为 false，属于可接受行为；Python 脚本执行期间进程重启极小概率
- **上传接口空实现** → 前端调用时会得到成功响应但无实际数据写入，需前端在接入 OSS 后同步修改
- **data/main/ 目录不存在时启动失败** → 服务启动时检查并自动创建目录和初始化 Schema

## Migration Plan

1. 安装依赖：`better-sqlite3`、`@fastify/multipart`（后端）
2. 初始化数据库：服务启动时执行 `schema.sql`（`CREATE TABLE IF NOT EXISTS`，幂等）
3. 前端 store 中的 mock 数据替换为真实 API 调用（后续单独 change）

## Open Questions

- Python 脚本路径是否需要可配置（环境变量）？→ 暂时硬编码，后续视需求调整
- 照片 `url` 字段在空实现阶段返回什么值？→ 返回空字符串，接入 OSS 后更新
