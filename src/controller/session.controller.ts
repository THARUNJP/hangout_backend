import { Request, Response } from "express";
import { SessionCallType, SessionStatus } from "../types/types";
import { generateSessionCode, getMaxParticipants } from "../lib/helper";
import executeQuery from "../config/db.config";

async function createSession(req: Request, res: Response): Promise<Response> {
  try {
    const { hostName, callType, userId } = req.body as {
      hostName?: string;
      callType?: SessionCallType;
      userId?: string;
    };

    // Basic validation
    if (!hostName || !callType || !userId) {
      return res.status(400).json({
        status: false,
        message: "hostName and callType and userID are required",
      });
    }

    // Enum validation
    if (!Object.values(SessionCallType).includes(callType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid callType",
      });
    }

    const sessionCode = generateSessionCode();
    const maxParticipants = getMaxParticipants(callType);

    const result = await executeQuery(
      `
      INSERT INTO sessions (
        session_code,
        call_type,
        max_participants,
        host_name,
        status,
        participant_uid
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, session_code, call_type, max_participants, host_name, status, created_at
      `,
      [
        sessionCode,
        callType,
        maxParticipants,
        hostName,
        SessionStatus.ACTIVE,
        userId,
      ]
    );

    return res.status(201).json({
      status: true,
      message: "Session created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create Session Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export { createSession };
