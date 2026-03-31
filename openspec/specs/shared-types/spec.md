### Requirement: 定义前后端共享的照片类型

系统 SHALL 在 `packages/shared-types` 中定义 `PhotoVO` 和 `PhotoListResponse`，供前后端统一使用。

#### Scenario: 后端使用 PhotoVO 构造响应

- **WHEN** 后端路由返回照片数据
- **THEN** 响应 body 的结构与 `PhotoVO` 定义完全匹配（`id: number`、`filename: string`、`url: string`、`tags: string[]`、`createdAt: number`）

#### Scenario: 前端使用 PhotoVO 声明类型

- **WHEN** 前端 store 或组件引用照片对象
- **THEN** 可从 `@tuanzi-photo/shared-types` 导入 `PhotoVO` 并获得完整类型提示

### Requirement: 定义前后端共享的标签类型

系统 SHALL 在 `packages/shared-types` 中定义 `TagVO` 和 `TagListResponse`。

#### Scenario: TagVO 包含计数字段

- **WHEN** 后端返回标签列表
- **THEN** 每个 TagVO 包含 `id: number`、`name: string`、`count: number`

### Requirement: 定义前后端共享的定时配置类型

系统 SHALL 在 `packages/shared-types` 中定义 `ScheduleVO` 和 `UpdateScheduleBody`。

#### Scenario: ScheduleVO 包含下次刷新时间

- **WHEN** 后端返回定时配置
- **THEN** ScheduleVO 包含 `refreshMode`、`timingHour`、`intervalHours`、`refreshRule`、`relatedTags`、`nextRefreshTime` 字段

#### Scenario: UpdateScheduleBody 约束请求参数类型

- **WHEN** 前端构造 PUT /schedule 请求体
- **THEN** 可使用 `UpdateScheduleBody` 类型约束请求 body，字段与 ScheduleVO 一致（不含 `nextRefreshTime`）
