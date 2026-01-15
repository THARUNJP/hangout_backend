import { Router, Worker } from "mediasoup/node/lib/types";
import { mediasoupConfig } from "../config/mediasoup.config";

/**
 * Map of sessionCode -> mediasoup Router
 * One router per session
 */
const routers = new Map<string, Router>();

/**
 * Create a mediasoup Router for a session
 */
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

  (router as any).appData = { worker };

  routers.set(sessionCode, router);

  console.log(`Router created for session ${sessionCode} on worker ${worker.pid}`);

  return router;
}


/**
 * Get existing router by sessionCode
 */
export function getRouter(sessionCode: string): Router | undefined {
  return routers.get(sessionCode);
}

/**
 * Check if a session router exists
 */
export function hasRouter(sessionCode: string): boolean {
  return routers.has(sessionCode);
}

/**
 * Close and cleanup router
 */
export function closeRouter(sessionCode: string): void {
  const router = routers.get(sessionCode);
  if (!router) return;

  router.close();
  routers.delete(sessionCode);
}

/**
 * Get RTP capabilities for frontend
 * Needed before transport creation
 */
export function getRouterRtpCapabilities(sessionCode: string) {
  const router = routers.get(sessionCode);
  if (!router) {
    throw new Error("Router not found for session");
  }

  return router.rtpCapabilities;
}
