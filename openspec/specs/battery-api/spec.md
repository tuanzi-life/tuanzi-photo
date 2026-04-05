## ADDED Requirements

### Requirement: Python wrapper reads INA219 once and outputs JSON

系统 SHALL 提供 `driver/ups/read_battery.py` 脚本，该脚本通过 `import INA219` 复用官方类，一次性读取传感器数据后输出单行 JSON 至 stdout，然后以 exit code 0 退出。不得修改 `INA219.py`。

#### Scenario: 正常读取成功

- **WHEN** 在树莓派上执行 `python3 read_battery.py`
- **THEN** stdout 输出包含 `percent`、`voltage`、`current_mA`、`power_W` 字段的单行 JSON，process exit code 为 0

#### Scenario: 硬件不可用时

- **WHEN** 无法连接 INA219（如 smbus 初始化失败）
- **THEN** stderr 输出错误信息，stdout 无输出，process exit code 为非 0

### Requirement: 电量百分比按锂电公式计算并 clamp

系统 SHALL 使用公式 `p = (bus_voltage - 3.0) / 1.2 * 100` 计算电量百分比，并将结果 clamp 到 `[0, 100]` 范围。

#### Scenario: 正常电压范围内

- **WHEN** bus_voltage 为 3.6V
- **THEN** percent 输出为 50.0

#### Scenario: 电压低于 3V（过放保护触发后）

- **WHEN** bus_voltage 低于 3.0V
- **THEN** percent 输出为 0，不出现负数

#### Scenario: 电压高于 4.2V（充满或异常）

- **WHEN** bus_voltage 高于 4.2V
- **THEN** percent 输出为 100，不超过上限

### Requirement: 后端 battery service 通过 child_process 调用脚本

系统 SHALL 提供 `battery.service.ts`，使用 `child_process.spawn` 调用 `read_battery.py`，超时时间为 5000ms。成功时解析 stdout JSON 返回 `BatteryVO`，超时或 exit code 非 0 时抛出 Error。

#### Scenario: Python 脚本成功返回

- **WHEN** `readBattery()` 被调用且 Python 脚本正常退出
- **THEN** 返回包含所有字段的 `BatteryVO` 对象

#### Scenario: 超时处理

- **WHEN** Python 脚本在 5000ms 内未退出
- **THEN** 发送 SIGTERM 终止进程，并 reject 带有超时信息的 Error

#### Scenario: 脚本退出码非 0

- **WHEN** Python 脚本以非 0 exit code 退出
- **THEN** reject 带有 stderr 内容的 Error

### Requirement: GET /api/v1/battery 路由返回电量数据

系统 SHALL 提供 `GET /api/v1/battery` 端点，调用 battery service 并返回 `ApiResponse<BatteryVO>`。读取失败时返回 HTTP 200 with `code: 500`（遵循现有统一错误格式）。

#### Scenario: 成功获取电量

- **WHEN** 客户端 GET /api/v1/battery 且硬件可用
- **THEN** 返回 `{ code: 0, message: "ok", data: { percent, voltage, current_mA, power_W } }`

#### Scenario: 硬件不可用或读取失败

- **WHEN** 客户端 GET /api/v1/battery 且脚本执行失败
- **THEN** 返回 `{ code: 500, message: "...", data: null }` 格式的错误响应

### Requirement: BatteryVO 共享类型

系统 SHALL 在 `packages/shared-types/battery.ts` 中定义并导出 `BatteryVO` interface，包含 `percent: number`、`voltage: number`、`current_mA: number`、`power_W: number` 字段，并通过 `index.ts` 和 `package.json exports` 对外暴露。

#### Scenario: 前后端均可导入

- **WHEN** 前端或后端代码 `import type { BatteryVO } from "@tuanzi-photo/shared-types"`
- **THEN** 类型检查通过，字段类型正确
