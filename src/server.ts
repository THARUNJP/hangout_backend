import dotenv from "dotenv";
dotenv.config();

import { createServer } from "node:http";
import app from "./app";
import initSocket from "./socket/init.socket";
import { initMediasoup } from "./mediasoup";

const PORT = Number(process.env.PORT) || 8000;

async function bootstrap() {
  try {
    // 1️ mediasoup FIRST
    await initMediasoup();
    console.log("mediasoup initialized");

    // 2️ create HTTP server
    const server = createServer(app);

    // 3 init socket.io
    initSocket(server);

    // 4️ start server
    // 4. Start server
    const isProd = process.env.NODE_ENV === "production";
    const host = isProd ? "0.0.0.0" : "localhost";

    server.listen(PORT, host, () => {
      console.log(
        `Server running in ${
          isProd ? "production" : "development"
        } mode at http://${host}:${PORT}`
      );
    });
  } catch (err) {
    console.error("Failed to bootstrap server:", err);
    process.exit(1);
  }
}

bootstrap();
