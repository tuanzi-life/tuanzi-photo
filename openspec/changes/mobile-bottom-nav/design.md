## Context

当前移动端布局（`MobileLayout.vue`）在顶部 Header 下方设置了一个工具栏，包含「标签」筛选按钮和「定时」按钮，二者以底部弹出 Sheet（`TagSheet`、`ScheduleSheet`）的方式呈现。这种模式让定时设置入口不够显眼，且 Sheet 弹出层对复杂设置场景体验欠佳。

目标是改为类 App 的底部 Tab Bar 导航，将「照片」和「定时」提升为两个平级的一级视图，完全符合移动端 App 交互范式。

## Goals / Non-Goals

**Goals:**

- 实现底部 Tab Bar，包含「照片」（图标 `i-lucide-image`）和「定时」（图标 `i-lucide-clock`）两个 tab
- 「照片」tab 为默认选中视图，包含标签筛选（内联展示，替换原工具栏中的 TagSheet 触发按钮）和照片墙
- 「定时」tab 展示完整 SchedulePanel，不再使用 ScheduleSheet 弹出层
- Tab Bar 激活态使用 primary 色，非激活态使用 muted 色
- 保持 PhotoDetailOverlay / TagSheet 功能不变（照片详情和标签多选仍按需弹出）

**Non-Goals:**

- 不修改桌面端布局（DesktopLayout.vue）
- 不新增第三个 tab
- 不修改 SchedulePanel 本身的功能和 API

## Decisions

### 1. Tab Bar 实现方式：自定义组件 vs UNavigationMenu

选择**自定义 `MobileTabBar.vue` 组件**，而非 nuxt-ui 的 `UNavigationMenu`。

理由：Tab Bar 是固定底部的全宽导航，nuxt-ui 的导航组件偏向顶部/侧边栏场景，自定义组件更易控制 safe-area 适配和激活态样式。

### 2. 标签筛选入口：内联水平滚动 vs 弹出 Sheet

「照片」tab 内，标签筛选改为**内联水平滚动的 chip 列表**（复用现有 `TagFilter` 组件或简化版本），替代原来点击按钮弹出 `TagSheet` 的方式，减少操作层级。`TagSheet` 组件保留备用，但工具栏不再有独立「标签」按钮。

### 3. SchedulePanel 展示方式：全屏 vs 卡片

「定时」tab 内，SchedulePanel 以**全屏滚动页面**方式展示，不加额外卡片包裹，保持简洁。

### 4. 状态管理：ref vs vue-router

Tab 切换状态使用**本地 `ref`**（`activeTab: 'photos' | 'schedule'`），无需路由跳转，保持轻量。

## Risks / Trade-offs

- **iOS safe-area**：Tab Bar 底部需要 `padding-bottom: env(safe-area-inset-bottom)` 适配刘海屏，否则会被系统 Home Bar 遮挡。→ 在 Tab Bar 组件中统一处理。
- **TagFilter 内联展示**：原 TagFilter 组件设计为侧边栏竖向布局，需确认其是否支持横向水平滚动模式，否则需要单独写 inline 版本。→ 先尝试复用，如不适合则内联写简单版本。
- **ScheduleSheet 废弃**：`ScheduleSheet.vue` 将不再被 MobileLayout 引用，但保留文件（不删除），避免引入破坏性变更。
