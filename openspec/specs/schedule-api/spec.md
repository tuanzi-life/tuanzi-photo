### Requirement: 获取定时刷新配置

系统 SHALL 提供 `GET /api/v1/schedule` 接口，返回当前定时配置及下次刷新时间。

#### Scenario: 返回当前配置

- **WHEN** 客户端请求 `GET /api/v1/schedule`
- **THEN** 响应 200，body 为 `ApiResponse<ScheduleVO>`，`code` 为 `0`，`data` 包含 `refreshMode`、`timingHour`、`intervalHours`、`refreshRule`、`relatedTags`、`nextRefreshTime`

#### Scenario: 数据库无配置时返回默认值

- **WHEN** schedule 表中无记录（首次启动）
- **THEN** 系统自动插入默认行并返回，`code` 为 `0`

### Requirement: 保存定时刷新配置

系统 SHALL 提供 `PUT /api/v1/schedule` 接口，保存用户设置的定时配置。

#### Scenario: 保存合法配置

- **WHEN** 客户端以合法的 body 请求 `PUT /api/v1/schedule`
- **THEN** 响应 200，`code` 为 `0`，`data` 为保存后的完整 `ScheduleVO`（含重新计算的 `nextRefreshTime`）

#### Scenario: 参数校验失败

- **WHEN** 客户端传入任意不合法参数（`refreshMode`、`timingHour` 超出 0-23、`intervalHours` 超出 1-24 等）
- **THEN** 响应 200，`code` 为 `400`，`message` 为"参数校验失败"，`data` 为 `null`

### Requirement: 立即触发墨水屏刷新

系统 SHALL 提供 `POST /api/v1/schedule/trigger` 接口，根据当前配置立即选取一张照片并推送到墨水屏。

#### Scenario: 触发成功

- **WHEN** 客户端请求 `POST /api/v1/schedule/trigger`，当前无刷新任务在进行
- **THEN** 响应 200，`code` 为 `0`，`data` 为 `null`；系统异步调用 Python 脚本执行推送

#### Scenario: 刷新锁冲突

- **WHEN** 客户端请求 `POST /api/v1/schedule/trigger`，当前已有刷新任务在进行
- **THEN** 响应 200，`code` 为 `409`，`message` 为"墨水屏正在刷新，请稍后再试"，`data` 为 `null`

#### Scenario: 没有可用照片

- **WHEN** 当前 relatedTags 筛选范围内没有任何照片
- **THEN** 响应 200，`code` 为 `404`，`message` 为"没有可用的照片"，`data` 为 `null`
