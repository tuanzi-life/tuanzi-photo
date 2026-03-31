import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";
import { getPhotoProcessURL } from "./oss.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// 开发时 __dirname = src/services，../../ = apps/backend
// 生产时 __dirname = dist/services，../../ = apps/backend
const backendRoot = resolve(__dirname, "../..");
// 开发时 driver 在 apps/backend/driver，生产时构建脚本复制到 apps/backend/dist/driver
const driverBase = env.nodeEnv === "production" ? resolve(backendRoot, "dist/driver") : resolve(backendRoot, "driver");
const renderScriptPath = resolve(driverBase, "waveshare/render_photo.py");
const cacheDir = resolve(backendRoot, "../../data/cache");
const defaultPythonBin = env.epd.pythonBin;
const renderTimeoutMs = env.epd.renderTimeoutMs;

let isRefreshing = false;

export async function displayPhoto(objectKey: string): Promise<void> {
  // 在最开始就抢锁，避免并发窗口
  if (isRefreshing) {
    throw new Error("墨水屏正在刷新，请稍后再试");
  }
  isRefreshing = true;

  try {
    // 获取 OSS 处理后的图片 URL（固定缩放参数，未来按实际图片尺寸调整）
    const processedUrl = await getPhotoProcessURL(objectKey, "image/resize,w_100,h_100");

    // 下载到 data/cache 目录
    const cacheFileName = objectKey.replace(/\//g, "_");
    await mkdir(cacheDir, { recursive: true });
    const localFilePath = resolve(cacheDir, cacheFileName);
    await downloadToFile(processedUrl, localFilePath);

    await runRenderProcess(localFilePath);
  } finally {
    isRefreshing = false;
  }
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  await writeFile(destPath, Buffer.from(buffer));
}

function runRenderProcess(localFilePath: string): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(defaultPythonBin, [renderScriptPath, localFilePath], {
      cwd: dirname(renderScriptPath),
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = setTimeout(() => {
      stderr += `render process timeout after ${renderTimeoutMs}ms\n`;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 3000).unref();
    }, renderTimeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.once("error", (error) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timer);
      rejectPromise(error);
    });

    child.once("close", (code, signal) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timer);

      if (code === 0) {
        resolvePromise();
        return;
      }

      const details = [`render_photo.py exited with code=${code ?? "null"} signal=${signal ?? "null"}`];

      if (stdout.trim()) {
        details.push(`stdout:\n${stdout.trim()}`);
      }

      if (stderr.trim()) {
        details.push(`stderr:\n${stderr.trim()}`);
      }

      rejectPromise(new Error(details.join("\n\n")));
    });
  });
}

export function getDisplayRefreshState(): boolean {
  return isRefreshing;
}
