## Context

树莓派 Zero 2W（512MB RAM）通过微雪 UPS HAT 供电，HAT 上集成 INA219 电流传感器（I²C 地址 0x43）。官方提供 `driver/ups/INA219.py`，包含 INA219 Python 类及无限循环的 `__main__` 演示块，不可修改。后端已有通过 `child_process.spawn` 调用 Python 的成熟模式（`display.service.ts` / `render_photo.py`），本次沿用该模式。

## Goals / Non-Goals

**Goals:**

- 以最小侵入实现 INA219 读取：包装层 import 官方类，一次性读取后 exit
- 通过 REST API 将电量暴露给前端，格式与现有 `ApiResponse<T>` 一致
- 前端每 10s 轮询一次，静默降级（无硬件时不报错）
- 桌面端和移动端 Header 均显示电量百分比 + 图标

**Non-Goals:**

- 不实现低电量推送通知
- 不持久化历史电量数据
- 不在开发机上模拟 INA219（无 smbus 时 API 返回 500，前端降级不显示）
- 不修改 INA219.py 官方源码

## Decisions

### D1：Python 包装脚本 vs 直接在 Node.js 用 I²C 库

选择 **Python 包装脚本**（`driver/ups/read_battery.py`）。

- INA219.py 是官方 Python SDK，已验证过校准参数（addr=0x43、16V_5A 配置）。若在 Node.js 用 i2c-bus 重新实现，需要重新推导所有寄存器位操作，容易出错且失去官方保障
- 与 `render_photo.py` 保持一致的集成模式，无新的架构概念引入
- 包装脚本以 `import INA219` 方式复用官方类，不修改源文件

脚本行为：一次性读取所有字段，stdout 输出单行 JSON，exit 0；读取失败 exit 1 并将错误写入 stderr。

### D2：Battery Service 的超时设定

设置 **5s 超时**（`EPD_PYTHON_BIN` 与 `render_photo.py` 复用同一 pythonBin，但 timeout 独立配置）。

- INA219 I²C 读取通常 <200ms；5s 给足容错空间，同时远短于 180s 的渲染超时
- 超时后 SIGTERM → 3s 后 SIGKILL，与 `runRenderProcess` 保持一致

### D3：前端轮询策略

使用 **`setInterval` + 首次立即调用**，在 Layout 的 `onMounted` 触发，`onUnmounted` 清理。

- 不使用 `useIntervalFn`（VueUse）以减少依赖引入
- 请求失败时静默（不弹 toast），仅保持 `percent` 为上次成功值或 null
- 组件中只有当 `percent !== null` 时才渲染电量 UI，避免初始闪烁

### D4：共享类型 BatteryVO 字段

```ts
export interface BatteryVO {
  percent: number; // 0-100，保留1位小数
  voltage: number; // V，保留3位小数
  current_mA: number; // mA，保留1位小数
  power_W: number; // W，保留3位小数
}
```

前端只用 `percent` 做显示，其余字段保留供未来调试/图表需求。

### D5：百分比计算公式

沿用官方 `__main__` 中的公式：`p = (bus_voltage - 3) / 1.2 * 100`，clamp 到 `[0, 100]`。这与微雪对 3.0V（0%）至 4.2V（100%）的锂电规格匹配。

### D6：UPS Python 依赖安装方式

`INA219.py` 依赖 `smbus`（系统级 C 扩展，通过 `apt install python3-smbus` 安装）。pip 生态中与其兼容的替代是 `smbus2`（纯 Python，积极维护），但 import 名不同（`import smbus2` vs `import smbus`）。

**方案：**

- 新建 `driver/ups/setup.py`，声明 `install_requires=['smbus2']`，结构与 `driver/waveshare/setup.py` 一致
- `read_battery.py` 在 import INA219 之前先做兼容 shim：

  ```python
  try:
      import smbus  # 系统已安装 python3-smbus 时走这里
  except ImportError:
      import smbus2 as smbus  # pip install smbus2 时走这里
      import sys
      sys.modules['smbus'] = smbus  # 让 INA219.py 的 import smbus 能找到
  ```

- `scripts/build-backend.sh` 的 `install_driver_deps()` 扩展为同时处理 `driver/ups`，与 waveshare 保持一致的 `pip3 install -e` 调用

这样在树莓派系统 smbus 存在时优先用系统版本，仅在缺失时回退到 smbus2，同时不修改 INA219.py 的任何代码。

## Risks / Trade-offs

- **[硬件不可用]** 开发环境没有 INA219，`smbus` import 失败 → Python 脚本 exit 1，Node.js 抛错，API 返回 500，前端不显示电量。可接受的降级，无需额外处理。
- **[进程开销]** 每 10s fork 一次 Python 进程，但 INA219 读取极快（<200ms），进程生命周期短，不会积压。如果频率过高可通过环境变量调整，但当前 10s 无需优化。
- **[I²C 并发]** 若渲染屏幕（render_photo.py）和 battery 读取同时运行，两者访问不同 I²C 设备（epd 用 SPI，INA219 用 I²C），不存在资源竞争。

## Migration Plan

1. 合并代码后后端重启即生效，无需数据库迁移
2. 前端构建部署后自动开始轮询
3. 回滚：恢复 app.ts（移除 battery 路由注册）+ 前端还原 Header 组件即可，无状态无持久化
