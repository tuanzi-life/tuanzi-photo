import Fastify from "fastify";
import staticFiles from "@fastify/static";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// 生产环境托管前端构建产物
if (process.env.NODE_ENV === "production") {
  await app.register(staticFiles, {
    root: join(__dirname, "../../frontend/dist"),
    prefix: "/",
  });
}

app.get("/health", async () => {
  return { status: "ok" };
});

const port = 4010;
const host = "0.0.0.0";

await app.listen({ port, host });
