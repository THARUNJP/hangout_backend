import {
  createRouter,
  getMediasoupWorker,
  getRouterRtpCapabilities,
} from "../mediasoup";
import { Router } from "mediasoup/node/lib/types";

import {
  createSendTransport,
} from "../mediasoup/transport";

export const createRouterSession = async (sessionCode: string) => {
  try {
    const worker = getMediasoupWorker();
    const router = await createRouter(sessionCode, worker);
    return router;
  } catch (err) {
    console.log(err);
  }
};

export const handleGetRtpCapabilities = (sessionCode: string) => {
  try {
    const router = getRouterRtpCapabilities(sessionCode);
    return router;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const handleCreateSendTransport = async (
  router: Router,
  socketId: string
) => {
  try {
    const transport = await createSendTransport(socketId, router);
    return transport;
  } catch (err) {
    console.log(err);
    return null;
  }
};
