## 1. 初始化 release 目录与 gitignore

- [x] 1.1 创建 `release/frontend/.gitkeep`，确保前端产物目录被 git 追踪
- [x] 1.2 创建 `release/VERSION`（内容为 `0.1.0`），确保版本文件被 git 追踪
- [x] 1.3 修改根 `.gitignore`，新增 `release/backend/` 排除规则

## 2. 迁移脚本到 scripts/ 目录并新增发布脚本

- [x] 2.1 将 `build-on-pi.sh` 移动到 `scripts/build-on-pi.sh`
- [x] 2.2 将 `run-on-pi.sh` 移动到 `scripts/run-on-pi.sh`
- [x] 2.3 将 `tuanzi-photo.service` 移动到 `scripts/tuanzi-photo.service`
- [x] 2.4 创建 `scripts/release-frontend.sh`，实现：`set -euo pipefail`；执行 `pnpm --filter frontend build`；清空并复制产物到 `release/frontend/`；从根 `package.json` 读取 `version` 写入 `release/VERSION`；打印 git 提交提示
- [x] 2.5 为 `scripts/release-frontend.sh` 添加可执行权限（`chmod +x`）

## 3. 更新各 package.json

- [x] 3.1 根 `package.json`：新增 `"version": "0.1.0"`；将 `build:pi` 和 `run:pi` script 路径更新为 `scripts/` 前缀；新增 `"release": "bash ./scripts/release-frontend.sh"` script
- [x] 3.2 `apps/frontend/package.json`：新增 `"version": "0.1.0"`
- [x] 3.3 `apps/backend/package.json`：新增 `"version": "0.1.0"`，移除 `start` script
- [x] 3.4 `packages/shared-types/package.json`：新增 `"version": "0.1.0"`（如文件存在）

## 4. 修改 scripts/build-on-pi.sh

- [x] 4.1 删除 `build_frontend()` 函数
- [x] 4.2 从 `main()` 中删除 `build_frontend` 调用
- [x] 4.3 在 `build_backend()` 之后新增 `promote_backend()` 步骤：`rm -rf release/backend && mv apps/backend/dist release/backend`
- [x] 4.5 在 `promote_backend()` 中追加：若 `apps/backend/.env` 存在则 `cp apps/backend/.env release/.env`
- [x] 4.4 更新 `print_next_steps` 日志，说明前端产物来自 `release/frontend/`（通过 git pull 获取），backend 产物位于 `release/backend/`

## 5. 修改 scripts/run-on-pi.sh

- [x] 5.1 将 `SERVICE_SRC` 路径从 `${REPO_ROOT}/tuanzi-photo.service` 更新为 `${REPO_ROOT}/scripts/tuanzi-photo.service`
- [x] 5.2 将内部对 `build-on-pi.sh` 的调用路径更新为 `${REPO_ROOT}/scripts/build-on-pi.sh`

## 6. 修改 scripts/tuanzi-photo.service

- [x] 6.1 将 `WorkingDirectory` 从 `%h/tuanzi-photo/apps/backend` 改为 `%h/tuanzi-photo/release`
- [x] 6.2 将 `ExecStart` 从 `/usr/bin/node --max-old-space-size=128 dist/app.js` 改为 `/usr/bin/node --max-old-space-size=128 backend/app.js`

## 7. 修改 apps/backend/src/app.ts

- [x] 7.1 将 `frontendDist` 路径从 `join(__dirname, "../../frontend/dist")` 改为 `join(__dirname, "../frontend")`（`__dirname` 在生产时为 `release/backend/`）

## 8. 验证

- [x] 8.1 执行 `pnpm --filter backend typecheck` 确认 TypeScript 无错误
- [x] 8.2 执行 `pnpm --filter backend build` 确认 backend 构建正常（产物在 `apps/backend/dist/`）
- [x] 8.3 在本机执行 `pnpm release`，确认 `release/frontend/` 下有产物且 `release/VERSION` 内容正确
- [x] 8.4 确认 `git status`：`release/frontend/` 与 `release/VERSION` 可见、`apps/frontend/dist/` 与 `release/backend/` 均被忽略
