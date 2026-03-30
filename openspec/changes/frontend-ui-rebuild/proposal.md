## Why

前端目前使用 Nuxt UI 模板的示例代码，没有实际业务 UI。需要基于 desktop.pen 和 mobile.pen 设计稿，重构为团子相册的完整前端界面，并引入 Pinia 状态管理为后续 API 接入做好准备。

## What Changes

- 删除示例组件 `AppLogo.vue`、`TemplateMenu.vue`，清空 `App.vue` 和 `pages/index.vue` 中的示例内容
- 安装 `pinia` 和 `@vueuse/core` 依赖
- 新增前端类型定义（`Photo`、`ScheduleConfig`）
- 新增 Pinia store：`photoStore`（照片列表、标签筛选、当前照片）和 `scheduleStore`（定时任务配置）
- 新增共享组件：`AppHeader`、`TagFilter`、`SchedulePanel`、`PhotoGrid`、`PhotoCard`、`EmptyState`
- 新增 Desktop 专用组件：`PhotoDetailOverlay`
- 新增 Mobile 专用组件：`PhotoDetailSheet`、`TagSheet`
- 新增布局：`DesktopLayout.vue`（侧边栏 + 画廊）、`MobileLayout.vue`（单列卡片式）
- `pages/index.vue` 根据屏幕宽度（`useBreakpoints`）切换 Desktop/Mobile 布局

## Capabilities

### New Capabilities

- `photo-gallery`: 照片列表展示，支持标签筛选、空状态、点击查看详情
- `photo-detail`: 照片详情查看，支持推送到墨水屏、删除操作
- `tag-filter`: 标签多选筛选，Desktop 侧边栏 + Mobile 底部 Sheet 两种形态
- `schedule-panel`: 定时任务配置面板，支持每天定时/每隔N小时两种模式
- `responsive-layout`: 基于 `useBreakpoints` 的响应式双布局（Desktop ≥768px / Mobile <768px）

### Modified Capabilities

## Impact

- `apps/frontend/package.json`：新增 `pinia`、`@vueuse/core` 依赖
- `apps/frontend/src/App.vue`：重写，移除示例 header/footer
- `apps/frontend/src/pages/index.vue`：重写为响应式布局入口
- `apps/frontend/src/components/`：删除示例组件，新增业务组件
- `apps/frontend/src/stores/`：新建目录，新增 `photo.ts`、`schedule.ts`
- `apps/frontend/src/layouts/`：新建目录，新增 `DesktopLayout.vue`、`MobileLayout.vue`
- `apps/frontend/src/types/`：新建目录，新增前端类型定义
- 无 API 变更，store action 全部写死数据，后续接入 API 只需修改 store
