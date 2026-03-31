## 1. 依赖安装与项目配置

- [x] 1.1 在 `apps/frontend` 安装 `pinia` 和 `@vueuse/core`
- [x] 1.2 在 `apps/frontend/src/main.ts` 中注册 Pinia 插件
- [x] 1.3 创建 `apps/frontend/src/types/index.ts`，定义 `Photo` 和 `ScheduleConfig` 类型

## 2. Pinia Store

- [x] 2.1 创建 `apps/frontend/src/stores/photo.ts`：定义 state（photos、selectedTags、currentPhoto）、getters（filteredPhotos、allTags）和 actions（fetchPhotos、uploadPhoto、deletePhoto、pushToScreen、toggleTag、setCurrentPhoto），action 全部写死数据
- [x] 2.2 创建 `apps/frontend/src/stores/schedule.ts`：定义 state（mode、time、intervalHours、selectedTags、rule、nextRefreshTime）和 actions（fetchSchedule、saveSchedule、triggerRefresh），action 全部写死数据

## 3. 清理示例代码

- [x] 3.1 删除 `apps/frontend/src/components/AppLogo.vue` 和 `TemplateMenu.vue`
- [x] 3.2 重写 `apps/frontend/src/App.vue`，移除示例 UHeader/UFooter，只保留 `<UApp><RouterView /></UApp>` 结构

## 4. 共享组件

- [x] 4.1 创建 `AppHeader.vue`：左侧绿点 + "团子相册" logo，右侧"上传图片"按钮（secondary 色，lucide plus 图标），点击触发 photoStore.uploadPhoto
- [x] 4.2 创建 `EmptyState.vue`：接收 icon/title/description props，展示空状态图标和文字
- [x] 4.3 创建 `PhotoCard.vue`：展示单张照片缩略图，点击触发 photoStore.setCurrentPhoto
- [x] 4.4 创建 `PhotoGrid.vue`：接收 photos prop，渲染 PhotoCard 网格，支持 columns prop（默认自适应）
- [x] 4.5 创建 `TagFilter.vue`：展示标签列表（含数量），支持多选，空状态提示，调用 photoStore.toggleTag
- [x] 4.6 创建 `SchedulePanel.vue`：模式切换、时间/小时数输入、标签 chip 多选、规则选择、下次刷新时间、保存/立即刷新按钮

## 5. Desktop 专用组件

- [x] 5.1 创建 `PhotoDetailOverlay.vue`：全屏半透明遮罩 + 居中卡片，左侧大图，右侧文件名/标签/推送/删除按钮，点击遮罩关闭
- [x] 5.2 创建 `layouts/DesktopLayout.vue`：AppHeader + 主区域（左侧 288px 控制栏含 TagFilter+SchedulePanel，右侧画廊含统计栏+PhotoGrid/EmptyState）+ PhotoDetailOverlay

## 6. Mobile 专用组件

- [x] 6.1 创建 `TagSheet.vue`：底部 Sheet，标签多选列表，确认按钮，使用 USlideover 或自定义实现
- [x] 6.2 创建 `PhotoDetailSheet.vue`：底部 Sheet，拖拽把手、图片预览、文件信息、推送/删除按钮（使用 PhotoDetailOverlay 响应式实现，mobile 上自动适配为竖向布局）
- [x] 6.3 创建 `layouts/MobileLayout.vue`：MobileHeader（复用 AppHeader 或单独实现）+ 统计卡片 + 标签筛选触发器 + SchedulePanel 卡片 + 2列 PhotoGrid/EmptyState + TagSheet + PhotoDetailSheet

## 7. 主页入口

- [x] 7.1 重写 `apps/frontend/src/pages/index.vue`：使用 `useBreakpoints` 判断屏幕宽度，`<768px` 渲染 MobileLayout，`>=768px` 渲染 DesktopLayout，页面挂载时调用 `photoStore.fetchPhotos()` 和 `scheduleStore.fetchSchedule()`
