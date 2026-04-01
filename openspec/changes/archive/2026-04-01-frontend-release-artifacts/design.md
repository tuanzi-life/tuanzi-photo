## Context

树莓派 Zero 2W（512MB RAM）是本项目唯一的生产运行环境。后端依赖 `better-sqlite3`（原生 Node.js 插件），必须在目标机器上编译，因此 backend 构建不可迁移到本机。前端是纯静态产物，构建工具 Vite 对内存要求较高，与树莓派内存上限存在根本冲突。

当前状态：

- 前端：`build-on-pi.sh` 通过 `--max-old-space-size=288` 限制 heap，勉强通过，不稳定
- 后端：`tsc` 输出到 `apps/backend/dist/`，`copy-driver.mjs` 将 `driver/` 和 `sql/` 复制进去，`dist/` 是自包含产物
- 服务启动：`tuanzi-photo.service` 以 `WorkingDirectory=%h/tuanzi-photo/apps/backend`、`ExecStart=node dist/app.js` 直接启动，不经过 `pnpm start`

目标：将所有运行时产物统一收敛到 `release/` 目录，源码目录不再包含可部署产物。

## Goals / Non-Goals

**Goals:**

- 将前端构建完全迁移到开发者本机，彻底消除树莓派 OOM 风险
- backend 产物在树莓派构建后移动到 `release/backend/`，与源码解耦
- `release/frontend/` 通过 git 追踪，树莓派通过 `git pull` 获取最新前端
- `tuanzi-photo.service` 从 `backend/app.js` 启动，`WorkingDirectory` 指向 `release/`
- 保持部署流程简洁，不引入 CI/CD 或额外制品存储

**Non-Goals:**

- 不引入 GitHub Actions / CI 自动化
- 不修改 `tsconfig.json` 的 `outDir`（backend 仍先编译到 `apps/backend/dist/`，再由脚本移动）
- 不修改前端构建配置（vite.config 等）
- 不改变 `copy-driver.mjs` 的内部逻辑

## Decisions

### 决策 1：backend 产物在构建脚本层面移动，不修改 tsconfig outDir

**方案 A（采用）**：`build-on-pi.sh` 构建后执行 `rm -rf release/backend && mv apps/backend/dist release/backend`，tsconfig 不动。

**方案 B（排除）**：修改 `tsconfig.json` 的 `outDir` 为 `../../release/backend`，tsc 直接输出到目标位置。

选择方案 A：

- `copy-driver.mjs` 中对 `dist/` 的路径假设不受影响
- `dev` 模式（tsx）不走 tsc，不受影响
- 迁移只需改构建脚本一处，侵入面最小

### 决策 2：移除 `apps/backend/package.json` 的 `start` script

生产启动由 `tuanzi-photo.service` 的 `ExecStart` 直接调用 `node`，从未经过 `pnpm start`。保留 `start` script 只会造成误解（路径已失效）。直接移除，让 service 文件成为唯一的启动入口定义。

### 决策 3：`tuanzi-photo.service` WorkingDirectory 改为 release 目录

原 `WorkingDirectory=%h/tuanzi-photo/apps/backend`，改为 `%h/tuanzi-photo/release`。

`ExecStart` 对应改为 `node --max-old-space-size=128 backend/app.js`。

`app.ts` 中 `__dirname` 将是 `<repo-root>/release/backend/`，静态文件路径计算：

- `release/frontend/` 相对于 `release/backend/` 是 `../frontend`
- 即 `join(__dirname, "../frontend")`（路径不变）

### 决策 4：`release/frontend/` 纳入 git 追踪，`release/backend/` 不追踪

- 前端：本机构建，通过 git 分发到树莓派，必须追踪
- 后端：树莓派本地构建，每次 `build-on-pi.sh` 都会重新生成，无需追踪
- `.gitignore` 新增 `release/backend/`；同时新增 `release/frontend/.gitkeep` 保证空目录可追踪

### 决策 5：`release-frontend.sh` 不自动执行 git 操作

只负责构建和复制，最后打印提示让开发者手动 `git add && git commit && git push`。保留人工确认，避免意外提交到错误分支。

## Risks / Trade-offs

- **[风险] git 仓库体积增长**：每次前端发布都将构建产物提交到 git。→ 当前规模可接受；未来可迁移到 git lfs。
- **[风险] 忘记运行 release 脚本就推送**：树莓派拿到的是旧前端产物。→ 脚本末尾提示信息明确提醒；属于手动流程的固有局限。
- **[Trade-off] backend 构建后 mv 而非 cp**：`apps/backend/dist/` 在 mv 后不复存在，若需重新启动开发服务需重新构建。→ `dev` 模式用 tsx 不依赖 `dist/`，影响可接受。

## Migration Plan

1. 更新 `.gitignore`、创建 `release/frontend/.gitkeep`
2. 新增 `release-frontend.sh`，更新各 `package.json`
3. 修改 `build-on-pi.sh`（移除前端构建，添加 backend mv 步骤）
4. 修改 `apps/backend/src/app.ts`（静态文件路径改为 `../frontend`）
5. 修改 `tuanzi-photo.service`（WorkingDirectory + ExecStart）
6. 移除 `apps/backend/package.json` 的 `start` script
7. 在本机执行 `pnpm release` 生成初始前端产物，提交 `release/frontend/`
8. 树莓派执行 `git pull && bash run-on-pi.sh`，验证服务正常启动

**回滚**：将 `tuanzi-photo.service` 改回原路径，`apps/backend/src/app.ts` 改回原路径，重新 `build-on-pi.sh`。

## Open Questions

- 无
