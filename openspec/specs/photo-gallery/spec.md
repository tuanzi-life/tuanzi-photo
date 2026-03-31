### Requirement: 展示照片网格

系统 SHALL 在主页展示所有照片的缩略图网格。Desktop 布局下多列展示，Mobile 布局下固定 2 列展示。

#### Scenario: 有照片时展示网格

- **WHEN** photoStore 中存在照片数据
- **THEN** 页面展示照片缩略图网格，每张图片可点击

#### Scenario: 无照片时展示空状态

- **WHEN** photoStore 中照片列表为空
- **THEN** 页面展示空状态组件，包含图标、"还没有照片"标题和引导文字

### Requirement: 统计信息展示

系统 SHALL 在画廊区顶部展示照片统计信息。

#### Scenario: Desktop 统计栏

- **WHEN** 用户访问 Desktop 布局
- **THEN** 画廊区顶部显示"共 N 张照片 · 已选 M 个 Tag · K 张结果"

#### Scenario: Mobile 统计卡片

- **WHEN** 用户访问 Mobile 布局
- **THEN** 页面顶部显示大号照片总数和副标题文字

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
