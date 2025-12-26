import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import {
  handleDisconnectedUser,
  handleJoinUser,
  handleLeaveSession,
  handleSessionCreation,
} from "../service/socket.service";
import {
  createRouterSession,
  handleCreateTransport,
  handleGetRtpCapabilities,
} from "../service/media.service";
import { getRouter } from "../mediasoup";

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
    socket.on("join-session", ({ sessionCode, participantName }) => {
      console.log(
        "joining session",
        sessionCode,
        "name::",
        participantName,
        socket.id
      );
      // Prevent duplicate joins
      if (socket.rooms.has(sessionCode)) return;
      // Join transport room first
      socket.join(sessionCode);
      // Then update business state
      handleJoinUser(sessionCode, participantName, socket.id);
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
    socket.on("join-media", ({ sessionCode }, callback) => {
      if (!sessionCode) {
        return callback({ status: false, message: "sessionCode required" });
      }

      socket.data.sessionCode = sessionCode;
      callback({ status: true });
    });

    // socket.on("get-rtp-capabilities", (callback) => {
    //   if (typeof callback !== "function") return;
    //   console.log("...rtp capabilities");
    //   const router = handleGetRtpCapabilities(sessionCode);
    //   if (!router) {
    //     return callback({
    //       status: false,
    //       message: "Router not found",
    //     });
    //   }
    //   callback({
    //     status: true,
    //     data: router,
    //     message: "rtp capabilties sent",
    //   });
    // });

    // // need to change logic and handle it using callback which wraps it in try/catch
    // socket.on("create-transport", async ({ direction }, callback) => {
    //   const router = getRouter(sessionCode);
    //   if (!router) {
    //     return callback({
    //       status: false,
    //       message: "No router found for the session",
    //     });
    //   }
    //   const transport = await handleCreateTransport(router)
    //   if(!transport) return callback({status:false,message: "something went wrong while creating transport",})
    //     callback({
    //     id: transport.id,
    //     iceParameters: transport.iceParameters,
    //     iceCandidates: transport.iceCandidates,
    //     dtlsParameters: transport.dtlsParameters,
    //   });
    // });
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
