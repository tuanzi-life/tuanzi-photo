import Fastify from "fastify";
import staticFiles from "@fastify/static";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import dbPlugin from "./plugins/db.js";
import screenPlugin from "./plugins/screen.js";
import photosRoutes from "./routes/photos.js";
import tagsRoutes from "./routes/tags.js";
import scheduleRoutes from "./routes/schedule.js";
import multipart from "@fastify/multipart";
import { err } from "./utils/response.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// 全局错误处理：将所有错误统一包装为 ApiResponse 格式
app.setErrorHandler<Error>((error, _request, reply) => {
  if ("validation" in error && error.validation) {
    return reply.send(err(400, "参数校验失败"));
  }
  app.log.error(error);
  return reply.send(err(500, "服务器内部错误"));
});

// 注册插件
await app.register(dbPlugin);
await app.register(screenPlugin);
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// 生产环境托管前端构建产物
if (env.nodeEnv === "production") {
  const frontendDist = join(__dirname, "../../frontend/dist");
  await app.register(staticFiles, {
    root: frontendDist,
    prefix: "/",
    // 不开启通配，手动注册 SPA fallback 以避免与 API 路由冲突
    wildcard: false,
  });
}

// 注册路由
await app.register(photosRoutes, { prefix: "/api/v1" });
await app.register(tagsRoutes, { prefix: "/api/v1" });
await app.register(scheduleRoutes, { prefix: "/api/v1" });

app.get("/health", async () => {
  return { status: "ok" };
});

// SPA fallback：所有非 API、非静态资源的请求返回 index.html
if (env.nodeEnv === "production") {
  app.setNotFoundHandler((_request, reply) => {
    reply.sendFile("index.html");
  });
}

await app.listen({ port: env.port, host: env.host });
