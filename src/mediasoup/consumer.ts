import { Consumer } from "mediasoup/node/lib/types";
import { getTransport } from "./transport";
import { getProducerById } from "./producer";
import { getRouter } from "./router";

/**
 * socketId -> consumers
 */
const consumers = new Map<string, Map<string, Consumer>>();

/**
 * Create a consumer for a producer
 */
export async function createConsumer(
  socketId: string,
  sessionCode: string,
  producerId: string,
  rtpCapabilities: any
) {
  const router = getRouter(sessionCode);
  if (!router) throw new Error("Router not found");

  if (!router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error("Client cannot consume this producer");
  }

  const transport = getTransport(socketId, "recv");
  const producer = getProducerById(producerId);
  if (!producer) throw new Error("Producer not found");

  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused: true, // start paused
  });

  let socketConsumers = consumers.get(socketId);
  if (!socketConsumers) {
    socketConsumers = new Map();
    consumers.set(socketId, socketConsumers);
  }

  socketConsumers.set(consumer.id, consumer);

  consumer.on("transportclose", () => {
    socketConsumers?.delete(consumer.id);
  });

  consumer.on("producerclose", () => {
    socketConsumers?.delete(consumer.id);
  });

  return {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
}

/**
 * Resume a consumer
 */
export async function resumeConsumer(socketId: string, consumerId: string) {
  const socketConsumers = consumers.get(socketId);
  const consumer = socketConsumers?.get(consumerId);
  if (!consumer) throw new Error("Consumer not found");

  await consumer.resume();
}

/**
 * Cleanup consumers on disconnect
 */
export function closeConsumers(socketId: string) {
  const socketConsumers = consumers.get(socketId);
  if (!socketConsumers) return;

  for (const consumer of socketConsumers.values()) {
    consumer.close();
  }

  consumers.delete(socketId);
}
