import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { HeatmapService } from './heatmap.service';

@ApiTags('Analytics & Heatmap')
@ApiBearerAuth()
@Controller('heatmap')
export class HeatmapController {
  constructor(private readonly heatmapService: HeatmapService) {}

  @Get('data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve aggregated spatial density and zone analytics' })
  @ApiResponse({ status: 200, description: 'Heatmap data successfully generated.' })
  async getHeatmapData() {
    const data = await this.heatmapService.getHeatmapData();
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }
}