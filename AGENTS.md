# AGENTS.md

这个文件定义仓库根目录级别的规则，适用于整个 monorepo。更靠近目标目录的 `AGENTS.md` 优先级更高；如果子目录已有更具体约束，以子目录规则为准。

## 项目概述

这是一个运行在树莓派 Zero 2W（512MB RAM）上的 E6 6 色墨水屏电子相册项目。仓库采用 `pnpm` monorepo，前后端分离，并通过共享 TypeScript 类型包协作。

## 工作方式

- 默认使用中文沟通。
- 优先根据现有实现和脚本工作，不要凭经验假设目录、端口、构建流程或部署方式。
- 这是资源受限设备项目。做技术决策时优先考虑内存占用、构建成本、部署复杂度和运行稳定性。

## 仓库结构

```text
apps/frontend          Vue 3 + Vite 7 + vue-router/vite + @nuxt/ui v4
apps/backend           Fastify v5 + better-sqlite3 + sharp
packages/shared-types  仅存放共享 TypeScript 类型定义
scripts/               前后端构建、Pi 部署、systemd 服务脚本
release/               发布产物目录；`release/frontend` 和 `release/VERSION` 可能入库，`release/backend` 为构建产物
data/                  运行时数据目录，不是源码目录
design/                设计稿相关文件
openspec/              需求与变更规格
```

## Workspace 规则

- monorepo 由 `pnpm-workspace.yaml` 管理，包含 `apps/*` 和 `packages/*`。
- `apps/frontend/pnpm-workspace.yaml` 只用于局部 `ignoredBuiltDependencies` 配置，不是新的 workspace 根；不要在里面新增 package 范围。
- 安装依赖时，优先进入目标 workspace 目录执行。
- 如果必须在仓库根目录安装依赖，必须显式指定目标 workspace：

```bash
pnpm --filter frontend add <pkg>
pnpm --filter backend add <pkg>
pnpm --filter @tuanzi-photo/shared-types add -D <pkg>
```

- 不要临时创建 `shared/`、`common/` 之类的共享源码目录。共享内容统一放在 `packages/` 下。
- 不要把本该属于某个 workspace 的依赖装到仓库根目录。

## 共享包规则

- 共享类型定义统一放在 `packages/shared-types`。
- 引用共享类型时，统一使用包名导入，例如 `@tuanzi-photo/shared-types`。
- 不要通过 `../../../packages/...` 这类相对路径引用共享类型。
- `packages/shared-types` 必须保持为纯类型包，不要放运行时常量、函数、类。如果需要共享运行时代码，应新建独立 package。
- 新增或删除公开类型模块时，要同步更新 `packages/shared-types/package.json` 的 `exports`。

## 生成产物与禁止事项

- 不要手改生成产物或发布产物，除非任务明确要求：
  - `apps/frontend/src/route-map.d.ts`
  - `apps/frontend/dist/`
  - `apps/backend/dist/`
  - `release/backend/`
- `release/frontend/` 和 `release/VERSION` 由 `scripts/build-frontend.sh` 刷新；如果要调整前端发布内容，优先改脚本或源码，不要直接改发布产物。
- 如果任务涉及部署流程、systemd 或 Pi 启动行为，优先修改 `scripts/` 下脚本和服务模板，而不是直接改 `release/` 里的结果文件。

## 运行时数据与部署

- `data/` 是运行时状态目录，不是源码目录。不要提交运行时生成文件。
- 当前运行时目录至少包括：
  - `data/main/`
  - `data/uploads/`
  - `data/cache/`
  - `data/logs/`
