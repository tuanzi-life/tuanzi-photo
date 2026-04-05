## ADDED Requirements

### Requirement: Python wrapper samples INA219 and outputs JSON

系统 SHALL 提供 `driver/ups/read_battery.py` 脚本，该脚本通过 `import INA219` 复用 UPS 驱动，并对电压、电流、功率进行多次采样后输出单行 JSON 至 stdout，然后以 exit code 0 退出。为保证负数电流和分流电压解析正确，系统 MAY 修正 `INA219.py` 中的 16 位有符号数转换逻辑。

#### Scenario: 正常读取成功

- **WHEN** 在树莓派上执行 `python3 read_battery.py`
- **THEN** stdout 输出包含 `percent`、`voltage`、`current_mA`、`power_W`、`status` 字段的单行 JSON，process exit code 为 0

#### Scenario: 硬件不可用时

- **WHEN** 无法连接 INA219（如 smbus 初始化失败）
- **THEN** stderr 输出错误信息，stdout 无输出，process exit code 为非 0

### Requirement: 电量百分比按单节锂电分段曲线估算并输出整数

系统 SHALL 使用更接近电池侧的估算电压 `bus_voltage + shunt_voltage`，按单节锂电分段曲线进行插值计算，并将结果 clamp 到 `[0, 100]` 范围后输出为整数百分比。

#### Scenario: 高电压区间

- **WHEN** 电池侧估算电压约为 4.11V
- **THEN** percent 输出为高电量整数，且接近满电但不必固定等于 100

#### Scenario: 电压低于最低分段

- **WHEN** 电池侧估算电压低于 3.0V
- **THEN** percent 输出为 0，不出现负数

#### Scenario: 电压高于最高分段

- **WHEN** 电池侧估算电压高于 4.15V
- **THEN** percent 输出为 100，不超过上限

### Requirement: 电池状态由电流阈值和满电电压推断

系统 SHALL 根据 `current_mA` 与静止阈值推断 `charging`、`discharging`、`idle` 状态；当电流处于静止区间且电压达到满电阈值时，返回 `full`。

#### Scenario: 电流明显为负且配置为负电流表示充电

- **WHEN** `current_mA` 小于等于负阈值
- **THEN** `status` 输出为 `charging`

#### Scenario: 电流接近 0 且未达到满电阈值

- **WHEN** `current_mA` 落在静止阈值内，且电压低于满电阈值
- **THEN** `status` 输出为 `idle`

#### Scenario: 电流接近 0 且达到满电阈值

- **WHEN** `current_mA` 落在静止阈值内，且电压达到满电阈值
- **THEN** `status` 输出为 `full`

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
- **THEN** 返回 `{ code: 0, message: "ok", data: { percent, voltage, current_mA, power_W, status } }`

#### Scenario: 硬件不可用或读取失败

- **WHEN** 客户端 GET /api/v1/battery 且脚本执行失败
- **THEN** 返回 `{ code: 500, message: "...", data: null }` 格式的错误响应

### Requirement: BatteryVO 共享类型

系统 SHALL 在 `packages/shared-types/battery.ts` 中定义并导出 `BatteryVO` interface，包含 `percent: number`、`voltage: number`、`current_mA: number`、`power_W: number`、`status: BatteryStatus` 字段，并通过 `index.ts` 和 `package.json exports` 对外暴露。

#### Scenario: 前后端均可导入

- **WHEN** 前端或后端代码 `import type { BatteryVO } from "@tuanzi-photo/shared-types"`
- **THEN** 类型检查通过，字段类型正确
