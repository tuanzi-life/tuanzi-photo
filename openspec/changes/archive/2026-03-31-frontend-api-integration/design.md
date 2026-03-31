## Context

前端 store 层（`usePhotoStore`、`useScheduleStore`）目前全为 mock 实现。后端已提供完整 REST API（`/api/v1/photos`、`/api/v1/schedule`），Vite dev server 已配置 `/api/*` 代理到 `127.0.0.1:4010`。

当前类型体系存在两处不一致：

1. 前端 `Photo` 类型有 `thumbnailUrl` 字段，后端无此字段
2. 前端 `Photo.id` 为 `string`，后端 `PhotoVO.id` 为 `number`
3. `ScheduleStore` 字段名（`mode`、`hour`、`rule`）与后端 `ScheduleVO` 字段名（`refreshMode`、`timingHour`、`refreshRule`）不一致

## Goals / Non-Goals

**Goals:**

- 用真实 `fetch` 调用替换全部 mock
- 对齐类型定义，消除运行时类型不一致
- 上传入口支持真实文件选择
- 为异步操作添加 loading 状态和 toast 错误提示

**Non-Goals:**

- 不引入 axios 或其他 HTTP 客户端库（直接用 `fetch`）
- 不重构组件层（只改 store 和类型）
- 不做请求缓存或乐观更新

## Decisions

### 决策 1：不引入独立 API client 层，直接在 store 中 fetch

**选择**：在 store action 中直接调用 `fetch`，不单独创建 `api/` 目录。

**理由**：项目规模小（单页应用，接口不超过 8 个），多一层封装不带来额外价值，反而增加跳转链路。如后续接口数量增多，可以再提取。

**备选方案**：创建 `src/api/photo.ts` / `src/api/schedule.ts` 封装 fetch — 过度设计。

---

### 决策 2：`Photo` 类型直接等同于 `PhotoVO`，移除 `thumbnailUrl`

**选择**：`export type Photo = PhotoVO`，`PhotoCard` 中改用 `url` 显示图片。

**理由**：后端不生成缩略图 URL，前端也无法在不增加后端接口的前提下独立获得。墨水屏相册照片数量有限，直接用原图 URL 即可。

**备选方案**：前端拼接 OSS 图片处理参数（`url + '?x-oss-process=...'`）生成缩略图 — 需要前端感知 OSS 细节，耦合过强，不选。

---

### 决策 3：上传流程改为 Header 内嵌 `<input type="file">` + `uploadPhoto(file, tags)` action

**选择**：`AppHeader` / `MobileHeader` 各自内嵌隐藏 `<input type="file">`，点击按钮触发 input，change 事件后调用 `photoStore.uploadPhoto(file, tags)`。tags 暂时固定为空数组（后续可扩展为弹窗输入）。

**理由**：不需要新增弹窗组件，改动范围最小。

---

### 决策 4：`SchedulePanel` 字段绑定对齐后端，同步修改 store 字段名

**选择**：store state 字段名直接改为 `refreshMode`、`timingHour`、`refreshRule`，`SchedulePanel` 的 `storeToRefs` 解构同步更新。

**理由**：store 与后端 VO 字段名保持一致，减少映射逻辑。

---

### 决策 5：`nextRefreshTime` 显示格式

后端返回 Unix 秒（`number`），前端需格式化为可读字符串。在 store getter 中转换，`SchedulePanel` 直接用格式化后的字符串。

## Risks / Trade-offs

- **上传无 tags 弹窗** → 当前上传默认 tags 为空，用户无法在上传时指定 tags。可接受，后续单独做 tags 编辑功能
- **推送为 fire-and-forget** → 后端推送接口成功仅代表"接受请求"，实际渲染结果无法同步返回。前端仅 toast 提示"推送成功"，不代表墨水屏已完成刷新
- **409 冲突处理** → 墨水屏刷新中时后端返回 409，前端 toast 显示对应错误提示
