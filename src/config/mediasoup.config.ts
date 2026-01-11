import os from "os";
import { RtpCodecCapability } from "mediasoup/node/lib/types";
import { WorkerLogLevel, WorkerLogTag } from "../mediasoup/types";

/**
 * Mediasoup configuration
 * This file must contain ONLY static config.
 * No business logic here.
 */

export const mediasoupConfig  = {
  /**
   * Worker settings
   * One worker can handle multiple routers (sessions)
   */
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,

    /**
     * Log levels for debugging
     * In production, reduce this
     */
    logLevel: "warn" as WorkerLogLevel,
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
    ] as WorkerLogTag[],
  },

  /**
   * Number of mediasoup workers
   * Rule of thumb:
   *   1 worker per CPU core (max 4–6 for most apps)
   */
  numWorkers: Math.min(os.cpus().length, 4),

  /**
   * Router RTP codecs
   * These must match browser capabilities
   */
  router: {
    mediaCodecs: <RtpCodecCapability[]>[
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
    ],
  },

  /**
   * WebRTC Transport options
   */
  webRtcTransport: {
    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: process.env.PUBLIC_IP || '127.0.0.1',
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,

    /**
     * Bitrate control
     */
    initialAvailableOutgoingBitrate: 1_000_000,
    minimumAvailableOutgoingBitrate: 600_000,
  },
};
