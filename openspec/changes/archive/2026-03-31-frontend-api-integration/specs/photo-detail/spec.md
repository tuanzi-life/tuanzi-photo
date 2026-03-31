## MODIFIED Requirements

### Requirement: 推送照片到墨水屏

系统 SHALL 在照片详情中提供"推送到墨水屏"操作。

#### Scenario: 点击推送按钮

- **WHEN** 用户在照片详情中点击"推送到墨水屏"按钮
- **THEN** 调用 `photoStore.pushToScreen(id)`，发起真实 API 请求；成功时 toast 提示"推送成功，正在刷新"；墨水屏忙时 toast 提示"墨水屏正在刷新，请稍后再试"

### Requirement: 删除照片

系统 SHALL 在照片详情中提供删除照片操作。

#### Scenario: 点击删除按钮

- **WHEN** 用户在照片详情中点击"删除图片"按钮
- **THEN** 调用 `photoStore.deletePhoto(id)`，发起真实 DELETE 请求；成功时从列表移除该照片并关闭详情面板；失败时 toast 显示错误信息
