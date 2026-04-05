## MODIFIED Requirements

### Requirement: 推送照片到墨水屏
系统 SHALL 提供 `POST /api/v1/photos/:id/push` 接口，调用 Python SPI 驱动脚本将指定照片推送到墨水屏，并把最终结果记录为 `manual` 类型的渲染历史。

#### Scenario: 推送成功
- **WHEN** 客户端请求 `POST /api/v1/photos/1/push`，当前无刷新任务在进行
- **THEN** 响应 200，`code` 为 `0`，`data` 为 `null`；系统异步调用 Python 脚本执行推送，并在成功完成后写入 `type = manual`、`result = success` 的历史记录

#### Scenario: 刷新锁冲突
- **WHEN** 客户端请求 `POST /api/v1/photos/1/push`，当前已有刷新任务在进行
- **THEN** 响应 200，`code` 为 `409`，`message` 为"墨水屏正在刷新，请稍后再试"，`data` 为 `null`

#### Scenario: 推送不存在的照片
- **WHEN** 客户端请求 `POST /api/v1/photos/9999/push`，该照片不存在
- **THEN** 响应 200，`code` 为 `404`，`message` 为"照片不存在"，`data` 为 `null`

#### Scenario: 推送失败时保留失败原因
- **WHEN** 客户端请求 `POST /api/v1/photos/:id/push`，照片存在但底层屏幕推送失败
- **THEN** 系统写入一条 `render_history` 记录，`type` 为 `manual`，`result` 为失败原因或 `fastify.screen.pushPhoto(objectKey)` 返回的错误信息
