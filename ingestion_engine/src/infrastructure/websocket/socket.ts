// src/infrastructure/websocket/socket.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-do-not-use-in-prod';

export class WebSocketService {
  private static io: Server;

  static initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: '*' },
    });

    // 1. WebSocket Authentication Middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    // 2. Connection Handling
    this.io.on('connection', (socket: Socket) => {
      console.log(`🟢 Client connected: [User ID: ${socket.data.userId}]`);

      // When the frontend loads a dashboard, it requests to join that service's room
      socket.on('join_service_room', (serviceId: string) => {
        socket.join(serviceId);
        console.log(`User ${socket.data.userId} joined room: ${serviceId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: [User ID: ${socket.data.userId}]`);
      });
    });
  }

  /**
   * Broadcasts an event exclusively to users watching a specific service
   */
  static broadcastToService(serviceId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(serviceId).emit(event, data);
    }
  }
}