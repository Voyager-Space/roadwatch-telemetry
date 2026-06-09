import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PotholesModule } from '../potholes/potholes.module';

@Module({
  imports: [PotholesModule], // We need PotholesService to fetch the contextual data
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}