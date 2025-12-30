import { sessionsMap } from "../config/sessionStore";
import { getIO } from "../socket/init.socket";
import {
  SessionCallType,
  SessionData,
  SessionRole,
  SessionStatus,
} from "../types/types";

export const handleJoinUser = (
  sessionCode: string,
  name: string,
  socketId: string,
  userId: string
) => {
  const io = getIO();
  const participantData = {
    userId,
    socketId,
    name,
    role: SessionRole.USER,
    joinedAt: new Date(),
  };
  const session: SessionData | undefined = sessionsMap.get(sessionCode);
  if (!session) return;
  session.participants.set(socketId, participantData);

  io.to(sessionCode).emit("participants-updated", {
    participants: Array.from(session.participants.values()),
    message: `${name ?? "A user"} has joined the session`,
  });
  // needs to do api call for inserting in db
};

export const handleSessionCreation = (
  sessionCode: string,
  call_type: SessionCallType
) => {
  if (!sessionsMap.has(sessionCode)) {
    sessionsMap.set(sessionCode, {
      maxParticipants: call_type === SessionCallType.SFU ? 10 : 5,
      status: SessionStatus.ACTIVE,
      participants: new Map(),
    });
  }
};

export const handleDisconnectedUser = (socketId: string) => {
  const io = getIO();
  for (const [sessionCode, session] of sessionsMap.entries()) {
    if (session.participants.has(socketId)) {
      session.participants.delete(socketId);

      io.to(sessionCode).emit("participants-updated", {
        participants: Array.from(session.participants.values()),
      });

      if (session.participants.size === 0) {
        session.status = SessionStatus.ENDED;
      }

      break; // stop after removing
    }
  }
};

export const handleLeaveSession = (sessionCode: string, socketId: string) => {
  const io = getIO();
  const session = sessionsMap.get(sessionCode);

  // If session doesn't exist or participant not found
  if (!session || !session.participants.has(socketId)) return;

  const participant = session.participants.get(socketId);

  // Remove participant
  session.participants.delete(socketId);

  console.log(`User ${socketId} left session ${sessionCode}`);

  // Notify remaining users
  io.to(sessionCode).emit("participants-updated", {
    participants: Array.from(session.participants.values()),
    message: `${participant?.name ?? "A user"} has left the session`,
  });

  //clean up empty session
  if (session.participants.size === 0) {
    sessionsMap.delete(sessionCode);
    console.log(`Session ${sessionCode} deleted (empty)`);
  }
};
