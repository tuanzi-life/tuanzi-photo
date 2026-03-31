import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(__dirname, "../.env");

try {
  process.loadEnvFile(envFilePath);
} catch (error) {
  const envError = error as NodeJS.ErrnoException;

  if (envError.code !== "ENOENT") {
    throw error;
  }
}

function readIntEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid integer environment variable: ${name}=${rawValue}`);
  }

  return parsedValue;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  host: process.env.HOST || "0.0.0.0",
  port: readIntEnv("PORT", 4010),
  epd: {
    pythonBin: process.env.EPD_PYTHON_BIN || "python3",
    renderTimeoutMs: readIntEnv("EPD_RENDER_TIMEOUT_MS", 180000),
  },
  oss: {
    region: process.env.OSS_REGION || "",
    endpoint: process.env.OSS_ENDPOINT || "",
    bucket: process.env.OSS_BUCKET || "",
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  },
};
