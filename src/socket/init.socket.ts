import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import {
  handleDisconnectedUser,
  handleJoinUser,
  handleLeaveSession,
  handleMediaUserTrack,
  handleSessionCreation,
} from "../service/socket.service";
import {
  createRouterSession,
  getProducers,
  handleCreateSendTransport,
  handleGetRtpCapabilities,
} from "../service/media.service";
import {
  connectTransport,
  createConsumer,
  createProducer,
  createRecvTransport,
  getAllProducers,
  getRouter,
  getTransport,
  resumeConsumer,
} from "../mediasoup";
import { producers } from "../mediasoup/producer";

let io: Server;

export default function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });
  console.log("socket is running on port 8000");

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // session creation
    socket.on("create-session", async ({ sessionCode, callType }) => {
      console.log("....session creation", sessionCode, "type::", callType);
      handleSessionCreation(sessionCode, callType);
      await createRouterSession(sessionCode);
    });

    // join session
    socket.on("join-session", ({ sessionCode, participantName, userId }) => {
      console.log(
        "joining session",
        sessionCode,
        "name::",
        participantName,
        socket.id,
        userId
      );
      // Prevent duplicate joins
      if (socket.rooms.has(sessionCode)) return;
      // Join transport room first
      socket.join(sessionCode);
      // Then update business state
      handleJoinUser(sessionCode, participantName, socket.id, userId);
    });

    //leave session
    socket.on("leave-session", ({ sessionCode }) => {
      console.log("Socket Left the session.....:", socket.id, sessionCode);
      handleLeaveSession(sessionCode, socket.id);
      socket.leave(sessionCode);
    });

    //disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      handleDisconnectedUser(socket.id);
    });
  });

  // Mediasoup namespace
  const mediaNamespace = io.of("/mediasoup");

  mediaNamespace.on("connection", (socket) => {
    console.log("Mediasoup socket connected:", socket.id);
    socket.on("join-media", ({ sessionCode, userId }, callback) => {
      if (!sessionCode) {
        return callback({ status: false, message: "sessionCode required" });
      }
      socket.join(sessionCode);
      console.log(socket.id, "media joined success", sessionCode, socket.rooms);

      handleMediaUserTrack(userId, sessionCode, socket.id);

      socket.data.sessionCode = sessionCode;
      const room = mediaNamespace.adapter.rooms.get(sessionCode);
      const peerSocketIds: string[] = [];

      if (room) {
        for (const id of room) {
          if (id !== socket.id) {
            peerSocketIds.push(id);
          }
        }
      }
      const existingProducers = getAllProducers(peerSocketIds);
      console.log(";;;Producers", existingProducers);

      callback({ status: true, producers: existingProducers });
    });

    socket.on("get-rtp-capabilities", (callback) => {
      const { sessionCode } = socket.data;
      if (typeof callback !== "function" || !sessionCode) return;
      console.log("...rtp capabilities");
      const router = handleGetRtpCapabilities(sessionCode);
      if (!router) {
        return callback({
          status: false,
          message: "Router not found",
        });
      }
      callback({
        status: true,
        data: router,
        message: "rtp capabilties sent",
      });
    });

    socket.on("create-send-transport", async (callback) => {
      console.log("........comes here create-send-transport");

      const { sessionCode } = socket.data;
      const router = getRouter(sessionCode);
      if (!router) {
        return callback({
          status: false,
          message: "No router found for the session",
        });
      }
      const transport = await handleCreateSendTransport(router, socket.id);
      if (!transport)
        return callback({
          status: false,
          message: "something went wrong while creating transport",
        });
      callback({
        status: true,
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    });

    socket.on(
      "connect-transport",
      async ({ transportType, dtlsParameters }, callback) => {
        console.log("........comes here connect-transport");
        try {
          await connectTransport(socket.id, transportType, dtlsParameters);
          callback({ status: true });
        } catch (error: any) {
          console.error("connect-transport failed", error);
          callback({ status: false, message: error.message });
        }
      }
    );

    socket.on("produce", async ({ kind, rtpParameters }, callback) => {
      try {
        console.log("........comes here produce-transport");

        const { sessionCode } = socket.data;
        const producer = await createProducer(socket.id, kind, rtpParameters);
        console.log("........comes here produce-transport ......2");
        const room = mediaNamespace.adapter.rooms.get(sessionCode);
        console.log("ROOM MEMBERS:", room ? [...room] : "NO ROOM");
        socket.to(sessionCode).except(socket.id).emit("new-producer", {
          producerId: producer.id,
          kind: producer.kind,
          socketId: socket.id,
        });
        callback({ status: true, id: producer.id });
      } catch (err: any) {
        console.log("create producer failed:", err);
        callback({ status: false, message: err.message });
      }
    });

    socket.on("create-recv-transport", async (callback) => {
      try {
        const { sessionCode } = socket.data;
        const router = getRouter(sessionCode);

        if (!router) {
          return callback({
            status: false,
            message: "No router found for the session",
          });
        }

        const transportInfo = await createRecvTransport(socket.id, router);

        callback({
          status: true,
          ...transportInfo,
        });
      } catch (err: any) {
        console.error("create-recv-transport failed:", err);
        callback({ status: false, message: err.message });
      }
    });

    socket.on("consume", async ({ producerId, rtpCapabilities }, callback) => {
      try {
        const { sessionCode } = socket.data;
        const consumer = await createConsumer(
          socket.id,
          sessionCode,
          producerId,
          rtpCapabilities
        );
        callback({
          status: true,
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (err: any) {
        console.error("consume failed:", err);
        callback({ status: false, message: err.message });
      }
    });

    socket.on("resume-consumer", async ({ consumerId }) => {
      try {
        await resumeConsumer(socket.id, consumerId);
      } catch (err: unknown) {
        console.log("error in resuming the consumer", err);
      }
    });
  });

  return io;
}

// Optional getter (useful later)
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
