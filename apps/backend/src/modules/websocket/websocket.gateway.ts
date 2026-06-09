import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WebSocketEventType } from '@roadwatch/shared-types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private connectedClients: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log('🚀 WebSocket Gateway initialized.');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without a token.`);
        client.disconnect(true);
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      this.connectedClients.set(client.id, payload.sub);
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
      
      client.emit(WebSocketEventType.CONNECTION_ESTABLISHED, { 
        message: 'Real-time telemetry stream connected.',
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error(`WebSocket authentication failed for client ${client.id}: Invalid Token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // FIX: Added `|| null` to cast `undefined` strictly to `null`
      return authHeader.split(' ')[1] || null;
    }
    
    const queryToken = client.handshake.query.token;
    if (Array.isArray(queryToken)) {
      return queryToken[0] || null;
    }
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  public broadcastPotholeCreated(data: any) {
    this.server.emit(WebSocketEventType.POTHOLE_CREATED, data);
  }

  public broadcastPotholeUpdated(data: any) {
    this.server.emit(WebSocketEventType.POTHOLE_UPDATED, data);
  }

  public broadcastPotholeStatusChanged(data: { potholeId: string; oldStatus: string; newStatus: string; changedByUserId?: string }) {
    this.server.emit(WebSocketEventType.POTHOLE_STATUS_CHANGED, data);
  }

  public broadcastAlert(alertType: string, message: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info') {
    this.server.emit(WebSocketEventType.ALERT_TRIGGERED, {
      alertType,
      message,
      severity,
      timestamp: new Date()
    });
  }
}