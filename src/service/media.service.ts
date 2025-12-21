import {
  createRouter,
  getMediasoupWorker,
  getRouterRtpCapabilities,
} from "../mediasoup";

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
