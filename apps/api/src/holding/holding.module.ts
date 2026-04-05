import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HoldingController } from './holding.controller';
import { HoldingService } from './holding.service';

@Module({
  imports: [PrismaModule],
  controllers: [HoldingController],
  providers: [HoldingService],
  exports: [HoldingService],
})
export class HoldingModule {}
