import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { IngestEventDto } from '@roadwatch/shared-types';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Telemetry Ingestion')
@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest raw telemetry from vehicle nodes' })
  @ApiResponse({ status: 201, description: 'Event successfully processed and clustered.' })
  @ApiResponse({ status: 400, description: 'Invalid payload structure.' })
  async ingestTelemetry(@Body() payload: IngestEventDto) {
    this.logger.debug(`Received telemetry from device: ${payload.deviceId}`);
    
    const data = await this.eventsService.processRawEvent(payload);
    
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }
}