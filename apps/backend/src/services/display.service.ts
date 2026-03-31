import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, "../..");
const defaultPythonBin = process.env.EPD_PYTHON_BIN || "python3";
const renderTimeoutMs = Number.parseInt(process.env.EPD_RENDER_TIMEOUT_MS || "180000", 10);
const renderScriptPath = resolve(backendRoot, "driver/waveshare/render_photo.py");

let isRefreshing = false;

export async function displayPhoto(localFilePath: string): Promise<void> {
  if (isRefreshing) {
    throw new Error("墨水屏正在刷新，请稍后再试");
  }

  await access(localFilePath, fsConstants.R_OK);

  isRefreshing = true;

  try {
    await runRenderProcess(localFilePath);
  } finally {
    isRefreshing = false;
  }
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
