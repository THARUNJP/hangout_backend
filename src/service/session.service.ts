import executeQuery from "../config/db.config";
import { CreateSessionPayload, SessionCallType, SessionStatus } from "../types/types";

export const getByCode = async (
  sessionCode: string
): Promise<{ id: number; is_active: boolean } | null> => {
  const query = `
    SELECT id, is_active
    FROM sessions
    WHERE session_code = $1
    LIMIT 1
  `;

  const { rows } = await executeQuery(query, [sessionCode]);

  if (rows.length === 0) return null;

  return rows[0];
};


export async function createSession(payload: CreateSessionPayload) {
  const query = `
    INSERT INTO sessions (
      session_code,
      call_type,
      max_participants,
      host_name,
      status,
      participant_uid
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING 
      id, 
      session_code, 
      call_type, 
      max_participants, 
      host_name, 
      status, 
      created_at
  `;

  const values = [
    payload.sessionCode,
    payload.callType,
    payload.maxParticipants,
    payload.hostName,
    SessionStatus.ACTIVE,
    payload.userId,
  ];

  const { rows } = await executeQuery(query, values);

  return rows[0];
}

