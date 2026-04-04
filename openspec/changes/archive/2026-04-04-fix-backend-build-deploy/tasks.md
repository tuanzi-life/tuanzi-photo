## 1. 新建 postbuild.mjs

- [x] 1.1 新建 `apps/backend/scripts/postbuild.mjs`，复制 `driver/` 到 `dist/driver/`（迁移自 `copy-driver.mjs`）
- [x] 1.2 在 `postbuild.mjs` 中复制 `sql/` 到 `dist/sql/`（迁移自 `copy-driver.mjs`）
- [x] 1.3 在 `postbuild.mjs` 中读取 `package.json`，将 `imports` 字段各值的 `./src/` 前缀替换为 `./`，生成 `dist/package.json`（保留 `name/version/type/imports/dependencies`，去掉 `scripts/devDependencies`）

## 2. 更新 package.json 脚本

- [x] 2.1 删除 `apps/backend/scripts/copy-driver.mjs`
- [x] 2.2 修改 `apps/backend/package.json`：`build` 和 `build:pi` 脚本末尾改为 `node scripts/postbuild.mjs`

## 3. 改造 build-backend.sh

- [x] 3.1 删除 `promote_backend` 函数中的 `cp "apps/backend/package.json" "release/backend/package.json"` 一行
- [x] 3.2 在 `promote_backend` 之后新增 `deploy_backend` 函数：执行 `"${PNPM_CMD[@]}" deploy --filter backend --prod release/backend`（低内存模式同样加 `NODE_OPTIONS`）
- [x] 3.3 在 `main()` 中用 `deploy_backend` 替换对 `install_dependencies` 在部署目录的依赖，确保调用顺序为：`install_dependencies` → `build_backend` → `promote_backend` → `deploy_backend` → `install_driver_deps`

## 4. 改造 run-on-pi.sh

- [x] 4.1 删除 `move_node_modules` 函数及 `main()` 中的调用（`pnpm deploy` 已在 `build-backend.sh` 中处理）

## 5. 新增优雅关机

- [x] 5.1 在 `apps/backend/src/app.ts` 中注册 `SIGTERM` 和 `SIGINT` 处理器，收到信号后调用 `await fastify.close()` 然后 `process.exit(0)`
- [x] 5.2 在 `scripts/tuanzi-photo.service` 中添加 `TimeoutStopSec=200`（大于 `EPD_RENDER_TIMEOUT_MS` 默认值 180s）

## 6. 验证

- [x] 6.1 执行 `cd apps/backend && pnpm build`，确认无报错
- [x] 6.2 检查 `apps/backend/dist/package.json` 存在，`imports["#paths"]` 值为 `"./paths.js"`
- [x] 6.3 检查 `apps/backend/dist/driver/` 和 `apps/backend/dist/sql/` 存在，`dist/` 中无 `node_modules/`
- [x] 6.4 执行 `cd apps/backend && pnpm typecheck`，确认通过
