import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EsgScoreController } from './esg-score.controller';
import { EsgScoreService } from './esg-score.service';

@Module({
  imports: [PrismaModule],
  controllers: [EsgScoreController],
  providers: [EsgScoreService],
  exports: [EsgScoreService],
})
export class EsgScoreModule {}
