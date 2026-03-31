## Why

前端目前所有数据交互均为 mock，后端 REST API 已完整实现；需要将 store 层替换为真实 API 调用，使应用具备实际功能。

## What Changes

- 替换 `usePhotoStore` 中的 mock 数据，对接 `/api/v1/photos` 列表、上传、删除、推送接口
- 替换 `useScheduleStore` 中的 mock，对接 `/api/v1/schedule` 查询/更新接口及 `/api/v1/schedule/trigger` 立即刷新接口
- 移除前端 `Photo` 类型中的 `thumbnailUrl` 扩展字段（后端不提供，改为直接使用 `url`）
- 统一 `Photo.id` 为 `number`（与后端 `PhotoVO.id: number` 对齐）
- 对齐 `ScheduleStore` 字段名与后端 `ScheduleVO` 字段名（`mode→refreshMode`、`hour→timingHour`、`rule→refreshRule`）
- 上传入口改为真实文件选择（`<input type="file">`），支持传入 tags
- 各操作添加 loading 状态和错误提示（toast）

## Capabilities

### New Capabilities

- `photo-api-client`: 封装照片相关 API 请求（列表、上传、删除、推送）
- `schedule-api-client`: 封装定时任务相关 API 请求（查询、保存、触发）

### Modified Capabilities

- `photo-gallery`: 照片列表改为从 API 加载，id 类型由 string 改为 number
- `photo-detail`: 删除和推送操作对接真实 API，增加 loading/错误反馈
- `schedule-panel`: 字段绑定对齐后端字段名，保存/触发对接真实 API

## Impact

- `apps/frontend/src/stores/photo.ts`：移除 mock，接入真实 API
- `apps/frontend/src/stores/schedule.ts`：移除 mock，接入真实 API
- `apps/frontend/src/types/index.ts`：移除 `thumbnailUrl`，`id` 改为 `number`
- `apps/frontend/src/components/AppHeader.vue`：上传按钮改为触发文件选择
- `apps/frontend/src/components/MobileHeader.vue`：同上
- `apps/frontend/src/components/PhotoCard.vue`：`thumbnailUrl` 改用 `url`
- `apps/frontend/src/components/PhotoDetailOverlay.vue`：id 类型对齐
- `apps/frontend/src/components/SchedulePanel.vue`：字段绑定对齐新字段名
- Vite 开发代理已配置 `/api/* → 127.0.0.1:4010`，无需额外配置
