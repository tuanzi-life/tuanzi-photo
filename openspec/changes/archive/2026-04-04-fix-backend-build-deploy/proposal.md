## Why

后端构建部署流程存在三个问题：

1. `apps/backend/package.json` 的 `imports` 字段指向 `./src/paths.js`（开发路径），但 `tsc` 编译后路径展平为 `./paths.js`；`build-backend.sh` 直接复制该文件到 `release/backend/package.json`，导致生产环境 Node.js 解析 `#paths` 时抛出 `ERR_MODULE_NOT_FOUND`。
2. `run-on-pi.sh` 用 `mv` 移动 `node_modules/` 到部署目录，pnpm 的 `node_modules/` 内部依赖符号链接，`mv` 跨目录后链接关系可能失效；且移动后 `apps/backend/node_modules/` 消失，后续无法在不重新安装的情况下再次构建。
3. Fastify 应用未处理 `SIGTERM`/`SIGINT` 信号，systemd 停止服务时正在处理中的请求（包括最长 3 分钟的墨水屏刷新）会被直接切断。

## What Changes

- **新建** `apps/backend/scripts/postbuild.mjs`：合并原 `copy-driver.mjs` 的功能（复制 `driver/`、`sql/` 到 `dist/`），并新增生成 `dist/package.json` 的逻辑——自动将 `imports` 字段中 `./src/` 前缀改为 `./`，保留 `name/version/type/dependencies`
- **删除** `apps/backend/scripts/copy-driver.mjs`
- **修改** `apps/backend/package.json`：`build` 和 `build:pi` 脚本改为引用 `postbuild.mjs`
- **修改** `scripts/build-backend.sh`：删除 `promote_backend` 中 `cp apps/backend/package.json release/backend/package.json` 这一行；`install_dependencies` 改为使用 `pnpm deploy` 将生产依赖直接安装到 `release/backend/`
- **修改** `scripts/run-on-pi.sh`：删除 `move_node_modules` 函数（`pnpm deploy` 已在构建阶段处理依赖）
- **修改** `apps/backend/src/app.ts`：注册 `SIGTERM`/`SIGINT` 处理器，收到信号后调用 `fastify.close()` 等待当前请求处理完成后退出

## Capabilities

### New Capabilities

- `backend-graceful-shutdown`：进程收到终止信号后等待当前请求完成再退出，避免长耗时操作（如墨水屏刷新）被强制中断

### Modified Capabilities

- `backend-path-resolution`：`dist/` 现在由构建步骤自动生成正确的 `package.json`，`#paths` subpath import 在生产环境可正常解析；shell 脚本不再负责修补 build artifact
- `backend-deploy-pipeline`：用 `pnpm deploy` 替代 `mv node_modules`，生产依赖由 pnpm 官方部署命令管理，不依赖文件系统 mv 行为

## Impact

- `apps/backend/scripts/copy-driver.mjs`：删除
- `apps/backend/scripts/postbuild.mjs`：新建
- `apps/backend/package.json`：`scripts.build`、`scripts.build:pi` 字段变更
- `apps/backend/src/app.ts`：新增 SIGTERM/SIGINT 处理器
- `scripts/build-backend.sh`：`promote_backend` 删除一行；调整 `install_dependencies` 使用 `pnpm deploy`
- `scripts/run-on-pi.sh`：删除 `move_node_modules` 函数及调用
- `scripts/tuanzi-photo.service`、`src/paths.ts` 无需改动