- SQLite 主库路径固定为 `data/main/main.db`。
- 开发环境：前端运行在 `127.0.0.1:4011`，并将 `/api/*` 代理到后端 `127.0.0.1:4010`。
- 生产环境：当 `NODE_ENV=production` 时，由 Fastify 托管 `apps/frontend/dist/` 中的前端构建产物。
- 后端路径切换由 `apps/backend/src/paths.ts` 统一处理；不要在其他地方重复硬编码源码目录和发布目录判断。
- Pi 部署相关入口脚本：
  - `scripts/build-frontend.sh`：构建并刷新 `release/frontend/` 与 `release/VERSION`
  - `scripts/build-backend.sh`：构建后端、准备 `release/backend/`、复制 `.env`、部署生产依赖
  - `scripts/run-on-pi.sh`：安装/更新 systemd 服务并重启
- `scripts/tuanzi-photo.service` 中的 `ExecStart` 固定使用 `--max-old-space-size=128`。如果没有明确需求，不要随意提高运行时内存上限。

## 修改原则

- 改动应尽量落在所属 workspace 内；只有在“确实需要跨端共享”时才修改 `packages/shared-types`。
- 共享类型变更默认视为跨前后端改动，要同时检查两个应用是否仍然成立。
- 涉及树莓派部署、驱动、图片处理、缓存、systemd 或发布流程的改动时，要先确认是否会影响低内存场景，而不是只看本地开发环境是否可用。
- 根目录 `package.json` 只提供仓库级脚本，不要把 workspace 私有开发命令堆到根脚本里。

## 常用命令

```bash
# 仓库根目录
pnpm install
pnpm format
pnpm build:frontend
pnpm build:backend
pnpm run:pi

# 前端 workspace
cd apps/frontend && pnpm dev
cd apps/frontend && pnpm build
cd apps/frontend && pnpm build:pi
cd apps/frontend && pnpm typecheck

# 后端 workspace
cd apps/backend && pnpm dev
cd apps/backend && pnpm build
cd apps/backend && pnpm build:pi
cd apps/backend && pnpm typecheck
```

## 验证规则

- 修改前端代码后，按 `apps/frontend/AGENTS.md` 的要求执行验证。
- 修改后端代码后，按 `apps/backend/AGENTS.md` 的要求执行验证。
- 修改 `packages/shared-types` 后，要同时验证它依赖的前后端应用。
- 修改根目录脚本、workspace 配置、发布流程或部署脚本时，至少执行受影响一侧的构建或类型检查；如果影响发布行为，优先执行对应的构建脚本而不是只看静态代码。
- 当改动跨多个 workspace 或涉及共享文件时，在仓库根目录执行 `pnpm format`。
- 注意：根目录 `pnpm format` 只会格式化 `apps/**/*.{ts,vue,json}` 和 `packages/**/*.{ts,json}`，不会处理 shell、Markdown 或 `scripts/` 下文件；这些文件需要手动保持风格一致。

## Commit Message 规范

- 提交信息采用 Conventional Commits 风格，基本格式为：`<type>(<scope>): <summary>`。
- `scope` 可选；当改动明确落在某个 workspace 或模块时，建议填写，例如 `frontend`、`backend`、`shared-types`、`scripts`。
- `summary` 使用简洁明确的中文或英文祈使句，聚焦“这次提交做了什么”，不要写空泛描述，也不要以句号结尾。
- 优先使用以下前缀：
  - `feat`: 新功能，对应你提到的 `feature`
  - `fix`: 缺陷修复
  - `chore`: 杂项维护、脚手架、依赖或非业务改动
  - `docs`: 文档变更
  - `refactor`: 不改变外部行为的重构
  - `test`: 测试新增或调整
  - `build`: 构建流程、打包配置、依赖构建相关改动
  - `ci`: CI/CD 配置改动
  - `perf`: 性能优化
  - `revert`: 回滚已有提交
- 如果改动包含破坏性变更，使用 `!` 或在正文中明确标注 `BREAKING CHANGE:`。

```text
feat(frontend): 增加相册筛选面板
fix(backend): 修复墨水屏刷新锁重复触发问题
chore: 更新 pnpm workspace 配置
docs: 补充树莓派部署说明
build(scripts): 调整 Pi 部署脚本
```
