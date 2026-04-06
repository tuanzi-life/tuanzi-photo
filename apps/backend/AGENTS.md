# AGENTS.md

这个文件定义了 `apps/backend` 目录下的工作规则。

## 适用范围

- Fastify v5 后端应用。
- 使用 `better-sqlite3` 的 SQLite。
- 使用 `sharp` 处理上传图片方向。
- 负责 OSS 文件管理、墨水屏刷新流程编排、电量读取和厂商 Python 驱动调用。

## 目录结构

- 应用入口：`src/app.ts`。
- 环境变量读取：`src/env.ts`。
- 路径集中定义：`src/paths.ts`。
- HTTP 路由：`src/routes/`。
- Fastify 插件：`src/plugins/`。
- 核心业务逻辑：`src/services/`。
- 工具方法：`src/utils/`。
- SQL 资源：`sql/`。
- Python 驱动：`driver/`。
- 构建后处理脚本：`scripts/postbuild.mjs`。
- `dist/` 是构建产物；不要把它当作手写源码维护。

## 后端规则

- SQLite 数据库路径固定为 `data/main/main.db`。
- 渲染历史快照文件固定为 `data/main/render_history.json`。
- 数据库驱动固定使用同步版 `better-sqlite3`。没有明确需求时，不要引入其他数据库驱动。
- 运行时目录由后端自己确保存在，至少包括 `data/main/` 和 `data/cache/`。不要把运行时文件写到源码目录或 `dist/` 目录。
- 路径解析统一通过 `src/paths.ts` 和 `#paths` import alias 获取。不要在其他模块重复写基于 `__dirname`、`NODE_ENV` 或相对层级上溯的路径判断。
- `src/env.ts` 会主动读取 `apps/backend/.env`。新增配置时先扩展 `env.ts`，不要在业务代码里零散读取 `process.env`。
- API 前缀固定为 `/api/v1`，健康检查为 `/health`。新增路由时保持现有挂载方式，不要引入第二套路由入口。
- 接口响应统一使用 `ApiResponse` 包装，优先复用 `src/utils/response.ts` 的 `ok()` 和 `err()`；不要随意返回裸对象。
- 现有业务错误语义依赖 `ApiResponse.code`，例如“墨水屏正在刷新”返回 `code: 409`。不要把这类错误改成仅靠 HTTP 状态码表达，除非需求明确变化。
- 保持现有刷新锁语义：`isRefreshing` 是布尔锁，并发刷新请求必须立即拒绝，不排队、不重试。
- 手动推送和定时推送目前都是“先返回成功，再后台执行渲染并记录历史”的 fire-and-forget 模式；不要在无明确需求时改成同步阻塞接口。
- 上传接口使用 `@fastify/multipart` 的临时文件和 `sharp(...).rotate()` 做方向归正；改动上传流程时必须继续保证临时文件会被清理。
- 真正刷新墨水屏前，图片会优先复用 `data/cache/` 下已有 BMP 缓存；不要无故删除这层缓存，也不要重复渲染已缓存的文件。
- 严格控制内存占用。生产启动保持 `--max-old-space-size=128`，图片处理代码要及时释放资源，不要长期持有大 buffer。
- `driver/waveshare` 和 `driver/ups` 都来自微雪官方驱动或基于其官方驱动整理的封装；修改这两部分前，先把它们视为厂商驱动集成，而不是普通业务代码。
- 墨水屏渲染和电量读取都由 Node 侧通过 `child_process.spawn()` 发起 Python 调用，并依赖 `EPD_PYTHON_BIN`。除非需求明确变化，否则保持这种“Node 编排 + Python 驱动执行”的集成方式。
- Python 驱动路径由 `paths.driverDir` 派生；不要硬编码 `driver/waveshare` 或 `driver/ups` 的绝对路径。
- OSS 客户端统一通过 `src/utils/oss.ts` 懒加载；不要在各个服务里重复 new `ali-oss` 客户端。
- 生产环境由 Fastify 托管前端构建产物，并对非 API 请求返回 SPA fallback。涉及静态托管时，同时检查生产路径和 API 路由是否冲突。
- 整点调度由 `@fastify/schedule` + `toad-scheduler` 在 `Asia/Shanghai` 时区触发，并通过 `app.inject()` 调用 `/api/v1/schedule/trigger`。修改定时逻辑时，保持这条执行链路的一致性。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm build:pi
pnpm typecheck
```

## 验证规则

- 修改后端 TypeScript 源码后，执行 `pnpm typecheck`。
- 如果改动涉及路由、服务、启动流程、脚本、驱动集成或生产行为，再执行 `pnpm build`。
- 如果改动涉及 `src/paths.ts`、`src/env.ts`、`scripts/postbuild.mjs`、`driver/`、`sql/` 或生产部署行为，执行 `pnpm build`，并确认 `dist/` 中的 `driver/`、`sql/`、`package.json` 与路径解析仍然正确。
- 如果改动涉及上传、渲染、电池读取、定时刷新或 OSS 流程，至少做一轮端到端自查，确认没有破坏临时文件清理、缓存复用、后台任务触发或错误日志记录。
- 如果共享类型发生变化，在共享包更新后重新执行后端验证。
