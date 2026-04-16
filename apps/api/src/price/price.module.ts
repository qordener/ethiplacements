import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PriceFetcherService } from './price-fetcher.service';
import { PriceSchedulerService } from './price-scheduler.service';

@Module({
  imports: [PrismaModule],
  providers: [PriceFetcherService, PriceSchedulerService],
  exports: [PriceFetcherService],
})
export class PriceModule {}
