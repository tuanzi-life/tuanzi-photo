import Fastify from "fastify";
import staticFiles from "@fastify/static";
import schedulePlugin from "@fastify/schedule";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AsyncTask, CronJob } from "toad-scheduler";
import { env } from "./env.js";
import dbPlugin from "./plugins/db.js";
import screenPlugin from "./plugins/screen.js";
import photosRoutes from "./routes/photos.js";
import tagsRoutes from "./routes/tags.js";
import scheduleRoutes from "./routes/schedule.js";
import batteryRoutes from "./routes/battery.js";
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
await app.register(schedulePlugin);
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// 生产环境托管前端构建产物
if (env.nodeEnv === "production") {
  const frontendDist = join(__dirname, "../frontend");
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
await app.register(batteryRoutes, { prefix: "/api/v1" });

app.get("/health", async () => {
  return { status: "ok" };
});

// SPA fallback：所有非 API、非静态资源的请求返回 index.html
if (env.nodeEnv === "production") {
  app.setNotFoundHandler((_request, reply) => {
    reply.sendFile("index.html");
  });
}

await app.ready();

const scheduleTriggerTask = new AsyncTask(
  "hourly schedule trigger",
  async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/schedule/trigger",
    });

    if (response.statusCode !== 200) {
      throw new Error(`schedule trigger failed with status ${response.statusCode}`);
    }
  },
  async (error: Error) => {
    app.log.error({ err: error }, "整点定时任务执行失败");
  }
);

const scheduleTriggerJob = new CronJob(
  { cronExpression: "0 * * * *", timezone: "Asia/Shanghai" },
  scheduleTriggerTask,
  { id: "schedule-trigger-hourly", preventOverrun: true }
);

if (!app.scheduler.existsById("schedule-trigger-hourly")) {
  app.scheduler.addCronJob(scheduleTriggerJob);
}

await app.listen({ port: env.port, host: env.host });

const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully`);
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
