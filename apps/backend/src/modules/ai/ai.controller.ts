import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateAISummaryDto } from '@roadwatch/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@roadwatch/shared-types';

@ApiTags('AI Analysis')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summary/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate or retrieve cached AI maintenance summary' })
  // Restrict expensive AI calls to operational staff
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST) 
  async generateSummary(@Body() dto: GenerateAISummaryDto) {
    const data = await this.aiService.generateSummary(dto);
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }
}