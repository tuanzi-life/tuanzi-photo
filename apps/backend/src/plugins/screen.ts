import fp from "fastify-plugin";
import { displayPhoto, getDisplayRefreshState } from "../services/display.service.js";
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
    pushPhoto: displayPhoto,
    get isRefreshing() {
      return getDisplayRefreshState();
    },
  };

  fastify.decorate("screen", screen);
});
