# AGENTS.md

这个文件定义了 `apps/frontend` 目录下的工作规则。

## 适用范围

- Vue 3 + Vite 前端应用。
- `@nuxt/ui` v4 组件库。
- 基于 `vue-router/vite` 的文件路由。

## 目录结构

- 页面放在 `src/pages/`。
- 共享 UI 组件放在 `src/components/`。
- 布局放在 `src/layouts/`。
- 状态管理放在 `src/stores/`。
- 路由生成类型放在 `src/route-map.d.ts`；把它视为生成产物，不要当作手写源码维护。

## UI 与样式规则

- 创建自定义基础组件前，优先复用现有 `@nuxt/ui` 组件。
- 视觉风格要克制。避免悬浮卡片、激进缩放、厚重阴影，以及偏装饰性的视觉效果干扰产品本身的工具属性。
- 每个页面和组件都必须兼容窄屏和宽屏。
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
- 修改路由时，要保持与现有文件路由机制兼容，不要再引入一套并行的手写路由约定。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm typecheck
```

## 验证规则

- 修改前端源码后，执行 `pnpm typecheck`。
- 如果改动涉及路由、Vite 配置、应用启动代码，或任何可能影响生产构建的部分，再执行 `pnpm build`。
- 如果共享类型发生变化，在共享包更新后重新执行前端验证。
