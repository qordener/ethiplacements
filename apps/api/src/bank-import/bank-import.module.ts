import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionModule } from '../transaction/transaction.module';
import { BankImportController } from './bank-import.controller';
import { BankImportService } from './bank-import.service';

@Module({
  imports: [PrismaModule, TransactionModule],
  controllers: [BankImportController],
  providers: [BankImportService],
})
export class BankImportModule {}
