import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PotholesService } from './potholes.service';
import { 
  PotholeFilterDto, 
  ChangeStatusDto, 
  PaginationParams 
} from '@roadwatch/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Potholes')
@ApiBearerAuth()
@Controller('potholes')
export class PotholesController {
  constructor(private readonly potholesService: PotholesService) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated and filtered list of potholes' })
  async findAll(@Body() filters: PotholeFilterDto & PaginationParams) {
    const result = await this.potholesService.findAll(filters);
    return {
      success: true,
      ...result,
      timestamp: new Date(),
    };
  }

  @Post('map-markers')
  @ApiOperation({ summary: 'Get optimized marker data for the live map' })
  async getMapMarkers(@Body() filters: PotholeFilterDto) {
    const data = await this.potholesService.getMapMarkers(filters);
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complete pothole details including history and events' })
  async findOne(@Param('id') id: string) {
    const data = await this.potholesService.findOne(id);
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update pothole lifecycle status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id' as any) userId: string,
  ) {
    const data = await this.potholesService.updateStatus(id, dto, userId);
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }
}