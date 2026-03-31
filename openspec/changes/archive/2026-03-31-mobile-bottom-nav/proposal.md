## Why

当前移动端布局采用垂直堆叠方式展示照片墙和定时设置，交互体验与原生 App 差距较大，功能入口不直观。通过引入底部导航栏（Tab Bar）模式，让照片管理和定时设置成为并列的一级页面，符合用户对移动 App 的使用习惯。

## What Changes

- 移除当前 `MobileLayout.vue` 中垂直堆叠的 SchedulePanel 展示方式
- 新增底部 Tab Bar 组件，包含「照片」和「定时」两个 tab
- 「照片」tab（默认选中）：展示标签筛选器 + 照片墙，保留现有 TagSheet 和 PhotoDetailSheet 功能
- 「定时」tab：专用页面展示 SchedulePanel 设置界面
- 移除 `MobileHeader.vue` 中与定时相关的快捷入口（如有）
- Tab Bar 使用图标 + 文字标签，激活态用 primary 色高亮

## Capabilities

### New Capabilities

- `mobile-tab-navigation`: 移动端底部 Tab Bar 导航，管理「照片」和「定时」两个一级视图的切换逻辑

### Modified Capabilities

（无需修改现有 spec，无已存在的 specs 目录）

## Impact

- `apps/frontend/src/layouts/MobileLayout.vue`：重构为 Tab Bar 架构
- `apps/frontend/src/components/MobileTabBar.vue`：新增底部导航栏组件
- `apps/frontend/src/components/MobileHeader.vue`：简化，仅服务于照片 tab
- 无 API 变更，无依赖新增
