import { extname } from "node:path";
import { unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  listPhotos,
  getPhotoObjectKeyById,
  createPhoto,
  deletePhoto,
} from "../services/photo.service.js";
import { uploadPhotoToOSS, deletePhotoFromOSS } from "../services/oss.service.js";
import { ok, err } from "../utils/response.js";
import type { ApiResponse, PhotoListResponse, PhotoVO } from "@tuanzi-photo/shared-types";

export default async function photosRoutes(fastify: FastifyInstance) {
  // GET /photos
  fastify.get<{ Querystring: { tags?: string } }>(
    "/photos",
    {
      schema: {
        querystring: {
          type: "object",
          properties: { tags: { type: "string" } },
        },
      },
    },
    async (request): Promise<ApiResponse<PhotoListResponse>> => {
      const tags = request.query.tags
        ? request.query.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;
      const items = await listPhotos(fastify.db, tags);
      return ok({ total: items.length, items });
    }
  );

  // POST /photos/upload
  fastify.post(
    "/photos/upload",
    async (request): Promise<ApiResponse<PhotoVO | null>> => {
      const files = await request.saveRequestFiles();

      // 清理所有文件的辅助函数，确保不泄漏临时文件
      const cleanupAll = () =>
        Promise.all(files.map((f) => unlink(f.filepath).catch(() => {})));

      if (!files.length) {
        return err(400, "请上传文件");
      }

      if (files.length > 1) {
        await cleanupAll();
        return err(400, "每次只能上传一个文件");
      }

      const uploaded = files[0];
      const { filepath, filename } = uploaded;

      // 从 fields 中取 tags（逗号分隔字符串）
      const tagsField = uploaded.fields.tags;
      const tagsStr =
        tagsField && !Array.isArray(tagsField) && tagsField.type === "field"
          ? String(tagsField.value)
          : "";
      const tags = tagsStr
        ? tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const ext = extname(filename) || ".jpg";
      const objectKey = `photos/${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;

      try {
        const success = await uploadPhotoToOSS(filepath, objectKey);
        if (!success) {
          return err(500, "上传 OSS 失败");
        }
        const photo = await createPhoto(fastify.db, filename, objectKey, tags);
        return ok(photo);
      } finally {
        await cleanupAll();
      }
    }
  );

  // DELETE /photos/:id
  fastify.delete<{ Params: { id: string } }>(
    "/photos/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", pattern: "^[0-9]+$" } },
        },
      },
    },
    async (request): Promise<ApiResponse<null>> => {
      const id = Number(request.params.id);
      // 先查询确认存在
      const existing = getPhotoObjectKeyById(fastify.db, id);
      if (existing === null) {
        return err(404, "照片不存在");
      }

      // 先删 OSS，再删 DB，避免 DB 已删而 OSS 还在的孤儿对象
      if (existing) {
        await deletePhotoFromOSS(existing).catch((e: Error) => {
          fastify.log.warn({ err: e }, "OSS 文件删除失败，继续删除数据库记录");
        });
      }

      deletePhoto(fastify.db, id);
      return ok(null);
    }
  );

  // POST /photos/:id/push
  fastify.post<{ Params: { id: string } }>(
    "/photos/:id/push",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", pattern: "^[0-9]+$" } },
        },
      },
    },
    async (request): Promise<ApiResponse<null>> => {
      if (fastify.screen.isRefreshing) {
        return err(409, "墨水屏正在刷新，请稍后再试");
      }

      const id = Number(request.params.id);
      const objectKey = getPhotoObjectKeyById(fastify.db, id);
      if (!objectKey) {
        return err(404, "照片不存在");
      }

      fastify.screen.pushPhoto(objectKey).catch((e: Error) => {
        fastify.log.error({ err: e }, "墨水屏推送失败");
      });

      return ok(null);
    }
  );
}
