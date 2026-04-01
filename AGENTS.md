# AGENTS.md

这个文件定义了仓库根目录级别的规则，适用于在本 monorepo 中工作的 Coding Agent。更具体的约束应写在更靠近代码目录的 `AGENTS.md` 中。

## 项目概述

这是一个运行在树莓派 Zero 2W（512MB RAM）上的 E6 6 色墨水屏电子相册项目。仓库采用 `pnpm` monorepo，前后端分离，并通过共享 TypeScript 类型包协作。

## 仓库结构

```text
apps/frontend         Vue 3 + Vite + @nuxt/ui v4
apps/backend          Fastify v5 + better-sqlite3 + sharp
packages/shared-types 仅存放共享 TypeScript 类型定义
data/                 运行时数据，不提交到版本库（db/、uploads/、cache/、logs/）
```

## Workspace 规则

- monorepo 由 `pnpm-workspace.yaml` 管理，包含 `apps/*` 和 `packages/*`。
- 安装依赖时，优先进入目标 workspace 目录执行。
- 如果必须在仓库根目录安装依赖，必须显式指定目标 workspace：

```bash
pnpm --filter frontend add <pkg>
pnpm --filter backend add <pkg>
```

- 不要临时创建 `shared/` 之类的共享目录。共享代码统一放在 `packages/` 下。

## 共享包规则

- 共享类型定义统一放在 `packages/shared-types`。
- 引用共享类型时，统一使用包名导入，例如 `@tuanzi-photo/shared-types`。
- 不要通过 `../../../packages/...` 这类相对路径引用共享类型。
- `packages/shared-types` 必须保持为纯类型包，不要放运行时常量、函数、类。如果需要共享运行时代码，应新建独立 package。

## 运行时数据与部署

- `data/` 是运行时状态目录，不是源码目录。不要提交 `data/` 下生成的文件。
- 开发环境：前端运行在 `127.0.0.1:4011`，并将 `/api/*` 代理到后端 `127.0.0.1:4010`。
- 生产环境：当 `NODE_ENV=production` 时，由 Fastify 托管 `apps/frontend/dist/` 中的前端构建产物。

## 常用命令

```bash
# 仓库根目录
pnpm install
pnpm format

# 前端 workspace
cd apps/frontend && pnpm dev
cd apps/frontend && pnpm build
cd apps/frontend && pnpm typecheck

# 后端 workspace
cd apps/backend && pnpm dev
cd apps/backend && pnpm build
cd apps/backend && pnpm typecheck
cd apps/backend && pnpm start
```

## 验证规则

- 修改前端代码后，按 `apps/frontend/AGENTS.md` 的要求执行验证。
- 修改后端代码后，按 `apps/backend/AGENTS.md` 的要求执行验证。
- 修改 `packages/shared-types` 后，要同时验证它依赖的前后端应用。
- 当改动跨多个 workspace 或涉及共享文件时，在仓库根目录执行 `pnpm format`。

## Commit Message 规范

- 提交信息采用 Conventional Commits 风格，基本格式为：`<type>(<scope>): <summary>`。
- `scope` 可选；当改动明确落在某个 workspace 或模块时，建议填写，例如 `frontend`、`backend`、`shared-types`。
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
```
