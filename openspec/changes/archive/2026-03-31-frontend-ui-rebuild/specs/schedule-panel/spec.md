## ADDED Requirements

### Requirement: 定时任务配置

系统 SHALL 提供定时任务配置面板，支持两种刷新模式：每天定时和每隔 N 小时。

#### Scenario: 切换刷新模式

- **WHEN** 用户点击模式切换按钮（"每天定时" / "每隔 N 小时"）
- **THEN** scheduleStore.mode 更新，面板显示对应的配置项

#### Scenario: 每天定时模式

- **WHEN** scheduleStore.mode 为 'daily'
- **THEN** 面板显示时间输入框（HH:MM 格式）

#### Scenario: 每隔 N 小时模式

- **WHEN** scheduleStore.mode 为 'interval'
- **THEN** 面板显示小时数输入框

### Requirement: 定时任务标签和规则配置

系统 SHALL 允许用户为定时任务指定标签范围和刷新规则。

#### Scenario: 指定标签

- **WHEN** 用户在 SchedulePanel 中点击标签 chip
- **THEN** 该标签在 scheduleStore.selectedTags 中切换选中状态

#### Scenario: 选择刷新规则

- **WHEN** 用户点击"按上传时间顺序"或"随机"规则卡片
- **THEN** scheduleStore.rule 更新为对应值

### Requirement: 保存和立即刷新

系统 SHALL 提供保存配置和立即刷新两个操作按钮。

#### Scenario: 保存配置

- **WHEN** 用户点击"保存配置"按钮
- **THEN** 调用 scheduleStore.saveSchedule，模拟保存成功

#### Scenario: 立即刷新

- **WHEN** 用户点击"立即刷新"按钮
- **THEN** 调用 scheduleStore.triggerRefresh，模拟刷新成功

### Requirement: 下次刷新时间展示

系统 SHALL 在 SchedulePanel 中显示下次刷新时间。

#### Scenario: 显示下次刷新时间

- **WHEN** 用户查看 SchedulePanel
- **THEN** 面板底部显示"下次刷新: [时间]"提示文字
