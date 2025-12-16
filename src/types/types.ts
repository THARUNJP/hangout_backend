import type {
  DtlsParameters,
  IceCandidate,
  IceParameters
} from 'mediasoup/node/lib/types';


export enum SessionCallType {
  RTC = "RTC",
  SFU = "SFU",
}

// Participant roles
export enum SessionRole {
  HOST = "HOST",
  USER = "USER",
}

// Session status
export enum SessionStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export interface Participant {
  socketId: string;          // unique per connection
  name: string;              // participant name
  role: SessionRole     // participant role
  joinedAt: Date;
}

export interface SessionData {
  participants: Map<string, Participant>; // Key = socketId
  maxParticipants: number;
  status:SessionStatus
}


export interface WebRtcTransportInfo {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
}