import fp from "fastify-plugin";
import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../../../../data/db/main.db");
const SCHEMA_PATH = resolve(__dirname, "../../sql/schema.sql");

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  // 确保 data/db 目录存在
  mkdirSync(dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);

  // 开启外键约束
  db.pragma("foreign_keys = ON");

  // 初始化表结构（幂等）
  const schema = readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);

  // 迁移：为旧版 photo 表补充 object_key 列
  try {
    db.exec("alter table photo add column object_key text not null default ''");
  } catch {
    // 列已存在，忽略
  }

  // 迁移：移除旧版 photo 表中不再使用的 url 列
  try {
    db.exec("alter table photo drop column url");
  } catch {
    // 列不存在或 SQLite 版本不支持，忽略
  }

  fastify.decorate("db", db);

  fastify.addHook("onClose", () => {
    db.close();
  });
});
