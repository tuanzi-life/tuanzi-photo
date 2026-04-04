import { mkdir, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { paths } from "#paths";
import { env } from "../env.js";
import { getPhotoProcessURL, getPhotoInfo } from "./oss.service.js";

const renderScriptPath = resolve(paths.driverDir, "waveshare/render_photo.py");
const defaultPythonBin = env.epd.pythonBin;
const renderTimeoutMs = env.epd.renderTimeoutMs;
const landscapeSize = { width: 800, height: 480 } as const;
const portraitSize = { width: 480, height: 800 } as const;

let isRefreshing = false;

export async function displayPhoto(objectKey: string): Promise<void> {
  // 在最开始就抢锁，避免并发窗口
  if (isRefreshing) {
    throw new Error("墨水屏正在刷新，请稍后再试");
  }
  isRefreshing = true;

  try {
    await mkdir(paths.cacheDir, { recursive: true });
    const landscapeCachePath = getCacheFilePath(objectKey, landscapeSize.width, landscapeSize.height);
    const portraitCachePath = getCacheFilePath(objectKey, portraitSize.width, portraitSize.height);

    const hasLandscapeCache = await hasCachedRenderFile(landscapeCachePath);
    const hasPortraitCache = await hasCachedRenderFile(portraitCachePath);

    if (hasLandscapeCache && !hasPortraitCache) {
      await runRenderProcess(landscapeCachePath);
      return;
    }

    if (hasPortraitCache && !hasLandscapeCache) {
      await runRenderProcess(portraitCachePath);
      return;
    }

    const photoInfo = await getPhotoInfo(objectKey);
    const targetSize = getTargetRenderSize(photoInfo.imageWidth, photoInfo.imageHeight);
    const localFilePath = getCacheFilePath(objectKey, targetSize.width, targetSize.height);

    if (await hasCachedRenderFile(localFilePath)) {
      await runRenderProcess(localFilePath);
      return;
    }

    const processedUrl = await getPhotoProcessURL(
      objectKey,
      `image/resize,m_fill,w_${targetSize.width},h_${targetSize.height}/format,bmp`
    );

    // 下载到 data/cache 目录
    await downloadToFile(processedUrl, localFilePath);

    await runRenderProcess(localFilePath);
  } finally {
    isRefreshing = false;
  }
}

function getCacheFilePath(objectKey: string, width: number, height: number): string {
  const cacheFileName = objectKey
    .replace(/\//g, "_")
    .replace(/\.[^.]+$/, `_${width}x${height}.bmp`);
  return resolve(paths.cacheDir, cacheFileName);
}

function getTargetRenderSize(
  imageWidth: string,
  imageHeight: string
): { width: number; height: number } {
  const width = Number(imageWidth);
  const height = Number(imageHeight);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`照片尺寸无效: width=${imageWidth}, height=${imageHeight}`);
  }

  return width >= height ? landscapeSize : portraitSize;
}

async function hasCachedRenderFile(localFilePath: string): Promise<boolean> {
  try {
    const fileStat = await stat(localFilePath);
    return fileStat.isFile() && fileStat.size > 0;
  } catch {
    return false;
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
