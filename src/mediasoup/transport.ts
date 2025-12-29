import { WebRtcTransport, Router } from "mediasoup/node/lib/types";
import { mediasoupConfig } from "../config/mediasoup.config";
import { WebRtcTransportInfo } from "../types/types";

export const transports = new Map<
  string,
  { send?: WebRtcTransport; recv?: WebRtcTransport }
>();
// create transport
export async function createWebRtcTransport(
  router: Router
): Promise<WebRtcTransport> {
  const transport = await router.createWebRtcTransport({
    listenIps: mediasoupConfig.webRtcTransport.listenIps,
    enableUdp: mediasoupConfig.webRtcTransport.enableUdp,
    enableTcp: mediasoupConfig.webRtcTransport.enableTcp,
    preferUdp: mediasoupConfig.webRtcTransport.preferUdp,
    initialAvailableOutgoingBitrate:
      mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
  });

  await transport.setMaxIncomingBitrate(
    mediasoupConfig.webRtcTransport.minimumAvailableOutgoingBitrate
  );

  return transport;
}

//create send transport
export async function createSendTransport(
  socketId: string,
  router: Router
): Promise<WebRtcTransportInfo> {
  const transport = await createWebRtcTransport(router);

  const entry = transports.get(socketId) || {};
  entry.send = transport;
  transports.set(socketId, entry);

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

//create recv transport
export async function createRecvTransport(
  socketId: string,
  router: Router
): Promise<WebRtcTransportInfo> {
  const transport = await createWebRtcTransport(router);

  const entry = transports.get(socketId) || {};
  entry.recv = transport;
  transports.set(socketId, entry);

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

// Connect transport (DTLS handshake)
export async function connectTransport(
  socketId: string,
  transportType: "send" | "recv",
  dtlsParameters: any
) {
  const entry = transports.get(socketId);
  if (!entry) throw new Error("No transports for socket");

  const transport = entry[transportType];
  if (!transport) throw new Error("Transport not found");

  await transport.connect({ dtlsParameters });
}

//get transport
export function getTransport(
  socketId: string,
  type: "send" | "recv"
): WebRtcTransport {
  const entry = transports.get(socketId);
  if (!entry || !entry[type]) {
    throw new Error("Transport not found");
  }
  return entry[type]!;
}

//close transport
export function closeTransports(socketId: string) {
  const entry = transports.get(socketId);
  if (!entry) return;

  entry.send?.close();
  entry.recv?.close();

  transports.delete(socketId);
}
