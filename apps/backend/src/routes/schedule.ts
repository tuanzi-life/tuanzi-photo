import type { FastifyInstance } from "fastify";
import {
  getSchedule,
  upsertSchedule,
  pickPhotoForRefresh,
  shouldTriggerNow,
} from "../services/schedule.service.js";
import { getPhotoObjectKeyById } from "../services/photo.service.js";
import {
  recordRenderFailure,
  recordRenderSuccess,
} from "../services/render-history.service.js";
import { ok, err } from "../utils/response.js";
import type {
  ApiResponse,
  ScheduleVO,
  UpdateScheduleBody,
} from "@tuanzi-photo/shared-types";

export default async function scheduleRoutes(fastify: FastifyInstance) {
  // GET /schedule
  fastify.get("/schedule", async (): Promise<ApiResponse<ScheduleVO>> => {
    return ok(getSchedule(fastify.db));
  });

  // PUT /schedule
  fastify.put<{ Body: UpdateScheduleBody }>(
    "/schedule",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "refreshMode",
            "timingHour",
            "intervalHours",
            "refreshRule",
            "relatedTags",
          ],
          properties: {
            refreshMode: { type: "string", enum: ["timing", "interval"] },
            timingHour: { type: "integer", minimum: 0, maximum: 23 },
            intervalHours: { type: "integer", minimum: 1, maximum: 24 },
            refreshRule: { type: "string", enum: ["time", "random"] },
            relatedTags: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    async (request): Promise<ApiResponse<ScheduleVO>> => {
      return ok(upsertSchedule(fastify.db, request.body));
    }
  );

  // POST /schedule/trigger
  fastify.post("/schedule/trigger", async (): Promise<ApiResponse<null>> => {
    const schedule = getSchedule(fastify.db);
    if (!shouldTriggerNow(schedule)) {
      return ok(null);
    }

    if (fastify.screen.isRefreshing) {
      return err(409, "墨水屏正在刷新，请稍后再试");
    }

    const photoId = await pickPhotoForRefresh(fastify.db, schedule);
    if (photoId === null) {
      return err(404, "没有可用的照片");
    }

    const objectKey = getPhotoObjectKeyById(fastify.db, photoId);
    if (!objectKey) {
      return err(404, "没有可用的照片");
    }

    void pushPhotoWithScheduleHistory(fastify, photoId, objectKey);

    return ok(null);
  });
}

async function pushPhotoWithScheduleHistory(
  fastify: FastifyInstance,
  photoId: number,
  objectKey: string
): Promise<void> {
  try {
    await fastify.screen.pushPhoto(objectKey);
  } catch (error) {
    try {
      recordRenderFailure(fastify.db, photoId, "schedule", error);
    } catch (historyError) {
      fastify.log.error({ err: historyError, photoId }, "定时渲染失败记录写入失败");
    }

    fastify.log.error({ err: error, photoId }, "墨水屏刷新失败");
    return;
  }

  try {
    await recordRenderSuccess(fastify.db, photoId, "schedule", fastify.log);
  } catch (historyError) {
    fastify.log.error({ err: historyError, photoId }, "定时渲染成功记录写入失败");
  }
}
