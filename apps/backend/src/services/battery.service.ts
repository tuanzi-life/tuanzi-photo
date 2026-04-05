import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import type { BatteryVO } from "@tuanzi-photo/shared-types";
import { paths } from "#paths";
import { env } from "../env.js";

const readBatteryScriptPath = resolve(paths.driverDir, "ups/read_battery.py");
const batteryTimeoutMs = 5000;

export function readBattery(): Promise<BatteryVO> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(env.epd.pythonBin, [readBatteryScriptPath], {
      cwd: dirname(readBatteryScriptPath),
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
      if (finished) {
        return;
      }

      finished = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 3000).unref();
      rejectPromise(new Error(`read_battery.py timed out after ${batteryTimeoutMs}ms`));
    }, batteryTimeoutMs);

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
        try {
          const payload = JSON.parse(stdout) as BatteryVO;
          resolvePromise(payload);
        } catch (error) {
          rejectPromise(new Error(`failed to parse battery output: ${String(error)}`));
        }
        return;
      }

      const details = [
        `read_battery.py exited with code=${code ?? "null"} signal=${signal ?? "null"}`,
      ];

      if (stderr.trim()) {
        details.push(`stderr:\n${stderr.trim()}`);
      }

      rejectPromise(new Error(details.join("\n\n")));
    });
  });
}
