# AGENTS.md

This file provides guidance to **Coding Agent** when working with code in this repository.

## 项目概述

树莓派 Zero 2W（512MB RAM）+ E6 6色墨水屏电子相册。pnpm monorepo，前后端分离。

## 架构

```
apps/frontend   Vue 3 + Vite + @nuxt/ui v4 + @iconify/vue + vue-router v5（文件路由）
apps/backend    Fastify v5 + better-sqlite3 + sharp
packages/       共享库
data/           运行时数据，不进版本控制（db/、uploads/、cache/、logs/）
```

**开发环境**：访问 `127.0.0.1:4011`，Vite 将 `/api/*` 代理到 `127.0.0.1:4010`

**生产环境**：只跑 Fastify（4010），`NODE_ENV=production` 时自动用 `@fastify/static` 托管 `apps/frontend/dist/`

前端路由使用 `vue-router/vite` 插件（文件路由），页面放在 `src/pages/`，类型声明自动生成到 `src/route-map.d.ts`。

## 常用命令

```bash
# 根目录
pnpm install          # 安装所有 workspace 依赖
pnpm format           # prettier 格式化全项目（apps/ + packages/）

# 前端 apps/frontend
pnpm dev              # Vite dev server，端口 4011
pnpm build            # 构建到 dist/
pnpm typecheck        # vue-tsc 类型检查
pnpm lint             # eslint

# 后端 apps/backend
pnpm dev              # tsx watch，端口 4010
pnpm build            # tsc 编译到 dist/
pnpm start            # 生产启动（NODE_ENV=production）
```

## 关键约束

- **内存**：Node.js 生产启动加 `--max-old-space-size=128`，sharp 处理完立即释放，不缓存在内存
- **墨水屏刷新锁**：`isRefreshing` 布尔锁，刷新中返回 409 拒绝重复请求，不用队列
- **图片处理**：上传时预处理为6色图并缓存，刷屏时直接读取缓存文件
- **墨水屏驱动**：Python 脚本（厂商 SPI 驱动），后端通过 `child_process` 调用

## 前端设计规范

项目使用 nuxt-ui 组件库，在创建组件之前，调用 nuxt-ui skill 去了解 nuxt-ui 的组件列表。

设计组件样式时要求谨慎、克制，避免上浮、缩放、大阴影等效果。

在设计任何页面或组件时，需要做到兼容不同屏幕宽度。

### 颜色定义

为了方便统一管理颜色、主题，尽量不要直接使用 tailwindcss 的直接指定颜色的 class（例如 bg-green-500、border-amber-200 等）。

应该直接使用 nuxt-ui 语义化的颜色，这样可以通过配置文件做统一调整。

- `<UButton color="primary">A Button</UButton>`
- `<p class="text-primary bg-secondary ring ring-default">`
- 除特殊情况，最好保持此设计规则。

当前 nuxt-ui 的语义化颜色：

- primary：默认 green
- secondary：默认 blue
- success：默认 green
- info：默认 blue
- warning：默认 yellow
- error：默认 red
- neutral：默认 slate

## 后端设计规范

### 数据库

SQLite，路径 `data/db/main.db`，使用 better-sqlite3 同步驱动。
