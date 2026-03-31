### Requirement: 响应式双布局

系统 SHALL 根据用户设备屏幕宽度自动切换 Desktop 和 Mobile 两套布局。

#### Scenario: Desktop 布局（≥768px）

- **WHEN** 用户在宽度 ≥768px 的设备上访问页面
- **THEN** 渲染 DesktopLayout：顶部 AppHeader + 左侧 288px 控制栏（TagFilter + SchedulePanel）+ 右侧画廊区

#### Scenario: Mobile 布局（<768px）

- **WHEN** 用户在宽度 <768px 的设备上访问页面
- **THEN** 渲染 MobileLayout：顶部 MobileHeader + 统计卡片 + 标签筛选触发器 + SchedulePanel 卡片 + 2列图片网格

#### Scenario: 窗口尺寸变化

- **WHEN** 用户调整浏览器窗口宽度跨越 768px 阈值
- **THEN** 布局自动切换，不需要刷新页面

### Requirement: 共享状态跨布局同步

系统 SHALL 保证 Desktop 和 Mobile 布局共享同一份 Pinia store 状态。

#### Scenario: 标签筛选状态共享

- **WHEN** 用户在任一布局中修改标签筛选
- **THEN** photoStore.selectedTags 更新，filteredPhotos getter 重新计算
