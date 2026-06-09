import { Module } from '@nestjs/common';
import { PotholesController } from './potholes.controller';
import { PotholesService } from './potholes.service';

@Module({
  controllers: [PotholesController],
  providers: [PotholesService],
  exports: [PotholesService],
})
export class PotholesModule {}