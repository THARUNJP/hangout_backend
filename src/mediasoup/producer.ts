import { Producer, RtpParameters } from "mediasoup/node/lib/types";
import { getTransport } from "./transport";

const producers = new Map<string, Map<string, Producer>>();

// Create a producer (audio/video)
export async function createProducer(
  socketId: string,
  kind: "audio" | "video",
  rtpParameters: RtpParameters
) {
  const transport = getTransport(socketId, "send");
  const producer = await transport.produce({
    kind,
    rtpParameters,
  });

  let socketProducers = producers.get(socketId);
  if (!socketProducers) {
    socketProducers = new Map();
    producers.set(socketId, socketProducers);
  }
  socketProducers.set(producer.id, producer);

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
export function getAllProducers(excludeSocketId: string) {
  const list: { producerId: string; socketId: string }[] = [];

  for (const [socketId, socketProducers] of producers.entries()) {
    if (socketId === excludeSocketId) continue;

    for (const producer of socketProducers.values()) {
      list.push({
        producerId: producer.id,
        socketId,
      });
    }
  }

  return list;
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
