import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import {
  handleDisconnectedUser,
  handleJoinUser,
  handleLeaveSession,
  handleSessionCreation,
} from "../service/socket.service";

let io: Server;

export default function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });
  console.log("socket is running on port 8000");

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // session creation
    socket.on("create-session", ({ sessionCode, callType }) => {
      console.log("....session creation", sessionCode, "type::", callType);
      handleSessionCreation(sessionCode, callType);
    });


    // join session 
    socket.on("join-session", ({ sessionCode, participantName }) => {
      console.log("joining session", sessionCode, "name::", participantName,socket.id);
      // Prevent duplicate joins
      if (socket.rooms.has(sessionCode)) return;
      // Join transport room first
      socket.join(sessionCode);
      // Then update business state
      handleJoinUser(sessionCode, participantName, socket.id);
    });

    //leave session 
    socket.on("leave-session", ({sessionCode}) => {
      console.log("Socket Left the session.....:", socket.id,sessionCode);
      handleLeaveSession(sessionCode,socket.id)
       socket.leave(sessionCode)
    });

    //disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      handleDisconnectedUser(socket.id);
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
