import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, "..");

// 复制 driver 目录
const driverSrc = resolve(backendRoot, "driver");
const driverDst = resolve(backendRoot, "dist/driver");
if (!existsSync(driverSrc)) {
  throw new Error(`driver directory not found: ${driverSrc}`);
}
rmSync(driverDst, { recursive: true, force: true });
mkdirSync(dirname(driverDst), { recursive: true });
cpSync(driverSrc, driverDst, { recursive: true });

// 复制 sql 目录，使 dist 成为自包含的可部署产物
const sqlSrc = resolve(backendRoot, "sql");
const sqlDst = resolve(backendRoot, "dist/sql");
if (!existsSync(sqlSrc)) {
  throw new Error(`sql directory not found: ${sqlSrc}`);
}
rmSync(sqlDst, { recursive: true, force: true });
mkdirSync(dirname(sqlDst), { recursive: true });
cpSync(sqlSrc, sqlDst, { recursive: true });
