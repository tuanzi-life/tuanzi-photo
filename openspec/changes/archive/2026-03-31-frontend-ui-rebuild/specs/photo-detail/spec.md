## ADDED Requirements

### Requirement: 查看照片详情

系统 SHALL 允许用户点击照片缩略图查看详情，包括大图预览、文件信息和操作按钮。

#### Scenario: Desktop 点击照片

- **WHEN** 用户在 Desktop 布局点击照片缩略图
- **THEN** 页面显示全屏半透明遮罩，中央弹出详情卡片，左侧大图预览，右侧显示文件名、标签、操作按钮

#### Scenario: Mobile 点击照片

- **WHEN** 用户在 Mobile 布局点击照片缩略图
- **THEN** 页面底部弹出 Sheet，包含拖拽把手、图片预览、文件信息、操作按钮

#### Scenario: 关闭详情

- **WHEN** 用户点击遮罩区域（Desktop）或关闭按钮
- **THEN** 详情面板关闭，photoStore.currentPhoto 置为 null

### Requirement: 推送照片到墨水屏

系统 SHALL 在照片详情中提供"推送到墨水屏"操作。

#### Scenario: 点击推送按钮

- **WHEN** 用户在照片详情中点击"推送到墨水屏"按钮
- **THEN** 调用 photoStore.pushToScreen，模拟推送成功

### Requirement: 删除照片

系统 SHALL 在照片详情中提供删除照片操作。

#### Scenario: 点击删除按钮

- **WHEN** 用户在照片详情中点击"删除图片"按钮
- **THEN** 调用 photoStore.deletePhoto，从列表中移除该照片，关闭详情面板
