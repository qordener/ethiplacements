import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('holdings/:holdingId/transactions')
  create(@Param('holdingId') holdingId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionService.create(holdingId, dto);
  }

  @Get('holdings/:holdingId/transactions')
  findAllByHolding(@Param('holdingId') holdingId: string) {
    return this.transactionService.findAllByHolding(holdingId);
  }

  @Get('transactions/:id')
  async findOne(@Param('id') id: string) {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) throw new NotFoundException(`Transaction ${id} introuvable`);
    return transaction;
  }

  @Patch('transactions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionService.update(id, dto);
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
}
