## 1. 新建集中路径模块

- [x] 1.1 新建 `apps/backend/src/paths.ts`，导出 `APP_ROOT`（含 NODE_ENV 判断）、`PROJECT_ROOT`（上溯 2 级）及 `paths` 对象（`dbFile`、`schemaFile`、`driverDir`、`cacheDir`）
- [x] 1.2 在 `apps/backend/package.json` 中添加 `"imports": { "#paths": "./src/paths.js" }` 字段

## 2. 修复 display.service.ts

- [x] 2.1 删除 `display.service.ts` 第 8-18 行的 `__dirname`、`backendRoot`、`driverBase`、`cacheDir` 本地计算（含颠倒的 NODE_ENV 逻辑）
- [x] 2.2 在 `display.service.ts` 中改为 `import { paths } from "#paths"`，用 `paths.driverDir` 和 `paths.cacheDir` 替换原有变量
- [x] 2.3 清理 `display.service.ts` 中不再需要的 `fileURLToPath` 导入（保留 `resolve` 用于拼接 `renderScriptPath`）

## 3. 重构 db.ts

- [x] 3.1 删除 `db.ts` 第 8-15 行的 `__dirname`、`DB_PATH`（4 级上溯）、`SCHEMA_PATH`（NODE_ENV 条件）本地计算
- [x] 3.2 在 `db.ts` 中改为 `import { paths } from "#paths"`，用 `paths.dbFile` 和 `paths.schemaFile` 替换原有变量
- [x] 3.3 清理 `db.ts` 中不再需要的 `dirname`、`fileURLToPath`、`resolve` 导入

## 4. 验证

- [x] 4.1 在 `apps/backend` 执行 `pnpm typecheck` 确保类型无误
- [x] 4.2 在 `apps/backend` 执行 `pnpm build` 确保构建通过
