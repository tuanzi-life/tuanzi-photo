## ADDED Requirements

### Requirement: battery store 持有电量状态并提供轮询

系统 SHALL 提供 `stores/battery.ts` Pinia store，持有 `percent: number | null` 状态（null 表示尚未获取或不可用）。Store SHALL 提供 `fetchBattery()` action 和 `startPolling()` action。

#### Scenario: 首次加载获取电量

- **WHEN** `fetchBattery()` 被调用且 API 返回成功
- **THEN** `percent` 更新为返回的数值，类型为 number

#### Scenario: API 失败时静默降级

- **WHEN** `fetchBattery()` 被调用但 `/api/v1/battery` 返回非 0 code 或网络错误
- **THEN** `percent` 保持不变（不重置为 null，不弹 toast），错误被静默吞掉

### Requirement: 轮询每 10 秒自动刷新电量

系统 SHALL 在 `startPolling()` 被调用时立即执行一次 `fetchBattery()`，并设置 10000ms interval 持续刷新。返回值 SHALL 为清理函数（调用后停止 interval）。

#### Scenario: 轮询启动

- **WHEN** `startPolling()` 被调用
- **THEN** 立即触发一次电量请求，并设置 10s 周期性请求

#### Scenario: 清理函数停止轮询

- **WHEN** `startPolling()` 返回的清理函数被调用
- **THEN** 后续不再发起电量请求

### Requirement: Layout 在挂载/卸载时管理轮询生命周期

系统 SHALL 在 `DesktopLayout.vue` 和 `MobileLayout.vue` 的 `onMounted` 中调用 `batteryStore.startPolling()`，并在 `onUnmounted` 中调用返回的清理函数，避免内存泄漏。

#### Scenario: 组件挂载启动轮询

- **WHEN** DesktopLayout 或 MobileLayout 挂载
- **THEN** battery store 开始轮询

#### Scenario: 组件卸载清理轮询

- **WHEN** DesktopLayout 或 MobileLayout 卸载
- **THEN** interval 被清除，不再发起请求

### Requirement: AppHeader 显示电量指示器

系统 SHALL 在 `AppHeader.vue` 中接入 battery store，当 `percent !== null` 时在 header 右侧上传按钮左边显示电量图标（`i-lucide-battery-medium`）和 `{percent}%` 文字，当 `percent === null` 时不渲染该区域。

#### Scenario: 电量数据可用时显示

- **WHEN** `batteryStore.percent` 为有效数字
- **THEN** Header 右侧显示电量图标和百分比文字

#### Scenario: 电量数据不可用时隐藏

- **WHEN** `batteryStore.percent` 为 null（开发环境或硬件异常）
- **THEN** Header 不显示电量相关 UI，布局不受影响

### Requirement: MobileHeader 显示电量指示器

系统 SHALL 在 `MobileHeader.vue` 中以与 AppHeader 相同的逻辑显示电量指示器，样式保持紧凑（适配 h-12 移动端 header）。

#### Scenario: 移动端电量数据可用时显示

- **WHEN** `batteryStore.percent` 为有效数字
- **THEN** MobileHeader 右侧动作区中显示小尺寸电量图标和百分比

#### Scenario: 移动端电量数据不可用时隐藏

- **WHEN** `batteryStore.percent` 为 null
- **THEN** MobileHeader 不显示电量 UI，上传按钮正常显示
