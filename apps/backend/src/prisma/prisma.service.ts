import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('📦 Successfully connected to PostGIS database.');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      process.exit(1); // Fail fast if DB is inaccessible
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection cleanly closed.');
  }
}