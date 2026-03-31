## 1. 类型定义对齐

- [x] 1.1 修改 `apps/frontend/src/types/index.ts`：将 `Photo` 改为 `type Photo = PhotoVO`，移除 `thumbnailUrl` 扩展字段；将 `ScheduleConfig` 改为 `type ScheduleConfig = ScheduleVO`
- [x] 1.2 修改 `PhotoCard.vue`：将 `photo.thumbnailUrl` 改为 `photo.url`

## 2. 照片 Store 接入 API

- [x] 2.1 修改 `usePhotoStore` state：移除 mock 数据，添加 `loading: false` 状态
- [x] 2.2 实现 `fetchPhotos`：调用 `GET /api/v1/photos`，成功存入 `photos`，失败 toast 报错
- [x] 2.3 实现 `uploadPhoto(file: File, tags: string[])`：multipart POST `/api/v1/photos/upload`，成功 prepend 到 `photos` 并 toast"上传成功"
- [x] 2.4 实现 `deletePhoto(id: number)`：DELETE `/api/v1/photos/:id`，成功从 `photos` 移除并清除 `currentPhoto`
- [x] 2.5 实现 `pushToScreen(id: number)`：POST `/api/v1/photos/:id/push`，处理 409/其他错误，成功 toast"推送成功，正在刷新"

## 3. 定时任务 Store 接入 API

- [x] 3.1 修改 `useScheduleStore` state：字段名对齐后端（`refreshMode`、`timingHour`、`refreshRule`、`relatedTags`、`nextRefreshTime: number`）
- [x] 3.2 实现 `fetchSchedule`：GET `/api/v1/schedule`，成功将 `data` 字段写入 store
- [x] 3.3 实现 `saveSchedule`：PUT `/api/v1/schedule`，body 取当前 store state，成功 toast"保存成功"
- [x] 3.4 实现 `triggerRefresh`：POST `/api/v1/schedule/trigger`，处理 409/404，成功 toast"已触发刷新，正在刷新"

## 4. SchedulePanel 字段绑定对齐

- [x] 4.1 修改 `SchedulePanel.vue` 的 `storeToRefs` 解构：`mode→refreshMode`、`hour→timingHour`、`rule→refreshRule`、`selectedTags→relatedTags`
- [x] 4.2 修改 `SchedulePanel.vue` 中 `nextRefreshTime` 的显示：将 Unix 秒转换为本地可读时间字符串（`new Date(ts * 1000).toLocaleString()`）

## 5. 上传入口改为真实文件选择

- [x] 5.1 修改 `AppHeader.vue`：添加隐藏 `<input type="file" accept="image/*">`，按钮点击触发 input；文件选中后调用 `uploadPhoto(file, [])`，上传期间按钮 loading
- [x] 5.2 修改 `MobileHeader.vue`：同上
