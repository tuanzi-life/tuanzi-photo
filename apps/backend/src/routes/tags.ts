import type { FastifyInstance } from "fastify";
import { listTagsWithCount } from "../services/tag.service.js";
import { ok } from "../utils/response.js";
import type { ApiResponse, TagListResponse } from "@tuanzi-photo/shared-types";

export default async function tagsRoutes(fastify: FastifyInstance) {
  // GET /tags
  fastify.get("/tags", async (): Promise<ApiResponse<TagListResponse>> => {
    const items = listTagsWithCount(fastify.db);
    return ok({ items });
  });
}
