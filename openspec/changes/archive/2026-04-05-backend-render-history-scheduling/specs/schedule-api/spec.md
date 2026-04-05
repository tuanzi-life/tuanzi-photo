## ADDED Requirements

### Requirement: 后台任务每个整点检查定时刷新
系统 SHALL 注册一个每个整点执行的后台任务，并由该任务请求 `POST /api/v1/schedule/trigger` 以复用现有调度入口；该接口用于程序内部触发，不承担用户手动刷新职责。

#### Scenario: 到达整点时发起调度检查
- **WHEN** 系统时间到达任意整点
- **THEN** 后台任务请求一次 `POST /api/v1/schedule/trigger`

### Requirement: 定时刷新优先选择低渲染次数照片
系统 SHALL 在定时刷新选图时优先选择历史成功渲染总次数最少的候选照片，并使用当前刷新规则决定同次数照片的最终顺序。

#### Scenario: 存在未成功渲染过的候选照片
- **WHEN** 当前候选照片中同时包含从未成功渲染过的照片和已成功渲染过的照片
- **THEN** 系统优先从成功渲染次数为 `0` 的照片中选择本次推送目标

#### Scenario: 候选照片成功渲染次数相同时按刷新规则决策
- **WHEN** 多张候选照片的成功渲染总次数相同
- **THEN** 系统在 `refreshRule = time` 时按 `created_at` 最早优先，在 `refreshRule = random` 时从这些同分照片中随机选取一张

## RENAMED Requirements

### Requirement: 立即触发墨水屏刷新
FROM: `立即触发墨水屏刷新`
TO: `内部定时触发墨水屏刷新`

## MODIFIED Requirements

### Requirement: 内部定时触发墨水屏刷新
系统 SHALL 提供 `POST /api/v1/schedule/trigger` 接口作为内部调度触发入口，但该接口在真正执行选图和推送前必须先判断当前是否满足定时配置；只有满足时才触发后续逻辑，并将成功或失败结果记录为 `schedule` 类型的渲染历史。

#### Scenario: 当前达到触发时间且推送成功
- **WHEN** 后台任务请求 `POST /api/v1/schedule/trigger`，当前满足定时配置且无刷新任务在进行
- **THEN** 响应 200，`code` 为 `0`，`data` 为 `null`；系统选取一张候选照片并异步调用 Python 脚本执行推送，同时在成功完成后写入 `type = schedule`、`result = success` 的历史记录

#### Scenario: 当前未达到触发时间
- **WHEN** 后台任务请求 `POST /api/v1/schedule/trigger`，当前不满足定时配置
- **THEN** 响应 200，`code` 为 `0`，`data` 为 `null`，且系统不执行选图、不调用墨水屏推送、不写入渲染历史

#### Scenario: interval 模式按每日零点起算
- **WHEN** 当前配置为 `refreshMode = interval` 且 `intervalHours = 4`
- **THEN** 系统仅在每日 `00:00`、`04:00`、`08:00`、`12:00`、`16:00`、`20:00` 这些整点触发后续推送逻辑

#### Scenario: 刷新锁冲突
- **WHEN** 后台任务请求 `POST /api/v1/schedule/trigger`，当前满足定时配置但已有刷新任务在进行
- **THEN** 响应 200，`code` 为 `409`，`message` 为"墨水屏正在刷新，请稍后再试"，`data` 为 `null`

#### Scenario: 没有可用照片
- **WHEN** 后台任务请求 `POST /api/v1/schedule/trigger`，当前满足定时配置但 relatedTags 筛选范围内没有任何可用照片
- **THEN** 响应 200，`code` 为 `404`，`message` 为"没有可用的照片"，`data` 为 `null`
