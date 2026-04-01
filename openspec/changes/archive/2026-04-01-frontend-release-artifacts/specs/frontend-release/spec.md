## ADDED Requirements

### Requirement: 本机构建前端并发布产物

开发者 SHALL 能通过执行 `scripts/release-frontend.sh`（或 `pnpm release`）在本机完成前端构建，并将产物自动复制到 `release/frontend/` 目录。

#### Scenario: 执行发布脚本成功

- **WHEN** 开发者在项目根目录执行 `pnpm release`（或 `bash scripts/release-frontend.sh`）
- **THEN** 脚本依次执行：`pnpm --filter frontend build`、清空 `release/frontend/`、复制 `apps/frontend/dist/` 内容到 `release/frontend/`、写入 `release/VERSION`，最终打印提示信息

#### Scenario: 前端构建失败时脚本中止

- **WHEN** `pnpm --filter frontend build` 返回非零退出码
- **THEN** 脚本立即中止，不执行后续的复制和写入步骤

### Requirement: 版本号写入 release/VERSION

`release-frontend.sh` SHALL 从根 `package.json` 的 `version` 字段读取版本号，并将其写入 `release/VERSION` 文件。`release/VERSION` 纳入 git 追踪，与前端产物一同随代码推送。

#### Scenario: VERSION 文件内容正确

- **WHEN** 发布脚本执行完成
- **THEN** `release/VERSION` 文件存在，内容为根 `package.json` 中的 `version` 字段值（如 `0.1.0`）

#### Scenario: VERSION 文件可被 git 追踪

- **WHEN** 执行 `git status release/VERSION`
- **THEN** 文件显示为已追踪状态，不被任何 `.gitignore` 规则排除

### Requirement: 前端产物目录纳入 git 追踪

`release/frontend/` 目录 SHALL 被 git 追踪，不在 `.gitignore` 中排除，使得前端产物可通过 `git pull` 分发到树莓派。

#### Scenario: 前端产物可被 git 追踪

- **WHEN** 执行 `git status release/frontend/`
- **THEN** 目录下的文件显示为已追踪状态，不被任何 `.gitignore` 规则排除

#### Scenario: apps/frontend/dist 仍被忽略

- **WHEN** 执行 `git status apps/frontend/dist/`
- **THEN** 该目录仍被 `.gitignore` 排除，不出现在 git 追踪列表中

### Requirement: backend 产物目录不被 git 追踪

`release/backend/` 目录 SHALL 被 `.gitignore` 排除，不纳入版本管理。

#### Scenario: backend 产物不出现在 git 追踪中

- **WHEN** 执行 `git status release/backend/`
- **THEN** 该目录被 `.gitignore` 排除，不出现在 git 追踪列表中

### Requirement: 树莓派构建不包含前端构建步骤

`scripts/build-on-pi.sh` SHALL 不再执行前端构建，仅执行 backend 构建，并在构建完成后将 `apps/backend/dist/` 移动到 `release/backend/`，同时将 `apps/backend/.env` 复制到 `release/.env`。

#### Scenario: 树莓派执行构建脚本

- **WHEN** 在树莓派上执行 `bash scripts/build-on-pi.sh`
- **THEN** 脚本仅安装依赖、构建 backend，随后将 `apps/backend/dist/` 移动到 `release/backend/`，不调用任何前端构建命令

#### Scenario: backend 产物移动到 release 目录

- **WHEN** `scripts/build-on-pi.sh` 执行完成
- **THEN** `release/backend/app.js` 存在，`apps/backend/dist/` 不存在

#### Scenario: .env 复制到 release 目录

- **WHEN** `scripts/build-on-pi.sh` 执行完成且 `apps/backend/.env` 存在
- **THEN** `release/.env` 存在，内容与 `apps/backend/.env` 一致，`apps/backend/.env` 原文件保留不变

### Requirement: 生产环境从 release 目录托管所有产物

后端 Fastify 服务在 `NODE_ENV=production` 时 SHALL 从 `release/frontend/` 目录托管静态文件。`app.ts` 中的路径基于 `release/backend/` 作为 `__dirname` 计算，静态文件路径为 `join(__dirname, "../frontend")`。

#### Scenario: 生产环境访问前端页面

- **WHEN** `NODE_ENV=production`，客户端请求 `/`
- **THEN** Fastify 返回 `release/frontend/index.html` 的内容

#### Scenario: SPA fallback 正常工作

- **WHEN** `NODE_ENV=production`，客户端请求一个不存在的前端路由
- **THEN** Fastify 返回 `release/frontend/index.html`，由前端路由处理

### Requirement: systemd service 从 release 目录启动

`tuanzi-photo.service` SHALL 将 `WorkingDirectory` 设为 `%h/tuanzi-photo/release`，`ExecStart` 直接调用 `node --max-old-space-size=128 backend/app.js`。

#### Scenario: systemd service 正常启动

- **WHEN** 执行 `systemctl start tuanzi-photo.service`
- **THEN** 服务以 `release/` 目录为工作目录，从 `backend/app.js` 启动，进程正常运行

### Requirement: 移除 backend 的 start script

`apps/backend/package.json` SHALL 不包含 `start` script，生产启动入口唯一由 `tuanzi-photo.service` 定义。

#### Scenario: backend package.json 不含 start 脚本

- **WHEN** 读取 `apps/backend/package.json`
- **THEN** `scripts` 对象中不存在 `start` 字段

### Requirement: 各 package.json 包含版本号

所有 workspace 的 `package.json` SHALL 包含 `version` 字段，初始值为 `0.1.0`。

#### Scenario: 各 package.json 包含版本号

- **WHEN** 读取根 `package.json`、`apps/frontend/package.json`、`apps/backend/package.json`、`packages/shared-types/package.json`
- **THEN** 每个文件均存在 `"version": "0.1.0"` 字段
