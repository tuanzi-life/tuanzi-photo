# AGENTS.md

这个文件定义了 `packages/shared-types` 目录下的工作规则。

## 目的

- 这个 package 只存放前后端共同使用的 TypeScript 类型定义。

## 规则

- 保持这个 package 为纯类型包，不要加入运行时常量、函数、类或副作用代码。
- 对外暴露的类型模块要通过 `package.json` 中声明的入口导出。
- 新增或删除公开类型模块时，要同步更新 `package.json` 的 `exports`。
- 这里的类型变更要以跨应用兼容性为前提；一次共享类型改动可能同时影响前后端。
- 使用方必须从 `@tuanzi-photo/shared-types` 导入，而不是通过仓库相对路径导入。

## 验证规则

- 修改这个 package 后，执行：

```bash
cd apps/frontend && pnpm typecheck
cd apps/backend && pnpm typecheck
```

- 如果共享类型变更影响到构建期接线或生成产物，再按需执行 `cd apps/backend && pnpm build` 或 `cd apps/frontend && pnpm build`。
