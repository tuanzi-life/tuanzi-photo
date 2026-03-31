## MODIFIED Requirements

### Requirement: 上传照片入口

系统 SHALL 在页面顶部提供上传照片的按钮入口。

#### Scenario: Desktop 上传按钮

- **WHEN** 用户在 Desktop 布局查看页面
- **THEN** AppHeader 右侧显示"上传图片"按钮（带加号图标）

#### Scenario: Mobile 上传按钮

- **WHEN** 用户在 Mobile 布局查看页面
- **THEN** MobileHeader 右侧显示"上传"按钮

#### Scenario: 点击上传按钮

- **WHEN** 用户点击上传按钮
- **THEN** 触发隐藏的 `<input type="file">` 文件选择对话框

#### Scenario: 选择文件后上传

- **WHEN** 用户在文件选择对话框中选择了一个图片文件
- **THEN** 调用 `photoStore.uploadPhoto(file, [])` 发起真实上传请求，上传期间按钮显示 loading 状态
