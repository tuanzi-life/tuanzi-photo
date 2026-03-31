### Requirement: 获取照片列表

系统 SHALL 提供 `GET /api/v1/photos` 接口，返回所有照片列表，支持按标签多选筛选（交集）。

#### Scenario: 无筛选条件时返回全部照片

- **WHEN** 客户端请求 `GET /api/v1/photos`，不携带 `tags` 参数
- **THEN** 响应 200，body 为 `ApiResponse<PhotoListResponse>`，`code` 为 `0`，`data` 包含 `total` 和 `items` 数组（每项含 `id`、`filename`、`url`、`tags`、`createdAt`）

#### Scenario: 按标签筛选返回并集结果

- **WHEN** 客户端请求 `GET /api/v1/photos?tags=风景,自然`
- **THEN** 响应 200，`data.items` 中包含拥有"风景"或"自然"任意一个标签的照片（去重）

#### Scenario: 筛选结果为空

- **WHEN** 客户端传入的标签组合没有匹配的照片
- **THEN** 响应 200，`code` 为 `0`，`data.items` 为空数组，`data.total` 为 0

### Requirement: 上传照片（空实现）

系统 SHALL 提供 `POST /api/v1/photos/upload` 接口，当前为空实现，直接返回成功响应，不写入数据库。

#### Scenario: 调用上传接口

- **WHEN** 客户端请求 `POST /api/v1/photos/upload`
- **THEN** 响应 200，body 为 `ApiResponse<null>`，`code` 为 `0`，`data` 为 `null`

### Requirement: 删除照片

系统 SHALL 提供 `DELETE /api/v1/photos/:id` 接口，删除指定照片及其标签关联。

#### Scenario: 删除存在的照片

- **WHEN** 客户端请求 `DELETE /api/v1/photos/1`，且该照片存在
- **THEN** 响应 200，`code` 为 `0`，`data` 为 `null`，数据库中该照片及 photo_tag 关联记录均被删除

#### Scenario: 删除不存在的照片

- **WHEN** 客户端请求 `DELETE /api/v1/photos/9999`，该照片不存在
- **THEN** 响应 200，`code` 为 `404`，`message` 为"照片不存在"，`data` 为 `null`

#### Scenario: id 格式非法

- **WHEN** 客户端请求 `DELETE /api/v1/photos/abc`
- **THEN** 响应 200，`code` 为 `400`，`message` 为"参数校验失败"，`data` 为 `null`

### Requirement: 推送照片到墨水屏

系统 SHALL 提供 `POST /api/v1/photos/:id/push` 接口，调用 Python SPI 驱动脚本将指定照片推送到墨水屏。

#### Scenario: 推送成功

- **WHEN** 客户端请求 `POST /api/v1/photos/1/push`，当前无刷新任务在进行
- **THEN** 响应 200，`code` 为 `0`，`data` 为 `null`；系统异步调用 Python 脚本执行推送

#### Scenario: 刷新锁冲突

- **WHEN** 客户端请求 `POST /api/v1/photos/1/push`，当前已有刷新任务在进行
- **THEN** 响应 200，`code` 为 `409`，`message` 为"墨水屏正在刷新，请稍后再试"，`data` 为 `null`

#### Scenario: 推送不存在的照片

- **WHEN** 客户端请求 `POST /api/v1/photos/9999/push`，该照片不存在
- **THEN** 响应 200，`code` 为 `404`，`message` 为"照片不存在"，`data` 为 `null`
