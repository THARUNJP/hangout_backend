import { Router, Worker } from "mediasoup/node/lib/types";
import { mediasoupConfig } from "../config/mediasoup.config";

const routers = new Map<string, Router>();

export async function createRouter(
  sessionCode: string,
  worker: Worker
): Promise<Router> {
  if (routers.has(sessionCode)) {
    return routers.get(sessionCode)!;
  }

  const router = await worker.createRouter({
    mediaCodecs: mediasoupConfig.router.mediaCodecs,
  });

  routers.set(sessionCode, router);

  return router;
}
