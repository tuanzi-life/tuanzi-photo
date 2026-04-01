# tuanzi-photo

运行在树莓派 Zero 2W 上的 E-ink 6 色墨水屏电子相册。前端由开发机构建后通过 git 分发，后端在树莓派本地构建，通过 systemd 管理服务。

## 仓库结构

```
apps/frontend/        Vue 3 + Vite 前端源码
apps/backend/         Fastify v5 后端源码
packages/shared-types 前后端共享 TypeScript 类型
scripts/              部署与构建脚本
release/frontend/     前端构建产物（git 追踪，由开发机生成）
release/VERSION       当前前端版本号（git 追踪）
data/                 运行时数据，不提交到版本库
```

## 部署流程

### 前置条件

- 开发机：Node.js >= 18.12、pnpm
- 树莓派：Node.js >= 18.12、pnpm、Python 3（用于墨水屏驱动）

---

### 第一步：配置后端环境变量（首次部署）

在树莓派上创建并编辑 `apps/backend/.env`：

```bash
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env
```

需要填写的关键配置：

```dotenv
NODE_ENV=production

# 阿里云 OSS 图片存储
OSS_REGION="oss-cn-xxx"
OSS_ENDPOINT="oss-cn-xxx.aliyuncs.com"
OSS_BUCKET="your-bucket"
OSS_ACCESS_KEY_ID="your-key-id"
OSS_ACCESS_KEY_SECRET="your-key-secret"
```

其余字段保持默认值即可。

---

### 第二步：构建前端（开发机执行）

每次前端代码有变更时，在**开发机**上执行：

```bash
pnpm build:frontend
```

脚本会：

1. 执行 `vite build` 构建前端
2. 将产物同步到 `release/frontend/`
3. 将 `package.json` 中的版本号写入 `release/VERSION`

构建完成后，按提示提交并推送产物：

```bash
git add release/frontend release/VERSION
git commit -m "chore: release frontend artifacts"
git push
```

---

### 第三步：在树莓派上部署

首次部署或每次更新时，在**树莓派**上执行：

```bash
git pull
pnpm run:pi
```

该脚本会：

1. 停止正在运行的服务（释放内存）
2. 安装依赖
3. 构建后端，将产物移动到 `release/backend/`
4. 将 `apps/backend/.env` 复制到 `release/.env`
5. 安装并启动 systemd 服务 `tuanzi-photo.service`

服务启动后监听 `0.0.0.0:4010`，同时托管前端静态文件。

---

### 仅更新前端（无后端变更）

如果只有前端变更，树莓派无需重新构建后端，只需拉取最新产物并重启服务：

```bash
git pull
sudo systemctl restart tuanzi-photo.service
```

---

### 仅更新后端（无前端变更）

```bash
git pull
pnpm build:backend
sudo systemctl restart tuanzi-photo.service
```

---

## 服务管理

```bash
# 查看服务状态
sudo systemctl status tuanzi-photo.service

# 重启服务
sudo systemctl restart tuanzi-photo.service

# 查看实时日志
sudo journalctl -fu tuanzi-photo.service
```

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动后端（热重载）
cd apps/backend && pnpm dev

# 启动前端开发服务器（代理到后端 4010）
cd apps/frontend && pnpm dev
```

前端开发服务器运行在 `http://127.0.0.1:4011`，`/api/*` 请求自动代理到后端。
