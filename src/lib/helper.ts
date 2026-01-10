import { sessionsMap } from "../config/sessionStore";
import { SessionCallType } from "../types/types";
import { CHARS } from "./constant";

function randomPart(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export const isValidateSessionCode = (code: string): boolean => {
  const strictRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  return strictRegex.test(code.trim());
};

export function generateSessionCode(): string {
  return `${randomPart(3)}-${randomPart(4)}-${randomPart(3)}`;
}

export function getMaxParticipants(callType: SessionCallType): number {
  switch (callType) {
    case SessionCallType.SFU:
      return 10;

    case SessionCallType.RTC:
      return 5;

    default:
      return 5;
  }
}

export const getUserIdByMediaSocketId = (
  mediaId: string,
  sessionCode: string
): string | null => {
  const session = sessionsMap.get(sessionCode);
  if (!session) return null;

  for (const participant of session.participants.values()) {
    if (participant.mediaId === mediaId) {
      return participant.userId;
    }
  }

  return null;
};
