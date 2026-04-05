## ADDED Requirements

### Requirement: 记录照片推送历史
系统 SHALL 为每次进入屏幕推送流程的照片写入一条 `render_history` 记录，包含 Unix 时间戳、照片 ID、触发类型和最终结果。

#### Scenario: 手动推送成功时写入成功历史
- **WHEN** 客户端请求 `POST /api/v1/photos/:id/push`，照片存在且底层屏幕推送成功
- **THEN** 系统写入一条 `render_history` 记录，`photo_id` 为该照片 ID，`type` 为 `manual`，`result` 为 `success`

#### Scenario: 定时推送失败时写入失败历史
- **WHEN** `POST /api/v1/schedule/trigger` 判断当前应触发，选中照片后底层屏幕推送失败
- **THEN** 系统写入一条 `render_history` 记录，`photo_id` 为被选中的照片 ID，`type` 为 `schedule`，`result` 为失败原因或 `fastify.screen.pushPhoto(objectKey)` 返回的错误信息

#### Scenario: 照片删除后保留历史记录
- **WHEN** 某张已经存在推送历史的照片后续被删除
- **THEN** 系统保留已有 `render_history` 记录，不因照片删除而级联删除对应历史

### Requirement: 维护本地渲染次数快照
系统 SHALL 在 `data/main/render_history.json` 中维护每张照片按 `manual` / `schedule` 维度的成功渲染次数，且只为至少成功渲染过一次的照片创建条目。

#### Scenario: 首次成功渲染某张照片时创建条目
- **WHEN** 某张照片第一次成功推送到墨水屏
- **THEN** 系统在 `render_history.json` 中创建该照片 ID 对应的对象，并把对应触发类型的计数写为 `1`

#### Scenario: 同一照片再次成功渲染时递增对应计数
- **WHEN** 某张已存在于 `render_history.json` 的照片再次成功推送到墨水屏
- **THEN** 系统只递增本次触发类型对应的计数，保留另一种触发类型已有值不变

#### Scenario: JSON 写入失败不影响主流程
- **WHEN** 系统已经成功完成照片推送并写入 `render_history`，但写入 `render_history.json` 失败
- **THEN** 系统保留本次推送成功结果和数据库历史记录，只记录文件写入失败日志，不将整体推送改判为失败
