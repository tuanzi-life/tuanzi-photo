# backend-graceful-shutdown Specification

## Purpose

定义后端服务在收到操作系统终止信号时的优雅退出行为，确保在途请求处理完成、墨水屏刷新任务有机会自然结束，避免被强制终止导致设备状态异常。

## Requirements

### Requirement: 进程收到终止信号后优雅退出

系统 SHALL 在 `src/app.ts` 中注册 `SIGTERM` 和 `SIGINT` 处理器；收到信号后，SHALL 调用 `fastify.close()` 等待当前所有在途请求处理完成，再以退出码 `0` 退出进程。

#### Scenario: systemd 停止服务时进程正常退出

- **WHEN** 执行 `sudo systemctl stop tuanzi-photo`（systemd 发送 SIGTERM）
- **THEN** 服务日志中出现 shutdown 信息，进程以退出码 `0` 结束，`systemctl status` 显示 `Stopped`

#### Scenario: Ctrl+C 开发环境正常退出

- **WHEN** 开发模式下按 Ctrl+C（发送 SIGINT）
- **THEN** Fastify 关闭所有连接后进程退出，不输出未捕获异常堆栈

### Requirement: systemd 停止超时配置覆盖刷新任务最大耗时

`tuanzi-photo.service` SHALL 设置 `TimeoutStopSec` 为大于 `EPD_RENDER_TIMEOUT_MS`（默认 180s）的值，确保墨水屏刷新任务有机会自然完成，而不被 systemd 的 SIGKILL 强制终止。

#### Scenario: 刷新任务进行中时停止服务

- **WHEN** 墨水屏刷新任务正在执行时执行 `sudo systemctl stop tuanzi-photo`
- **THEN** systemd 等待至少 200s 后才发送 SIGKILL，使刷新任务有机会在超时前完成
