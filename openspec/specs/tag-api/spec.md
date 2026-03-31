### Requirement: 获取标签列表及照片计数

系统 SHALL 提供 `GET /api/v1/tags` 接口，返回所有标签及每个标签下的照片数量。

#### Scenario: 有标签时返回列表

- **WHEN** 客户端请求 `GET /api/v1/tags`，数据库中存在标签
- **THEN** 响应 200，body 为 `ApiResponse<TagListResponse>`，`code` 为 `0`，`data.items` 数组中每项含 `id`、`name`、`count`

#### Scenario: 无标签时返回空列表

- **WHEN** 客户端请求 `GET /api/v1/tags`，数据库中没有任何标签
- **THEN** 响应 200，`code` 为 `0`，`data.items` 为空数组
