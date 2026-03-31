## Context

前端基于 Vue 3 + Vite + @nuxt/ui v4，当前只有 Nuxt UI 模板示例代码。设计稿分为 Desktop（1440px）和 Mobile（390px）两套，差异较大：Desktop 是侧边栏 + 画廊的经典双栏布局，Mobile 是单列卡片式布局，标签筛选和照片详情均通过底部 Sheet 展示。

项目使用 pnpm monorepo，前端在 `apps/frontend`，与后端共享 `@tuanzi-photo/shared-types` 类型包。

## Goals / Non-Goals

**Goals:**

- 完整实现 desktop.pen 和 mobile.pen 设计稿的 UI
- 引入 Pinia 管理应用状态，store action 写死数据，为后续 API 接入预留接口
- 使用 `@vueuse/core` 的 `useBreakpoints` 实现响应式布局切换
- 所有组件使用 @nuxt/ui v4 组件库，遵循项目颜色规范（语义化颜色）
- 清理所有示例代码

**Non-Goals:**

- 不实现真实 API 调用（store action 全部写死）
- 不实现图片上传的文件选择 UI（按钮存在，逻辑写死成功）
- 不实现标签的增删改（只读展示）
- 不实现深色模式

## Decisions

### 1. 响应式策略：双布局组件 vs 单组件内条件渲染

**决策**：使用两套独立布局组件（`DesktopLayout.vue` / `MobileLayout.vue`），在 `pages/index.vue` 中用 `v-if` 切换。

**理由**：Desktop 和 Mobile 的 UI 差异极大（双栏 vs 单列、Overlay vs Sheet），强行合并到一个组件会导致大量条件分支，可读性差。独立布局组件职责清晰，共享组件（`PhotoGrid`、`SchedulePanel` 等）可在两个布局中复用。

**替代方案**：CSS 媒体查询 + 单组件 → 适合差异小的场景，此处不适用。

### 2. 状态管理：Pinia setup store vs options store

**决策**：使用 Pinia options store（`defineStore` with options API 风格）。

**理由**：options store 的 state/getters/actions 结构清晰，与后续 API 接入时的改造路径直观。项目规模不大，不需要 setup store 的灵活性。

### 3. 类型定义位置：前端本地 types vs 扩展 shared-types

**决策**：在 `apps/frontend/src/types/index.ts` 中定义前端专用类型（`Photo`、`ScheduleConfig`），引用 `@tuanzi-photo/shared-types` 中的基础类型。

**理由**：`Photo` 包含 `thumbnailUrl` 等前端展示字段，不属于 API 契约，放在前端本地更合适。shared-types 保持精简，只放前后端共用的 API 类型。

### 4. 照片详情：Desktop Overlay vs Mobile Sheet

**决策**：Desktop 使用全屏半透明遮罩 + 居中卡片（`PhotoDetailOverlay.vue`），Mobile 使用底部 Sheet（`PhotoDetailSheet.vue`），两者均通过 `photoStore.currentPhoto` 控制显示。

**理由**：与设计稿保持一致。两种形态的交互模式不同，独立组件避免耦合。

### 5. 标签筛选：Desktop 侧边栏 vs Mobile Sheet

**决策**：`TagFilter.vue` 用于 Desktop 侧边栏常驻展示，`TagSheet.vue` 用于 Mobile 底部 Sheet 弹出。两者共享 `photoStore.selectedTags` 状态。

**理由**：设计稿中两种形态差异明显，共享 store 状态保证筛选结果一致。

## Risks / Trade-offs

- [写死数据与真实 API 的差距] → store action 签名与预期 API 保持一致，后续只需替换 action 实现，不改组件
- [nuxt-ui v4 组件 API 不熟悉] → 实现前先调用 nuxt-ui skill 确认组件用法，避免使用不存在的 props
- [useBreakpoints SSR 兼容性] → 项目是纯 SPA（Vite），无 SSR，不存在此问题
- [图片 thumbnailUrl 写死为占位图] → 使用 picsum.photos 或固定尺寸占位图，视觉上接近真实效果
