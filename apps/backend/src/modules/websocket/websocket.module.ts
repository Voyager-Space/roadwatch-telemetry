import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppWebSocketGateway } from './websocket.gateway';

@Global()
@Module({
  imports: [JwtModule.register({})], // Secret is pulled dynamically inside the Gateway
  providers: [AppWebSocketGateway],
  exports: [AppWebSocketGateway],
})
export class WebsocketModule {}