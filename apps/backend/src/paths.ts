import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// `paths.ts` is the only place that knows source vs build layout.
// Development: `src/paths.ts` => APP_ROOT = `apps/backend/`
// Production: `release/backend/paths.js` => APP_ROOT = `release/backend/`
export const APP_ROOT = process.env.NODE_ENV === "production" ? __dirname : resolve(__dirname, "..");
export const PROJECT_ROOT = resolve(APP_ROOT, "../..");

export const DATA_DIR = resolve(PROJECT_ROOT, "data");
export const MAIN_DIR = resolve(DATA_DIR, "main");
export const DB_DIR = MAIN_DIR;
export const DB_PATH = resolve(DB_DIR, "main.db");
export const RENDER_HISTORY_FILE = resolve(MAIN_DIR, "render_history.json");
export const UPLOADS_DIR = resolve(DATA_DIR, "uploads");
export const CACHE_DIR = resolve(DATA_DIR, "cache");
export const LOGS_DIR = resolve(DATA_DIR, "logs");
export const SQL_DIR = resolve(APP_ROOT, "sql");
export const SCHEMA_PATH = resolve(SQL_DIR, "schema.sql");
export const DRIVER_DIR = resolve(APP_ROOT, "driver");

export const paths = {
  dbFile: DB_PATH,
  schemaFile: SCHEMA_PATH,
  driverDir: DRIVER_DIR,
  cacheDir: CACHE_DIR,
  mainDir: MAIN_DIR,
  renderHistoryFile: RENDER_HISTORY_FILE,
} as const;
