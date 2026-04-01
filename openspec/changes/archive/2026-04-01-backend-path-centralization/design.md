## Context

Backend 使用 ESM 模块，必须通过 `import.meta.url` 派生 `__dirname`。代码同时运行于两种环境：

| 环境           | 代码位置            | 入口 `__dirname`    |
| -------------- | ------------------- | ------------------- |
| 开发           | `apps/backend/src/` | `apps/backend/src/` |
| 生产（树莓派） | `release/backend/`  | `release/backend/`  |

构建时 `copy-driver.mjs` 将 `sql/` 和 `driver/` 复制到 `dist/`，再由部署脚本将 `dist/` 整体移动为 `release/backend/`，因此这两个目录生产时位于 `release/backend/sql/` 和 `release/backend/driver/`。

运行时数据目录 `data/` 固定位于项目根（开发时 monorepo 根 = `tuanzi-photo/`，生产时 `~pi/tuanzi-photo/`），在两种环境下相对于 backend 代码根均为 `../../data/`。

当前问题根源：`display.service.ts` 中 `backendRoot = resolve(__dirname, "../..")` 在生产时从 `release/backend/services/` 上溯 2 级，得到 `release/`，而非预期的 `release/backend/`，导致 `driverDir` 和 `cacheDir` 均解析错误。

## Goals / Non-Goals

**Goals:**

- 新建 `src/paths.ts` 作为唯一的路径计算源，集中处理开发/生产环境的目录层级差异
- 修复 `display.service.ts` 中的三处路径 Bug
- 消除 `db.ts` 中脆弱的 4 级上溯和分散的 `NODE_ENV` 条件
- 保持现有对外行为（API、数据库、屏幕刷新）完全不变

**Non-Goals:**

- 不改变部署目录结构（`release/backend/`、`data/` 等）
- 不修改构建脚本（`copy-driver.mjs`、`build-backend.sh`）
- 不改动 `env.ts` 和 `app.ts`（路径已正确）

## Decisions

### D1：`paths.ts` 放在 `src/` 根，仅此一处使用 NODE_ENV

`paths.ts` 编译前在 `src/`，编译后在 `dist/`（即 `release/backend/`）。两者 `__dirname` 层级天然相差一级，无法通过纯路径运算消除，必须有一处 `NODE_ENV` 判断：

```
开发：APP_ROOT = resolve(__dirname, "..")  // src/ → apps/backend/
生产：APP_ROOT = __dirname                 // release/backend/（直接就是根）
```

**替代方案**：向上查找 `package.json` 作为锚点。但 `release/backend/` 中没有 `package.json`（构建产物不含），故不可行。

**替代方案**：在每个使用路径的文件里各自判断 `NODE_ENV`。现状如此，正是要消除的问题。

### D2：`PROJECT_ROOT` 固定上溯 2 级

`APP_ROOT` 在两种环境均上溯 2 级可到达项目根（`tuanzi-photo/`）：

```
开发：apps/backend/ → ../../ = tuanzi-photo/ ✓
生产：release/backend/ → ../../ = tuanzi-photo/ ✓
```

因此 `data/` 路径无需 NODE_ENV，统一为 `resolve(APP_ROOT, "../../data")`。

### D3：`sql/` 和 `driver/` 相对 `APP_ROOT` 固定为一级

构建脚本已保证两目录在生产时位于 `release/backend/`，与开发时的 `apps/backend/` 结构一致。因此直接用 `resolve(APP_ROOT, "sql")` 和 `resolve(APP_ROOT, "driver")`，无需条件分支。

## Risks / Trade-offs

- **NODE_ENV 仍存在**：无法完全消除，但收敛到单一文件是显著改善。→ 在文件注释中明确说明原因，防止未来误删。
- **改动涉及启动路径**：`db.ts` 路径错误会导致启动失败。→ 改动后执行 `pnpm typecheck` + `pnpm build` 验证，并在开发环境启动测试。
- **生产路径 Bug 修复无法在开发机直接验证**：只能通过路径计算推导验证正确性。→ 在 `paths.ts` 注释中附上开发/生产两环境的解析结果对照表。
