## Context

后端采用 `tsc`（NodeNext 模式）编译，`rootDir: src`，`outDir: dist`。TypeScript 在 NodeNext 模式下**不转换** subpath import（`#paths`）——该字符串原样保留在编译后的 `.js` 文件中，由 Node.js 运行时通过 `package.json` 的 `imports` 字段解析。

当前 `package.json` 的 `imports` 字段为开发路径：`"#paths": "./src/paths.js"`。生产环境将 `dist/` 移动后，`release/backend/package.json` 仍是该值，Node.js 解析出 `release/backend/src/paths.js`（不存在）→ `ERR_MODULE_NOT_FOUND`。

`node_modules/` 通过 `mv` 从 `apps/backend/` 迁移到 `release/backend/`，pnpm 的符号链接结构在跨目录移动后依赖文件系统行为而非 pnpm 官方保证。

Fastify 应用目前没有 SIGTERM 处理器。systemd 默认发送 SIGTERM → 等待 `TimeoutStopSec`（默认 90s）→ SIGKILL，期间若刷新任务未完成则 Python 子进程和 Fastify 请求都会被强制终止。

## Goals / Non-Goals

**Goals:**

- `pnpm build` 结束后，`dist/` 自带正确的 `package.json`，无需外部修补
- shell 脚本只做部署编排，不修复 build artifact
- `#paths` subpath import 在生产环境可正常解析
- `pnpm deploy` 管理生产依赖，不依赖 `mv node_modules`
- 收到 SIGTERM/SIGINT 后等待当前请求处理完成再退出

**Non-Goals:**

- 不引入 tsup/esbuild 替换 tsc
- 不改变部署目录结构（`release/backend/`）
- 不为墨水屏刷新任务实现请求队列或恢复机制

## Decisions

### 决策 1：在 postbuild 脚本中生成 dist/package.json，而非修改源 package.json 的 imports

**选择**：构建时生成 `dist/package.json`，其 `imports` 字段自动将 `./src/` 前缀替换为 `./`。

**备选方案**：

- 修改源 `package.json`，将 `"#paths": "./src/paths.js"` 改为 `"#paths": "./paths.js"` → 会破坏 `tsx` 开发模式（`tsx` 用 Node.js 原生 `imports` 解析，`./paths.js` 在 `apps/backend/` 下不存在）
- 使用 Node.js 条件导出（`"development"` / `"default"`）→ `"development"` 不是 Node.js 内置条件，需要 `--conditions` flag，不适合 `tsx` 开发场景

**理由**：开发与生产的路径布局天然不同，生成独立的 `dist/package.json` 是最干净的分离方式，且路径映射规则（去掉 `./src/` 前缀）可以自动推导，无需硬编码。

### 决策 2：合并 copy-driver.mjs 与新逻辑到单个 postbuild.mjs

**选择**：删除 `copy-driver.mjs`，新建 `postbuild.mjs` 统一承担所有 postbuild 职责。

**理由**：减少脚本数量，使 `pnpm build` 的 postbuild 阶段有单一入口，降低"改了一个忘了另一个"的风险。命名 `postbuild` 也与 npm 生命周期语义一致（即使目前是显式调用）。

### 决策 3：dist/package.json 只保留运行时必需字段

生成的 `dist/package.json` 保留 `name`、`version`、`type`、`imports`、`dependencies`，去掉 `scripts`、`devDependencies`。

**理由**：`dist/` 是部署单元，不是开发工作区。精简的 `package.json` 避免意外通过 `scripts` 触发不预期行为。

### 决策 4：用 pnpm deploy 替代 mv node_modules

**选择**：在 `build-backend.sh` 的 `promote_backend` 阶段之后，执行 `pnpm deploy --filter backend --prod release/backend`，由 pnpm 官方机制将生产依赖写入部署目录。

**备选方案**：

- 继续 `mv node_modules` → 依赖文件系统 mv 语义，pnpm 符号链接结构不受官方保证；且移动后源目录缺少 `node_modules`，无法再次构建
- `npm ci --omit=dev` 在部署目录安装 → 混用 npm/pnpm，破坏 lockfile 一致性

**理由**：`pnpm deploy` 是 pnpm monorepo 的官方部署命令，它在目标目录创建扁平化的生产依赖（无符号链接），与 lockfile 完全一致，并自动处理 workspace 内部依赖。

**对 build-backend.sh 的影响**：

- `install_dependencies` 步骤仍需在 monorepo 根执行 `pnpm install`（确保 lockfile 一致），但仅用于构建时（tsc、tsx 等 devDependencies）
- 新增 `deploy_backend` 步骤：执行 `pnpm deploy` 将生产依赖写入 `release/backend/`
- `run-on-pi.sh` 中的 `move_node_modules` 函数整体删除

### 决策 5：graceful shutdown 在 app.ts 入口注册，不在 plugin 层

**选择**：在 `src/app.ts` 的 `startServer()` 函数中注册 `process.on('SIGTERM', ...)` 和 `process.on('SIGINT', ...)`，调用 `fastify.close()`。

**理由**：shutdown 是进程级行为，属于入口逻辑，不属于任何业务 plugin。`fastify.close()` 会触发 `onClose` hook，等待所有连接处理完毕后 resolve，是 Fastify 官方推荐方式。

**对 Python 子进程的处理**：`fastify.close()` 等待 HTTP 连接关闭，但不管理子进程生命周期。对于墨水屏刷新的 Python 子进程，收到 SIGTERM 后让其自然完成（不强制 kill）；若 systemd 的 `TimeoutStopSec` 超时，由操作系统发 SIGKILL 兜底。当前 `TimeoutStopSec` 未设置（默认 90s），墨水屏刷新超时上限为 `EPD_RENDER_TIMEOUT_MS`（默认 180s），**需将 systemd 的 `TimeoutStopSec` 设置为略大于 `EPD_RENDER_TIMEOUT_MS` 的值**，例如 `200s`。

## Risks / Trade-offs

- **[风险] imports 路径映射规则依赖 `./src/` 前缀约定** → 当前只有一个 `#paths`，风险极低；未来新增 subpath import 时需同步更新 `postbuild.mjs`
- **[风险] promote_backend 删除 cp 行后，如果 postbuild 未正常运行，dist/ 将缺少 package.json** → `&&` 链确保 postbuild 失败时构建整体失败，不会产生不完整的 dist/
- **[风险] pnpm deploy 首次在 Pi 上运行需要下载依赖** → Pi 网络较慢；可通过 `SKIP_PNPM_INSTALL` 环境变量跳过（现有机制），但 deploy 步骤本身不可跳过
- **[风险] graceful shutdown 期间 SIGTERM 到达时刷新任务可能已进行到 Python 渲染阶段** → Python 子进程独立运行，`fastify.close()` 不强制终止它；systemd 需配置足够的 `TimeoutStopSec`

## Migration Plan

1. 执行 `pnpm build` 验证 `dist/package.json` 正确生成
2. 在 Pi 上执行 `bash scripts/run-on-pi.sh`（pnpm deploy 会重新安装生产依赖到 `release/backend/node_modules/`）
3. 验证服务启动后 `systemctl status tuanzi-photo` 正常，`journalctl` 中出现 Fastify 监听日志
4. 执行 `sudo systemctl stop tuanzi-photo`，确认日志中出现 graceful shutdown 信息，进程正常退出
5. 无需回滚策略——git revert 可恢复所有改动

## Open Questions

无。
