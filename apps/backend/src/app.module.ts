import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { PotholesModule } from './modules/potholes/potholes.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AiModule } from './modules/ai/ai.module';
import { HeatmapModule } from './modules/heatmap/heatmap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      cache: true,
    }),
    PrismaModule,
    WebsocketModule,
    AuthModule,
    EventsModule,
    PotholesModule,
    AiModule,
    HeatmapModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}