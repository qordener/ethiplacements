import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { AssetModule } from '../asset/asset.module';
import { EsgScoreModule } from '../esg-score/esg-score.module';
import { HoldingModule } from '../holding/holding.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [PrismaModule, PortfolioModule, AssetModule, EsgScoreModule, HoldingModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
