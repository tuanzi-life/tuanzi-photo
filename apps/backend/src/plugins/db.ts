import { DB_DIR, MAIN_DIR, paths } from "#paths";
import fp from "fastify-plugin";
import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  // 确保运行时目录存在
  mkdirSync(DB_DIR, { recursive: true });
  mkdirSync(MAIN_DIR, { recursive: true });

  const db = new Database(paths.dbFile);

  // 开启外键约束
  db.pragma("foreign_keys = ON");

  // 初始化表结构（幂等）
  const schema = readFileSync(paths.schemaFile, "utf-8");
  db.exec(schema);

  fastify.decorate("db", db);

  fastify.addHook("onClose", () => {
    db.close();
  });
});
