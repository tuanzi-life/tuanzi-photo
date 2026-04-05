## ADDED Requirements

### Requirement: dist 目录包含正确的 package.json

`pnpm build` 完成后，`dist/package.json` SHALL 存在，且其 `imports` 字段 SHALL 将 `#paths` 映射到 `./paths.js`（不含 `src/` 前缀），以确保生产环境 Node.js 能正确解析 subpath import。

#### Scenario: dist/package.json 由构建步骤生成

- **WHEN** 执行 `pnpm build` 或 `pnpm build:pi`
- **THEN** `dist/package.json` 存在，`imports["#paths"]` 值为 `"./paths.js"`，`type` 为 `"module"`，包含 `dependencies` 字段，不包含 `scripts` 或 `devDependencies` 字段

#### Scenario: 生产环境 #paths 解析成功

- **WHEN** 生产环境从 `release/backend/app.js` 启动
- **THEN** Node.js 通过 `release/backend/package.json` 将 `#paths` 解析为 `release/backend/paths.js`，该文件存在，模块加载成功，不抛出 `ERR_MODULE_NOT_FOUND`

## MODIFIED Requirements

### Requirement: 生产环境驱动路径正确

系统 SHALL 在生产环境下将 `renderScriptPath` 解析到 `release/backend/driver/waveshare/render_photo.py`；`driver/` 目录 SHALL 由 `postbuild.mjs` 在构建阶段复制到 `dist/driver/`，`build-backend.sh` 的 `promote_backend` SHALL 不再负责复制 `package.json`。

#### Scenario: Python 渲染脚本路径可达

- **WHEN** 生产环境启动并调用 `renderPhoto()`
- **THEN** `renderScriptPath` 指向 `release/backend/driver/waveshare/render_photo.py`，`cwd` 为该脚本所在目录，Python 进程可正常启动
