import { Producer, RtpParameters } from "mediasoup/node/lib/types";
import { getTransport } from "./transport";
import { getUserIdByMediaSocketId } from "../lib/helper";

export const producers = new Map<string, Map<string, Producer>>();

// Create a producer (audio/video)
export async function createProducer(
  socketId: string,
  kind: "audio" | "video",
  rtpParameters: RtpParameters
) {
  // validate send transport exists
  const transport = getTransport(socketId, "send");
  if (!transport) {
    throw new Error("Send transport not found");
  }

  // Create producer
  const producer = await transport.produce({
    kind,
    rtpParameters,
  });

  // Store producer per socket
  let socketProducers = producers.get(socketId);
  if (!socketProducers) {
    socketProducers = new Map();
    producers.set(socketId, socketProducers);
  }
  socketProducers.set(producer.id, producer);

  // Cleanup on transport close
  producer.on("transportclose", () => {
    socketProducers?.delete(producer.id);
  });

  producer.on("@close", () => {
    socketProducers?.delete(producer.id);
  });

  return {
    id: producer.id,
    kind: producer.kind,
  };
}

//Get all producers except requester  & Used when a user joins
export function getAllProducers(
  socketIds: string[],
  sessionCode: string
): { producerId: string; userId: string }[] {
  const result: {
    producerId: string;
    userId: string;
    kind: "audio" | "video";
  }[] = [];
  const socketIdSet = new Set(socketIds);

  for (const socketId of socketIdSet) {
    const socketProducers = producers.get(socketId);
    if (!socketProducers) continue;

    const userId = getUserIdByMediaSocketId(socketId, sessionCode);
    if (!userId) continue;

    for (const producer of socketProducers.values()) {
      result.push({
        producerId: producer.id,
        userId,
        kind: producer.kind,
      });
    }
  }

  return result;
}

//Get producer by id
export function getProducerById(producerId: string): Producer | undefined {
  for (const socketProducers of producers.values()) {
    const producer = socketProducers.get(producerId);
    if (producer) return producer;
  }
  return undefined;
}

//Cleanup producers for a socket
export function closeProducers(socketId: string): void {
  const socketProducers = producers.get(socketId);
  if (!socketProducers) return;

  for (const producer of socketProducers.values()) {
    producer.close();
  }

  producers.delete(socketId);
}
