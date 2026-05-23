import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
    if (!token) {
      this.logger.warn(`Socket connection rejected: missing token`);
      socket.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(String(token), {
        secret: this.configService.get<string>('JWT_SECRET') || 'secret',
      });

      const userId = payload.sub as string;
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      this.logger.log(`Socket connected: ${socket.id} for user ${userId}`);
    } catch (error) {
      this.logger.warn(`Socket connection rejected: invalid token`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id} for user ${socket.data.userId ?? 'unknown'}`);
  }

  notifyUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
