import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import sessionRoutes from './routes/session.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import { registerSocketEvents } from './realtime/socket';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- REST routes ---
app.use('/session', sessionRoutes);
app.use('/products', productRoutes);
app.use('/purchase', orderRoutes);

// --- HTTP Server + Socket.IO ---
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

// Register socket events
registerSocketEvents(io);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
