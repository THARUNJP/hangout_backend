import { Request, Response } from "express";

async function healthz(_req: Request, res: Response): Promise<Response> {
  try {
    const health = {
      status: true,
      uptime: process.uptime(),
      message: "Service is healthy",
      timestamp: new Date().toISOString(),
    };
    return res.status(200).json(health);
  } catch (error: unknown) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      status: false,
      message: "Service unavailable",
      timestamp: new Date().toISOString(),
    });
  }
}

export {healthz}