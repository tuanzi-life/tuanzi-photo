# AGENTS.md

这个文件定义了 `apps/backend` 目录下的工作规则。

## 适用范围

- Fastify v5 后端应用。
- 使用 `better-sqlite3` 的 SQLite。
- 使用 `sharp` 进行图片处理。
- 负责墨水屏刷新流程编排和厂商驱动调用。

## 目录结构

- 应用入口：`src/app.ts`。
- HTTP 路由：`src/routes/`。
- Fastify 插件：`src/plugins/`。
- 核心业务逻辑：`src/services/`。
- 工具方法：`src/utils/`。
- SQL 资源：`sql/`。
- 驱动打包辅助文件：`scripts/` 和 `driver/`。

## 后端规则

- SQLite 数据库路径固定为 `data/db/main.db`。
- 数据库驱动固定使用同步版 `better-sqlite3`。没有明确需求时，不要引入其他数据库驱动。
- 保持现有刷新锁语义：`isRefreshing` 是布尔锁，并发刷新请求必须返回 HTTP 409，而不是排队处理。
- 上传图片时要预处理为 6 色墨水屏输出并缓存到磁盘；真正刷新屏幕时应直接读取缓存文件，不要重复计算。
- 严格控制内存占用。生产启动保持 `--max-old-space-size=128`，图片处理代码要及时释放资源，不要长期持有大 buffer。
- 墨水屏硬件驱动通过 `child_process` 调用 Python 脚本。除非需求明确变化，否则保持这种集成方式。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm start
```

## 验证规则

- 修改后端 TypeScript 源码后，执行 `pnpm typecheck`。
- 如果改动涉及路由、服务、启动流程、脚本、驱动集成或生产行为，再执行 `pnpm build`。
- 如果共享类型发生变化，在共享包更新后重新执行后端验证。
