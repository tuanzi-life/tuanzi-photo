# AGENTS.md

这个文件定义了 `apps/frontend` 目录下的工作规则。

## 适用范围

- Vue 3 + Vite 前端应用。
- `@nuxt/ui` v4 组件库。
- 基于 `vue-router/vite` + `vue-router/auto-routes` 的文件路由。
- 使用 Pinia 管理客户端状态。

## 目录结构

- 应用入口放在 `src/main.ts`，根组件放在 `src/App.vue`。
- 页面放在 `src/pages/`。
- 共享 UI 组件放在 `src/components/`。
- 布局放在 `src/layouts/`。
- 状态管理放在 `src/stores/`。
- 共享前端类型别名放在 `src/types/`。
- 全局样式和主题变量放在 `src/assets/css/main.css`。
- 路由生成类型放在 `src/route-map.d.ts`；把它视为生成产物，不要当作手写源码维护。
- `auto-imports.d.ts`、`components.d.ts`、`dist/` 也都视为生成产物，不要当作手写源码维护。

## 应用结构规则

- 当前应用通过 `src/main.ts` 手动创建 `createRouter()` 和 `createPinia()`，并挂载 `@nuxt/ui/vue-plugin`；不要额外引入第二套应用初始化入口。
- 路由来源于 `vue-router/auto-routes` 导出的 `routes`；新增页面优先通过 `src/pages/` 文件路由接入，不要再维护一份独立的手写路由表。
- 根组件 `src/App.vue` 只负责包裹 `<UApp>` 和 `<RouterView />`；全局业务逻辑不要堆到这里。
- 首页当前是单页应用壳，按断点在 `DesktopLayout.vue` 和 `MobileLayout.vue` 之间切换。新增首页级交互时，优先保持这两个布局分工清晰，而不是在页面里塞大量条件渲染。

## 状态与数据规则

- API 调用集中在 Pinia stores 中处理：
  - `photo` store 负责照片列表、筛选、上传、删除、推送和当前选中照片
  - `schedule` store 负责定时配置读取、保存和立即刷新
  - `battery` store 负责电池信息轮询
- 组件优先负责展示和交互触发，尽量不要在组件里重复写一套 `fetch("/api/...")` 逻辑；除非是非常局部且不会复用的一次性交互。
- 后端统一返回 `ApiResponse`，前端处理接口结果时要继续按 `body.code` 分支，而不是只看 HTTP 状态码。
- 统一使用 `@nuxt/ui` 的 toast；新增异步操作时，优先保持现有提示风格一致。
- `battery` store 的轮询由布局层在 `onMounted` 时启动，并在 `onUnmounted` 时清理；新增轮询或事件订阅时必须同时处理卸载清理，避免重复注册。
- `src/types/index.ts` 当前只是对共享类型的前端别名封装；不要把运行时逻辑塞进这里。

## UI 与样式规则

- 创建自定义基础组件前，优先复用现有 `@nuxt/ui` 组件。
- 保持当前的视觉基调：浅色、克制、工具化，主色为绿色系，`neutral` 使用 zinc。
- 全局主题变量集中在 `src/assets/css/main.css`；调整品牌色、字体或 Nuxt UI token 时，优先改主题层而不是在组件里散落覆盖。
- 当前全局字体是 `Public Sans`。如果没有明确设计需求，不要随意改成另一套字体栈。
- 视觉风格要克制。避免悬浮卡片、激进缩放、厚重阴影，以及偏装饰性的视觉效果干扰产品本身的工具属性。
- 每个页面和组件都必须兼容窄屏和宽屏。
- 当前首页存在桌面/移动两套布局，移动端还包含底部 tab 和内联标签筛选；新增功能时要同时考虑两套布局，不要只改其中一边。
- 照片查看当前通过全局 `PhotoDetailOverlay` 浮层完成；不要再引入第二套并行的详情展示模式，除非需求明确变化。
- 优先使用 `@nuxt/ui` 的语义化颜色，而不是直接写 Tailwind 原始颜色类。
- 除非有明确理由，否则避免使用 `bg-green-500`、`border-amber-200` 这类类名。
- 优先采用下面这类模式：
  - `<UButton color="primary">`
  - `text-primary`
  - `bg-secondary`
  - `ring-default`

## 路由与运行规则

- 开发服务器运行在 `127.0.0.1:4011`。
- `/api/*` 请求会被代理到后端 `127.0.0.1:4010`。
- `vite.config.ts` 中已经配置了 `vueRouter({ dts: "src/route-map.d.ts" })`；修改路由时，要保持与现有文件路由机制兼容，不要再引入一套并行的手写路由约定。
- 构建配置当前显式关闭了压缩体积报告，并使用 `esbuild` 做 CSS minify；除非有明确收益，不要随意改回默认行为。
- 前端有 `build:pi` 低内存构建脚本。涉及构建内存或 Pi 构建稳定性的改动时，要优先考虑这条执行路径。
- 构建前端时，更推荐直接在根目录使用 `pnpm build:frontend` 在本机做构建，提交到 git 后，树莓派直接拉取构建结果。直接在树莓派构建前端可能会遇上 build heap OOM。

## 组件与交互规则

- 上传入口目前同时存在于 `AppHeader.vue` 和 `MobileHeader.vue`，交互行为应保持一致：点击隐藏的 `<input type="file">`、上传后清空 input 值、允许重复选择同一文件。
- 标签筛选当前由 `photoStore.selectedTags` 统一驱动，桌面和移动端只是不同表现形式；不要让两套标签 UI 维护各自独立的筛选状态。
- `SchedulePanel.vue` 直接编辑 `schedule` store 中的响应式字段；如果重构为本地草稿态，要确保“保存前后状态同步”和“下次刷新时间回填”仍然成立。
- `PhotoGrid.vue`、`PhotoCard.vue`、`PhotoDetailOverlay.vue` 共同组成照片浏览主链路；改动网格、弹层或当前照片状态时，要检查这三者是否仍然一致。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm build:pi
pnpm preview
pnpm typecheck
```

## 验证规则

- 修改前端源码后，执行 `pnpm typecheck`。
- 如果改动涉及路由、Vite 配置、应用启动代码，或任何可能影响生产构建的部分，再执行 `pnpm build`。
- 如果改动涉及 `src/main.ts`、`src/App.vue`、`src/pages/`、`src/layouts/`、`vite.config.ts`、主题样式或构建配置，也执行 `pnpm build`。
- 如果改动涉及 stores、异步交互或 API 对接，至少自查一次加载态、错误提示、移动端布局和桌面端布局是否都还能成立。
- 如果共享类型发生变化，在共享包更新后重新执行前端验证。
