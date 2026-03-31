## 1. 新增 MobileTabBar 组件

- [x] 1.1 创建 `apps/frontend/src/components/MobileTabBar.vue`：固定底部，两个 tab（照片 `i-lucide-image` / 定时 `i-lucide-clock`），接收 `modelValue` prop（`'photos' | 'schedule'`），emit `update:modelValue`，激活态 primary 色，非激活态 muted 色，底部加 `pb-[env(safe-area-inset-bottom)]` 适配 iOS

## 2. 照片视图内联标签筛选

- [x] 2.1 创建 `apps/frontend/src/components/InlineTagFilter.vue`：横向可滚动的标签 chip 列表，无标签时不渲染；chip 显示标签名+数量，选中态 primary solid，未选中态 neutral outline，点击调用 `photoStore.toggleTag`；从 `photoStore` 读取 `allTags` 和 `selectedTags`

## 3. 重构 MobileLayout

- [x] 3.1 重写 `apps/frontend/src/layouts/MobileLayout.vue`：整体结构改为 `flex-col h-screen`，顶部 `MobileHeader`（仅照片 tab 显示），中间内容区 `flex-1 overflow-hidden`，底部固定 `MobileTabBar`
- [x] 3.2 照片视图（`activeTab === 'photos'`）：包含 `InlineTagFilter` + 照片网格（`PhotoGrid` / `EmptyState`）+ 照片数量统计
- [x] 3.3 定时视图（`activeTab === 'schedule'`）：包含页面标题 + 可滚动的 `SchedulePanel`
- [x] 3.4 保留 `PhotoDetailOverlay` 和 `TagSheet`（详情弹层不变），移除 `ScheduleSheet` 的引用和触发按钮
