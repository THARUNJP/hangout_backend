import { Worker} from "mediasoup/node/lib/WorkerTypes";
import { mediasoupConfig } from "../config/mediasoup.config";
import * as mediasoup from "mediasoup";

let workers: Worker[] = [];
let nextWorkerIndex = 0;


export default async function createMediasoupWorkers(): Promise<void> {
  const { numWorkers, worker } = mediasoupConfig;
  console.log(`Starting ${numWorkers} mediasoup workers...`);

  for (let i = 0; i < numWorkers; i++) {
    const mediaWorker = await mediasoup.createWorker({
      logLevel: worker.logLevel,
      logTags: worker.logTags,
      rtcMinPort: worker.rtcMinPort,
      rtcMaxPort: worker.rtcMaxPort,
    });

    mediaWorker.on("died", () => {
      console.error(
        "Mediasoup worker died. Exiting process to allow restart..."
      );
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(mediaWorker);

    console.log(`Mediasoup worker ${i} created [pid:${mediaWorker.pid}]`);
  }
}

/**
 * Get a worker using round-robin strategy
 * Ensures even load distribution across CPU cores
 */
export function getMediasoupWorker(): Worker {
  if (workers.length === 0) {
    throw new Error("Mediasoup workers are not initialized");
  }
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

/**
 * Graceful shutdown (SIGTERM, SIGINT)
 */
export async function closeMediasoupWorkers(): Promise<void> {
  for (const worker of workers) {
    await worker.close();
  }
  workers = [];
}