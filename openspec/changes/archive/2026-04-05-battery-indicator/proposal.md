## Why

树莓派 Zero 2W 配备了 UPS 模块（微雪 INA219），但目前 Web UI 无法反映设备的实时电量状态，用户无法判断设备是否接近断电，存在数据丢失风险。通过端到端实现电量读取与展示，让用户在操作界面中随时掌握设备电量。

## What Changes

- **新增** Python 包装脚本 `apps/backend/driver/ups/read_battery.py`，以一次性方式调用官方 INA219 类，stdout 输出 JSON 格式电量数据
- **新增** 共享类型 `packages/shared-types/battery.ts`，导出 `BatteryVO` interface
- **新增** 后端 service `apps/backend/src/services/battery.service.ts`，通过 child_process 调用 Python 脚本，5s 超时
- **新增** 后端路由 `GET /api/v1/battery`，返回 `ApiResponse<BatteryVO>`
- **新增** 前端 Pinia store `apps/frontend/src/stores/battery.ts`，持有电量状态，提供每 10s 轮询的 `startPolling()` action
- **修改** `AppHeader.vue` / `MobileHeader.vue`：接入 battery store，当电量数据可用时显示电量指示器
- **修改** `DesktopLayout.vue` / `MobileLayout.vue`：在 `onMounted` 启动轮询，`onUnmounted` 清理

## Capabilities

### New Capabilities

- `battery-api`: 后端读取 UPS INA219 传感器电量并通过 REST API 暴露，包含 Python 包装层和 Fastify 路由
- `battery-display`: 前端 store + 组件层，定时轮询 API、持有电量状态，并在 Header 中实时展示

### Modified Capabilities

（无需求层面的变更，仅实现层扩展）

## Impact

- **新文件**：`apps/backend/driver/ups/read_battery.py`、`apps/backend/src/services/battery.service.ts`、`apps/backend/src/routes/battery.ts`、`apps/frontend/src/stores/battery.ts`、`packages/shared-types/battery.ts`
- **修改文件**：`packages/shared-types/index.ts`、`packages/shared-types/package.json`、`apps/backend/src/app.ts`、`apps/frontend/src/components/AppHeader.vue`、`apps/frontend/src/components/MobileHeader.vue`、`apps/frontend/src/layouts/DesktopLayout.vue`、`apps/frontend/src/layouts/MobileLayout.vue`
- **依赖**：无新增 npm 依赖；Python 端依赖 `smbus`（树莓派系统已有）
- **运行时**：电量读取仅在树莓派硬件上可用，开发环境调用失败时 API 返回 500，前端静默降级（不显示电量）
