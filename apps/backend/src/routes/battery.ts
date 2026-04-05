import type { FastifyInstance } from "fastify";
import type { ApiResponse, BatteryVO } from "@tuanzi-photo/shared-types";
import { readBattery } from "../services/battery.service.js";
import { err, ok } from "../utils/response.js";

export default async function batteryRoutes(fastify: FastifyInstance) {
  fastify.get("/battery", async (): Promise<ApiResponse<BatteryVO | null>> => {
    try {
      const data = await readBattery();
      return ok(data);
    } catch (error) {
      fastify.log.error({ err: error }, "读取电量失败");
      const message = error instanceof Error ? error.message : "读取电量失败";
      return err(500, message);
    }
  });
}
