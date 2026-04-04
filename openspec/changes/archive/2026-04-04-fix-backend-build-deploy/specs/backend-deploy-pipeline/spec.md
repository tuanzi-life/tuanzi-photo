## ADDED Requirements

### Requirement: 使用 pnpm deploy 管理生产依赖

部署流程 SHALL 使用 `pnpm deploy --filter backend --prod <target>` 将后端生产依赖写入部署目录，不得通过 `mv`、`cp` 或手动移动 `node_modules/` 的方式部署依赖。

#### Scenario: 生产依赖正确安装到部署目录

- **WHEN** `build-backend.sh` 执行 `pnpm deploy` 步骤
- **THEN** `release/backend/node_modules/` 存在，包含所有 `dependencies` 中的包，不包含 `devDependencies`

#### Scenario: 源码目录 node_modules 在部署后保持完整

- **WHEN** 完整执行 `bash scripts/run-on-pi.sh`
- **THEN** `apps/backend/node_modules/` 仍然存在，后续可直接再次执行构建而无需重新 `pnpm install`

### Requirement: 构建产物与部署产物分离

`dist/` 目录 SHALL 只包含编译产物（`.js` 文件、`driver/`、`sql/`、`package.json`），不包含 `node_modules/`；`node_modules/` SHALL 由 `pnpm deploy` 写入最终部署目录。

#### Scenario: dist 目录不含 node_modules

- **WHEN** `pnpm build` 或 `pnpm build:pi` 执行完成
- **THEN** `apps/backend/dist/` 中不存在 `node_modules/` 目录
