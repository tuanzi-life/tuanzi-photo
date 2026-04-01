## Why

树莓派 Zero 2W 仅有 512MB RAM，在设备上执行 `vite build` 会导致 OOM；现有的 `build:pi` 限制 heap 只是权宜之计，随着前端功能增长迟早会失效。需要一个从根本上规避树莓派前端构建的稳定方案。

同时，目前各构建产物分散在源码树中（`apps/frontend/dist/`、`apps/backend/dist/`），与源码夹杂在一起，结构不清晰。借此机会统一将所有可部署产物集中到根目录的 `release/` 目录，形成清晰的"源码 vs 产物"分层。

## What Changes

- **新增** `release/frontend/` 目录，纳入 git 追踪，用于存储前端构建产物（本机构建，随代码一起推送）
- **新增** `release/VERSION` 文件，纳入 git 追踪，记录当前发布的版本号
- **新增** `release/backend/` 目录结构，不纳入 git 追踪，在树莓派本地由构建脚本生成
- **新增** `scripts/release-frontend.sh` 脚本，供开发者在本机完成前端构建并将产物复制到 `release/frontend/`
- **移动** `build-on-pi.sh` → `scripts/build-on-pi.sh`
- **移动** `run-on-pi.sh` → `scripts/run-on-pi.sh`
- **移动** `tuanzi-photo.service` → `scripts/tuanzi-photo.service`
- **新增** 各 `package.json` 的 `version` 字段（统一初始化为 `0.1.0`）
- **新增** 根 `package.json` 的 `release` script，指向 `scripts/release-frontend.sh`
- **修改** `build-on-pi.sh`：移除前端构建步骤；backend 构建后将 `apps/backend/dist/` 内容移动到 `release/backend/`，并将 `apps/backend/.env` 复制到 `release/.env`
- **修改** `apps/backend/src/app.ts`，将生产环境静态文件路径从 `apps/frontend/dist` 改为 `release/frontend`
- **修改** `tuanzi-photo.service`：`WorkingDirectory` 改为 `release/` 目录，`ExecStart` 入口改为 `backend/app.js`
- **移除** `apps/backend/package.json` 的 `start` script（生产启动已由 systemd service 直接调用 node，不经过 pnpm）
- **修改** `.gitignore`，新增 `release/backend/` 排除规则

## Capabilities

### New Capabilities

- `frontend-release`: 本机构建前端并发布产物到 `release/frontend/` 的完整工作流，包括版本号写入
- `backend-release`: 树莓派构建 backend 后将产物整体移动到 `release/backend/`，统一产物出口，systemd service 直接从该目录启动

### Modified Capabilities

- （无需求级别变更）

## Impact

- `scripts/build-on-pi.sh`（原 `build-on-pi.sh`）：移除 `build_frontend`；backend 构建后将 `apps/backend/dist/` 移动到 `release/backend/`，并将 `apps/backend/.env` 复制到 `release/.env`
- `scripts/run-on-pi.sh`（原 `run-on-pi.sh`）：更新内部对 `build-on-pi.sh` 和 `tuanzi-photo.service` 的路径引用
- `scripts/tuanzi-photo.service`（原 `tuanzi-photo.service`）：`WorkingDirectory` 改为 `%h/tuanzi-photo/release`，`ExecStart` 改为 `backend/app.js`
- `apps/backend/src/app.ts`：静态文件根路径变更，影响生产环境前端托管
- `apps/backend/package.json`：移除 `start` script
- 根 `package.json`：`build:pi` 和 `run:pi` script 路径更新为 `scripts/` 前缀
- 各 `package.json`：新增 `version` 字段，不影响运行时行为
- `.gitignore`：新增 `release/backend/` 排除
- git 仓库：`release/frontend/` 被版本管理；`release/backend/` 本地生成，不追踪
