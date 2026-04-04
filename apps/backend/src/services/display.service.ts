import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { paths } from "#paths";
import { env } from "../env.js";
import { getPhotoProcessURL } from "./oss.service.js";

const renderScriptPath = resolve(paths.driverDir, "waveshare/render_photo.py");
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
    const processedUrl = await getPhotoProcessURL(
      objectKey,
      "image/resize,m_fill,w_800,h_480/format,bmp"
    );

    // 下载到 data/cache 目录
    const cacheFileName = objectKey.replace(/\//g, "_").replace(/\.[^.]+$/, ".bmp");
    await mkdir(paths.cacheDir, { recursive: true });
    const localFilePath = resolve(paths.cacheDir, cacheFileName);
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

      const details = [
        `render_photo.py exited with code=${code ?? "null"} signal=${signal ?? "null"}`,
      ];

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
