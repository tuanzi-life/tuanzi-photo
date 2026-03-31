## ADDED Requirements

### Requirement: 获取定时配置

`useScheduleStore` 的 `fetchSchedule` action SHALL 调用 `GET /api/v1/schedule`，将返回的 `ScheduleVO` 字段存入 store state。

#### Scenario: 请求成功

- **WHEN** 调用 `fetchSchedule()`
- **THEN** 发起 `GET /api/v1/schedule` 请求，响应 `code === 0` 时将 `data` 的各字段同步到 store state

#### Scenario: 请求失败

- **WHEN** 请求返回非 0 code 或网络错误
- **THEN** store state 保持不变，toast 显示错误信息

---

### Requirement: 保存定时配置

`saveSchedule` action SHALL 调用 `PUT /api/v1/schedule`，将当前 store state 中的配置字段作为请求体提交。

#### Scenario: 保存成功

- **WHEN** 调用 `saveSchedule()`
- **THEN** 发起 `PUT /api/v1/schedule` 请求，body 包含 `refreshMode`、`timingHour`、`intervalHours`、`refreshRule`、`relatedTags`，响应 `code === 0` 时用返回的 `data` 更新 store state，toast 显示"保存成功"

#### Scenario: 保存失败

- **WHEN** 服务端返回非 0 code 或网络错误
- **THEN** store state 不变，toast 显示错误信息

---

### Requirement: 立即触发刷新

`triggerRefresh` action SHALL 调用 `POST /api/v1/schedule/trigger`，成功时 toast 提示"已触发刷新"。

#### Scenario: 触发成功

- **WHEN** 调用 `triggerRefresh()`
- **THEN** 发起 POST 请求，响应 `code === 0` 时 toast 提示"已触发刷新，正在刷新"

#### Scenario: 墨水屏正在刷新（409）

- **WHEN** 服务端返回 `code === 409`
- **THEN** toast 显示"墨水屏正在刷新，请稍后再试"

#### Scenario: 没有可用照片（404）

- **WHEN** 服务端返回 `code === 404`
- **THEN** toast 显示"没有可用的照片"
