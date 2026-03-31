## MODIFIED Requirements

### Requirement: 定时任务配置

系统 SHALL 提供定时任务配置面板，支持两种刷新模式：每天定时和每隔 N 小时。

#### Scenario: 切换刷新模式

- **WHEN** 用户点击模式切换按钮（"每天定时" / "固定间隔"）
- **THEN** `scheduleStore.refreshMode` 更新，面板显示对应的配置项

#### Scenario: 每天定时模式

- **WHEN** `scheduleStore.refreshMode` 为 `'timing'`
- **THEN** 面板显示整点小时选择框（`timingHour`，0-23）

#### Scenario: 每隔 N 小时模式

- **WHEN** `scheduleStore.refreshMode` 为 `'interval'`
- **THEN** 面板显示小时数输入框（`intervalHours`）

### Requirement: 定时任务标签和规则配置

系统 SHALL 允许用户为定时任务指定标签范围和刷新规则。

#### Scenario: 指定标签

- **WHEN** 用户在 SchedulePanel 中点击标签 chip
- **THEN** 该标签在 `scheduleStore.relatedTags` 中切换选中状态

#### Scenario: 选择刷新规则

- **WHEN** 用户点击"按上传时间顺序"或"随机"规则卡片
- **THEN** `scheduleStore.refreshRule` 更新为对应值（`'time'` 或 `'random'`）

### Requirement: 保存和立即刷新

系统 SHALL 提供保存配置和立即刷新两个操作按钮。

#### Scenario: 保存配置

- **WHEN** 用户点击"保存配置"按钮
- **THEN** 调用 `scheduleStore.saveSchedule()`，发起真实 PUT 请求；成功时 toast 提示"保存成功"；失败时 toast 显示错误信息

#### Scenario: 立即刷新

- **WHEN** 用户点击"立即刷新"按钮
- **THEN** 调用 `scheduleStore.triggerRefresh()`，发起真实 POST 请求；成功时 toast 提示"已触发刷新，正在刷新"；墨水屏忙时 toast 提示"墨水屏正在刷新，请稍后再试"

### Requirement: 下次刷新时间展示

系统 SHALL 在 SchedulePanel 中显示下次刷新时间。

#### Scenario: 显示下次刷新时间

- **WHEN** 用户查看 SchedulePanel 且 `scheduleStore.nextRefreshTime` 不为 null
- **THEN** 面板底部显示"下次刷新: [格式化时间字符串]"，时间由 Unix 秒转换为本地可读格式
