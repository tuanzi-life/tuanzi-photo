## ADDED Requirements

### Requirement: 底部 Tab Bar 导航

移动端布局 SHALL 在页面底部渲染固定的 Tab Bar，包含「照片」和「定时」两个 tab 项，每项包含图标和文字标签。

#### Scenario: 默认选中照片 tab

- **WHEN** 用户打开移动端页面
- **THEN** 底部 Tab Bar 渲染，「照片」tab 处于激活状态，主内容区展示照片视图

#### Scenario: 切换到定时 tab

- **WHEN** 用户点击底部「定时」tab
- **THEN** 「定时」tab 变为激活态（primary 色高亮），主内容区切换为定时设置视图

#### Scenario: 切换回照片 tab

- **WHEN** 用户在「定时」tab 点击「照片」tab
- **THEN** 「照片」tab 恢复激活态，主内容区切换回照片视图，标签筛选状态保持不变

#### Scenario: Tab Bar 激活态样式

- **WHEN** 某个 tab 处于激活状态
- **THEN** 该 tab 的图标和文字标签使用 primary 色显示，非激活 tab 使用 muted 色显示

### Requirement: 照片视图内联标签筛选

「照片」tab 视图 SHALL 在照片网格上方提供内联的标签筛选区域，无需弹出额外 Sheet 即可进行快速筛选。

#### Scenario: 无标签时隐藏筛选区域

- **WHEN** 系统中没有任何照片标签
- **THEN** 标签筛选区域不渲染

#### Scenario: 有标签时展示筛选 chip

- **WHEN** 系统中存在照片标签
- **THEN** 标签筛选区域展示可横向滚动的标签 chip 列表，每个 chip 显示标签名和数量

#### Scenario: 选中标签筛选照片

- **WHEN** 用户点击某个标签 chip
- **THEN** 该标签切换为选中态（primary 色），照片网格仅展示含该标签的照片

#### Scenario: 取消标签筛选

- **WHEN** 用户再次点击已选中的标签 chip
- **THEN** 该标签取消选中，照片网格恢复展示全部（或其他已选标签）的照片

### Requirement: 定时视图展示完整设置面板

「定时」tab 视图 SHALL 以全屏滚动页面方式展示 SchedulePanel 设置界面。

#### Scenario: 进入定时 tab 展示设置面板

- **WHEN** 用户切换到「定时」tab
- **THEN** 页面内容区展示完整的 SchedulePanel 组件，支持滚动

#### Scenario: 定时设置保存

- **WHEN** 用户在 SchedulePanel 中修改设置并点击保存
- **THEN** 设置成功保存，用户停留在「定时」tab

### Requirement: iOS Safe Area 适配

Tab Bar SHALL 在 iOS 设备上适配底部 safe area，防止内容被系统 Home Bar 遮挡。

#### Scenario: iPhone 刘海屏适配

- **WHEN** 页面在 iOS 带 Home Bar 的设备上渲染
- **THEN** Tab Bar 底部增加 `env(safe-area-inset-bottom)` 的内边距，内容不被 Home Bar 遮挡
