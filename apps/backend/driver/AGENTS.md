# AGENTS.md

这个文件定义了 `apps/backend/driver` 目录下的工作规则。

## 适用范围

- `waveshare/`：墨水屏显示驱动及其 Python 入口脚本。
- `ups/`：UPS 电量读取驱动及其 Python 入口脚本。

## 来源与定位

- `waveshare` 和 `ups` 都应视为微雪官方驱动或基于其官方驱动整理的集成代码。
- 这里的代码主要职责是和硬件交互，不承载后端业务规则；业务编排应放在 `apps/backend/src/` 中。
- 修改驱动目录前，优先判断问题是否应该在 Node 侧调用逻辑、路径解析、超时控制或错误处理层解决，而不是直接改 Python 驱动。

## 驱动规则

- Node 侧通过 `child_process.spawn()` 调用这里的 Python 入口脚本：
  - `waveshare/render_photo.py`
  - `ups/read_battery.py`
- 不要把这些 Python 脚本改成由 Node 直接 import、嵌入源码字符串执行，或改成其他调用方式，除非需求明确变化。
- `render_photo.py` 当前接口约定是接收一个图片路径参数，退出码 `0` 表示成功，非 `0` 表示失败。
- `read_battery.py` 当前接口约定是向标准输出写一行 JSON，退出码 `0` 表示成功，非 `0` 表示失败。
- 如果必须修改脚本入参、stdout/stderr 格式、退出码语义或工作目录假设，必须同步更新 `apps/backend/src/services/photo-render.service.ts` 或 `apps/backend/src/services/battery.service.ts`。
- 驱动文件依赖真实硬件、SPI/I2C、GPIO 和 Python 运行环境。没有明确理由时，不要重写为其他语言，不要替换底层厂商库。
- 保持 `setup.py` 可用，因为发布脚本会通过 `pip3 install -e` 安装 `waveshare` 和 `ups` 的 Python 依赖。
- 保持脚本相对目录结构稳定，尤其是 `waveshare/lib/`、`waveshare/font/`、`render_photo.py` 和 `INA219.py` 的位置；Node 与 Python 代码都依赖这些路径。

## 修改原则

- 优先做最小改动。供应商驱动代码不要进行无关格式化、大规模重排或“现代化重写”。
- 如果只是修复日志、容错、超时或参数校验，优先保持对现有调用接口兼容。
- 任何可能影响硬件初始化、休眠、清理、I2C 读数或 GPIO/SPI 访问顺序的改动，都应假设为高风险改动。
- 除非任务明确要求，否则不要在这里引入新的 Python 依赖。

## 验证规则

- 修改 `driver/` 下文件后，至少执行 `cd apps/backend && pnpm build`，确认驱动目录会被正确复制到 `dist/driver/`。
- 如果改动影响 Python 入口脚本的调用约定，还要同时检查对应的 Node 调用方：
  - `src/services/photo-render.service.ts`
  - `src/services/battery.service.ts`
- 如果环境允许，优先做一次真实硬件验证；如果做不到，要明确说明未验证硬件调用链路。
