## 1. 共享类型

- [x] 1.1 新建 `packages/shared-types/battery.ts`，导出 `BatteryVO` interface（`percent`, `voltage`, `current_mA`, `power_W` 均为 number）
- [x] 1.2 在 `packages/shared-types/index.ts` 中添加 `export type { BatteryVO } from "./battery.js";`
- [x] 1.3 在 `packages/shared-types/package.json` 的 `exports` 中新增 `"./battery": "./battery.ts"` 入口，并将 `version` 从 `"0.1.0"` 升级为 `"0.2.0"`

## 2. Python 包装层与依赖

- [x] 2.1 新建 `apps/backend/driver/ups/setup.py`，声明 `install_requires=['smbus2']`，参照 `driver/waveshare/setup.py` 结构（name='waveshare-ups'）
- [x] 2.2 新建 `apps/backend/driver/ups/read_battery.py`，在文件顶部加 smbus 兼容 shim（try import smbus，except ImportError 则 import smbus2 as smbus 并注入 sys.modules['smbus']），然后 import INA219 类（不修改 INA219.py）
- [x] 2.3 实现一次性读取：`getBusVoltage_V()`、`getShuntVoltage_mV()`、`getCurrent_mA()`、`getPower_W()`
- [x] 2.4 按公式 `p = (bus_voltage - 3.0) / 1.2 * 100` 计算 percent，clamp 到 [0, 100]
- [x] 2.5 stdout 输出单行 JSON，exit 0；异常时写 stderr，exit 1
- [x] 2.6 修改 `scripts/build-backend.sh` 的 `install_driver_deps()` 函数：在安装 waveshare 之后，用相同模式（`pip3 install -e "${ups_driver_dir}" --quiet --disable-pip-version-check --break-system-packages`）安装 `release/backend/driver/ups`，同样做目录存在检查和 pip3 可用检查

## 3. 后端 Service

- [x] 3.1 新建 `apps/backend/src/services/battery.service.ts`，参照 `display.service.ts` 的 `runRenderProcess` 模式
- [x] 3.2 实现 `readBattery()` 函数：spawn `env.epd.pythonBin` 执行 `read_battery.py`，cwd 设为脚本目录
- [x] 3.3 设置 5000ms 超时（SIGTERM → 3s 后 SIGKILL），超时 reject 带说明的 Error
- [x] 3.4 exit code 0 时 parse stdout JSON 并返回 `BatteryVO`；非 0 时 reject 带 stderr 的 Error

## 4. 后端路由

- [x] 4.1 新建 `apps/backend/src/routes/battery.ts`，注册 `GET /battery` 路由（前缀 `/api/v1` 由 app.ts 提供）
- [x] 4.2 路由 handler 调用 `readBattery()`，成功返回 `ok(data)`，失败返回 `err(500, message)`
- [x] 4.3 在 `apps/backend/src/app.ts` 中 import 并注册 batteryRoutes（`prefix: "/api/v1"`）
- [x] 4.4 执行 `cd apps/backend && pnpm typecheck` 验证后端类型

## 5. 前端 Store

- [x] 5.1 新建 `apps/frontend/src/stores/battery.ts`，定义 Pinia store（state: `percent: number | null`）
- [x] 5.2 实现 `fetchBattery()` action：GET `/api/v1/battery`，成功时更新 `percent`，失败时静默（无 toast）
- [x] 5.3 实现 `startPolling()` action：立即调用一次 `fetchBattery()`，setInterval 10000ms 持续调用，返回清理函数

## 6. 前端组件

- [x] 6.1 修改 `apps/frontend/src/components/AppHeader.vue`：引入 `useBatteryStore`，在上传按钮左侧用 `v-if="batteryStore.percent !== null"` 渲染 `<UIcon name="i-lucide-battery-medium" />` + `{{ batteryStore.percent }}%`
- [x] 6.2 修改 `apps/frontend/src/components/MobileHeader.vue`：同 6.1 逻辑，样式适配紧凑 h-12 header
- [x] 6.3 修改 `apps/frontend/src/layouts/DesktopLayout.vue`：`onMounted` 调用 `batteryStore.startPolling()` 并保存清理函数，`onUnmounted` 调用清理
- [x] 6.4 修改 `apps/frontend/src/layouts/MobileLayout.vue`：同 6.3 逻辑
- [x] 6.5 执行 `cd apps/frontend && pnpm typecheck` 验证前端类型
