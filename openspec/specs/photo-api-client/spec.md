### Requirement: 获取照片列表

`usePhotoStore` 的 `fetchPhotos` action SHALL 调用 `GET /api/v1/photos`，将返回的 `PhotoVO[]` 存入 `photos` state，并在请求期间将 `loading` 置为 `true`。

#### Scenario: 请求成功

- **WHEN** 调用 `fetchPhotos()`
- **THEN** 发起 `GET /api/v1/photos` 请求，响应 `code === 0` 时将 `data.items` 存入 `photos`，`loading` 恢复 `false`

#### Scenario: 请求失败

- **WHEN** 请求返回非 0 code 或网络错误
- **THEN** `photos` 保持不变，`loading` 恢复 `false`，toast 显示错误信息

---

### Requirement: 上传照片

`uploadPhoto(file: File, tags: string[])` action SHALL 通过 `multipart/form-data` 调用 `POST /api/v1/photos/upload`，上传成功后将新照片追加到 `photos` 列表头部。

#### Scenario: 上传成功

- **WHEN** 调用 `uploadPhoto(file, tags)`
- **THEN** 发起 multipart POST 请求（字段 `file` + `tags` 逗号拼接），响应 `code === 0` 时将 `data` prepend 到 `photos`，toast 显示"上传成功"

#### Scenario: 上传失败

- **WHEN** 服务端返回非 0 code 或网络错误
- **THEN** `photos` 不变，toast 显示错误信息

---

### Requirement: 删除照片

`deletePhoto(id: number)` action SHALL 调用 `DELETE /api/v1/photos/:id`，成功后从 `photos` 中移除该项。

#### Scenario: 删除成功

- **WHEN** 调用 `deletePhoto(id)`
- **THEN** 发起 DELETE 请求，响应 `code === 0` 时从 `photos` 过滤移除，若 `currentPhoto.id === id` 则同时将 `currentPhoto` 置为 `null`

#### Scenario: 删除失败

- **WHEN** 服务端返回 404 或其他错误
- **THEN** `photos` 不变，toast 显示错误信息

---

### Requirement: 推送照片到墨水屏

`pushToScreen(id: number)` action SHALL 调用 `POST /api/v1/photos/:id/push`，成功时 toast 提示"推送成功，正在刷新"。

#### Scenario: 推送成功

- **WHEN** 调用 `pushToScreen(id)`
- **THEN** 发起 POST 请求，响应 `code === 0` 时 toast 提示"推送成功，正在刷新"

#### Scenario: 墨水屏正在刷新（409）

- **WHEN** 服务端返回 `code === 409`
- **THEN** toast 显示"墨水屏正在刷新，请稍后再试"

#### Scenario: 推送失败（其他错误）

- **WHEN** 服务端返回其他非 0 code 或网络错误
- **THEN** toast 显示错误信息
