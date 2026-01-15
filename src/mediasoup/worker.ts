import { Worker} from "mediasoup/node/lib/WorkerTypes";
import { mediasoupConfig } from "../config/mediasoup.config";
import * as mediasoup from "mediasoup";

let workers: Worker[] = [];
let nextWorkerIndex = 0;


export default async function createMediasoupWorkers(): Promise<void> {
  const { numWorkers, worker } = mediasoupConfig;

  console.log(`Starting ${numWorkers} mediasoup workers...`);
  console.log("Public IP:", process.env.PUBLIC_IP);

  for (let i = 0; i < numWorkers; i++) {
    const mediaWorker = await mediasoup.createWorker({
      logLevel: worker.logLevel,
      logTags: worker.logTags,
      rtcMinPort: worker.rtcMinPort,
      rtcMaxPort: worker.rtcMaxPort,
    });

    mediaWorker.on("died", () => {
      console.error("Mediasoup worker died. Exiting...");
      setTimeout(() => process.exit(1), 2000);
    });

    const webRtcServer = await mediaWorker.createWebRtcServer({
      listenInfos: [
        {
          protocol: "udp",
          ip: "0.0.0.0",
          announcedAddress: process.env.PUBLIC_IP, // EC2 public IP
          portRange: {
            min: worker.rtcMinPort,
            max: worker.rtcMaxPort,
          },
        },
        {
          protocol: "tcp",
          ip: "0.0.0.0",
          announcedAddress: process.env.PUBLIC_IP,
          portRange: {
            min: worker.rtcMinPort,
            max: worker.rtcMaxPort,
          },
        },
      ],
    });

    (mediaWorker as any).appData = { webRtcServer };

    console.log(
      `Mediasoup worker ${i} ready [pid:${mediaWorker.pid}] WebRTC on ${process.env.PUBLIC_IP}`
    );

    workers.push(mediaWorker);
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