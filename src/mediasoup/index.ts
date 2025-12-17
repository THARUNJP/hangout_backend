import { Worker } from "mediasoup/node/lib/types";
import createMediasoupWorkers from "./worker";

// Re-export router helpers
export {
  createRouter,
  getRouter,
  hasRouter,
  closeRouter,
  getRouterRtpCapabilities,
} from "./router";

// Re-export transport helpers
export {
  createSendTransport,
  createRecvTransport,
  connectTransport,
  getTransport,
  closeTransports,
} from "./transport";

// Re-export producer helpers
export {
  createProducer,
  getAllProducers,
  getProducerById,
  closeProducers,
} from "./producer";

// Re-export consumer helpers
export {
  createConsumer,
  resumeConsumer,
  closeConsumers,
} from "./consumer";

/**
 * Initialize mediasoup (called ONCE on server startup)
 */
export async function initMediasoup(): Promise<void> {
  await createMediasoupWorkers();
  console.log(" mediasoup initialized");
}

/**
 * Get a mediasoup worker (round-robin)
 * Used when creating routers
 */
export function getMediasoupWorker(): Worker {
  return getMediasoupWorker();
}
