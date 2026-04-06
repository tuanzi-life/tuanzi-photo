## Why

`apps/backend` 中多处文件各自通过 `__dirname` + 相对层级计算路径，其中 `display.service.ts` 存在生产环境路径 Bug（`backendRoot` 上溯层数错误，导致驱动目录和缓存目录在树莓派上解析出错），`db.ts` 也依赖脆弱的 4 级上溯和分散的 `NODE_ENV` 条件判断。将路径逻辑集中到单一模块，可修复现有 Bug 并防止目录结构调整时引发难以排查的运行时故障。

## What Changes

- **新增** `apps/backend/src/paths.ts`：集中导出 `APP_ROOT`、`PROJECT_ROOT` 及常用路径常量（`dbFile`、`schemaFile`、`driverDir`、`cacheDir`），是唯一需要 `NODE_ENV` 判断的地方
- **配置** `apps/backend/package.json` 的 `imports` 字段，添加 `"#paths": "./src/paths.js"` 别名，使 package 内任意层级的文件均可通过 `import { paths } from "#paths"` 引用，无需关心相对层级
- **修复** `display.service.ts`：移除错误的 `backendRoot`（上溯层数多一级）、颠倒的 `driverBase` NODE_ENV 逻辑、错误的 `cacheDir`，改为 `import { paths } from "#paths"`
- **重构** `db.ts`：移除脆弱的 `../../../../data/main/main.db` 4 级上溯和分散的 `SCHEMA_PATH` NODE_ENV 条件，改为 `import { paths } from "#paths"`
- `env.ts` 和 `app.ts` 无需修改（路径计算本身正确）

## Capabilities

### New Capabilities

- `backend-path-resolution`: 集中管理 backend 在开发/生产环境下的路径解析逻辑，提供 `APP_ROOT`、`PROJECT_ROOT` 及具体路径常量

### Modified Capabilities

（无 spec 级别行为变更，纯实现层重构与 Bug 修复）

## Impact

- **修复文件**：`apps/backend/src/services/display.service.ts`、`apps/backend/src/plugins/db.ts`
- **新增文件**：`apps/backend/src/paths.ts`
- **配置文件**：`apps/backend/package.json`（新增 `imports` 字段）
- **无 API/接口变更**：仅内部路径计算逻辑调整
- **无新依赖**：`imports` 字段为 Node.js 原生特性，`tsx` 和 Node.js 均原生支持，无需额外工具
