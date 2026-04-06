## ADDED Requirements

### Requirement: 集中路径模块存在

系统 SHALL 提供 `src/paths.ts` 模块，导出 `APP_ROOT`、`PROJECT_ROOT` 及 `paths` 对象（含 `dbFile`、`schemaFile`、`driverDir`、`cacheDir` 四个常量）。

#### Scenario: 开发环境路径解析正确

- **WHEN** 在开发环境（`NODE_ENV` 非 `production`）导入 `paths.ts`
- **THEN** `APP_ROOT` 指向 `apps/backend/`，`PROJECT_ROOT` 指向 monorepo 根，`paths.dbFile` 为 `<monorepo_root>/data/main/main.db`，`paths.schemaFile` 为 `apps/backend/sql/schema.sql`，`paths.driverDir` 为 `apps/backend/driver/`，`paths.cacheDir` 为 `<monorepo_root>/data/cache/`

#### Scenario: 生产环境路径解析正确

- **WHEN** 在生产环境（`NODE_ENV=production`）从 `release/backend/` 运行
- **THEN** `APP_ROOT` 指向 `release/backend/`，`PROJECT_ROOT` 指向 `tuanzi-photo/`，`paths.dbFile` 为 `tuanzi-photo/data/main/main.db`，`paths.schemaFile` 为 `release/backend/sql/schema.sql`，`paths.driverDir` 为 `release/backend/driver/`，`paths.cacheDir` 为 `tuanzi-photo/data/cache/`

### Requirement: 路径 NODE_ENV 判断集中

系统 SHALL 仅在 `src/paths.ts` 中出现针对路径计算的 `NODE_ENV` 条件判断，其他模块 SHALL 通过导入 `paths.*` 使用路径常量。

#### Scenario: db.ts 不含路径 NODE_ENV 判断

- **WHEN** 审查 `src/plugins/db.ts` 源码
- **THEN** 文件中不含 `NODE_ENV` 路径条件，`DB_PATH` 和 `SCHEMA_PATH` 均通过导入 `paths` 获取

#### Scenario: display.service.ts 不含路径 NODE_ENV 判断

- **WHEN** 审查 `src/services/display.service.ts` 源码
- **THEN** 文件中不含 `backendRoot`、`driverBase` 的本地计算，驱动路径和缓存路径均通过导入 `paths` 获取

### Requirement: 生产环境驱动路径正确

系统 SHALL 在生产环境下将 `renderScriptPath` 解析到 `release/backend/driver/waveshare/render_photo.py`。

#### Scenario: Python 渲染脚本路径可达

- **WHEN** 生产环境启动并调用 `renderPhoto()`
- **THEN** `renderScriptPath` 指向 `release/backend/driver/waveshare/render_photo.py`，`cwd` 为该脚本所在目录，Python 进程可正常启动

### Requirement: 生产环境缓存路径正确

系统 SHALL 在生产环境下将图片缓存写入 `tuanzi-photo/data/cache/`，而非 `~pi/data/cache/`。

#### Scenario: 缓存目录创建路径正确

- **WHEN** 生产环境下 `renderPhoto()` 被调用
- **THEN** `mkdir` 在 `tuanzi-photo/data/cache/` 下创建目录，下载的图片写入该目录
