import { Request, Response } from "express";
import { SessionCallType } from "../types/types";
import {
  generateSessionCode,
  getMaxParticipants,
  isValidateSessionCode,
} from "../lib/helper";
import * as SessionService from "../service/session.service";

export async function createSession(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { callType, userId } = req.body as {
      callType?: SessionCallType;
      userId?: string;
    };

    if (!callType || !userId) {
      return res.status(400).json({
        status: false,
        message: "hostName, callType and userId are required",
      });
    }

    if (!Object.values(SessionCallType).includes(callType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid callType",
      });
    }

    const sessionCode = generateSessionCode();
    const maxParticipants = getMaxParticipants(callType);

    const session = await SessionService.createSession({
      sessionCode,
      callType,
      maxParticipants,
      userId,
    });

    return res.status(201).json({
      status: true,
      message: "Session created successfully",
      data: session,
    });
  } catch (error) {
    console.error("Create Session Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export async function validateSessionByCode(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({
        status: false,
        message: "Session code is required",
      });
    }

    if (!isValidateSessionCode(code)) {
      return res.status(400).json({
        status: false,
        message: "Session code is Invalid",
      });
    }

    const session = await SessionService.getByCode(code.trim());

    if (!session) {
      return res.status(404).json({
        status: false,
        message: "No session found, please try with a valid one",
      });
    }

    if (!session.is_active) {
      return res.status(410).json({
        status: false,
        message: "This meeting has expired",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Valid meeting code",
      data: {
        id: session.id,
      },
    });
  } catch (err: any) {
    console.error("getSessionById error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}
