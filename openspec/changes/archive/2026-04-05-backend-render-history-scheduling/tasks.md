## 1. 依赖与基础路径

- [x] 1.1 在 `apps/backend` 安装 `@fastify/schedule` 和 `toad-scheduler`
- [x] 1.2 更新 `apps/backend/src/paths.ts`，补充 `data/main/` 与 `render_history.json` 的路径约定
- [x] 1.3 确认启动流程会创建新增目录所需的父路径，避免首次写入 `render_history.json` 失败

## 2. 数据库与渲染历史服务

- [x] 2.1 更新 `apps/backend/sql/schema.sql`，新增 `render_history` 表及字段约束
- [x] 2.2 明确 `render_history.time` 使用 Unix 时间戳，并让 `photo_id` 不做级联删除约束
- [x] 2.3 新增 `apps/backend/src/services/render-history.service.ts`，封装渲染历史写入逻辑
- [x] 2.4 在 `render-history.service.ts` 中实现本地 JSON 计数文件的读取、创建与成功渲染次数递增逻辑
- [x] 2.5 统一手动推送和定时推送的结果记录格式，确保成功写入 `success`，失败写入失败原因
- [x] 2.6 处理 `render_history.json` 写入失败场景，仅记录日志且不影响主流程

## 3. 定时判断与均衡选图

- [x] 3.1 在 `apps/backend/src/services/schedule.service.ts` 中新增“当前是否到达触发时间”的判断函数，覆盖 `timing` 与 `interval` 两种模式
- [x] 3.2 将 `interval` 模式固定为从每日 `00:00` 起按 `intervalHours` 划分整点触发槽位
- [x] 3.3 重构 `pickPhotoForRefresh`，按 `manual + schedule` 总成功次数优先选择候选照片
- [x] 3.4 在最低渲染次数候选集合内保留现有 `refreshRule` 语义，分别处理 `time` 和 `random`

## 4. 路由与推送流程

- [x] 4.1 修改 `apps/backend/src/routes/schedule.ts`，让 `POST /schedule/trigger` 先判断是否应触发，未到时间时直接返回成功空操作
- [x] 4.2 在定时推送流程中接入渲染历史记录，并在推送失败时保留错误信息
- [x] 4.3 修改 `apps/backend/src/routes/photos.ts`，让手动推送流程同样记录 `manual` 类型的渲染历史
- [x] 4.4 保持现有 `isRefreshing` 锁语义，避免引入排队或重复推送行为

## 5. 整点后台调度

- [x] 5.1 在后端应用中注册 `@fastify/schedule` 插件与每个整点执行一次的任务
- [x] 5.2 让整点任务通过现有 `POST /api/v1/schedule/trigger` 入口触发调度检查，优先复用 Fastify 内部请求能力
- [x] 5.3 确认应用关闭时后台调度任务能随 Fastify 生命周期正确释放

## 6. 验证

- [x] 6.1 在 `apps/backend` 执行 `pnpm typecheck`
- [x] 6.2 在 `apps/backend` 执行 `pnpm build`
