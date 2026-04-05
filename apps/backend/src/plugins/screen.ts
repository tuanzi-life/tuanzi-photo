import fp from "fastify-plugin";
import { renderPhoto, getRenderRefreshState } from "../services/photo-render.service.js";
import type { FastifyInstance } from "fastify";

export interface ScreenService {
  pushPhoto(objectKey: string): Promise<void>;
  get isRefreshing(): boolean;
}

declare module "fastify" {
  interface FastifyInstance {
    screen: ScreenService;
  }
}

export default fp(async function screenPlugin(fastify: FastifyInstance) {
  const screen: ScreenService = {
    pushPhoto: renderPhoto,
    get isRefreshing() {
      return getRenderRefreshState();
    },
  };

  fastify.decorate("screen", screen);
});
