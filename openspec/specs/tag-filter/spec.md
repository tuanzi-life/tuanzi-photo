### Requirement: 标签多选筛选

系统 SHALL 允许用户通过标签筛选照片，支持多选，筛选结果实时更新。

#### Scenario: Desktop 侧边栏标签筛选

- **WHEN** 用户在 Desktop 布局的侧边栏 TagFilter 中点击标签
- **THEN** 该标签切换选中/未选中状态，画廊区照片列表实时更新为匹配结果

#### Scenario: Mobile 标签筛选触发器

- **WHEN** 用户在 Mobile 布局点击标签筛选触发器
- **THEN** 底部弹出 TagSheet，显示所有标签列表（多选），已选标签高亮显示

#### Scenario: Mobile 确认标签选择

- **WHEN** 用户在 TagSheet 中选择标签后点击"确认"按钮
- **THEN** TagSheet 关闭，photoStore.selectedTags 更新，照片列表刷新

#### Scenario: 无标签时的空状态

- **WHEN** photoStore 中没有任何标签（照片列表为空）
- **THEN** TagFilter 显示空状态提示："暂无标签，上传照片后标签会自动出现"

### Requirement: 标签计数展示

系统 SHALL 在每个标签旁显示该标签下的照片数量。

#### Scenario: 标签数量显示

- **WHEN** 用户查看标签列表
- **THEN** 每个标签右侧显示对应的照片数量
