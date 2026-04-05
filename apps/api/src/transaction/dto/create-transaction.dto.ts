import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { TransactionType } from '../../../generated/prisma/enums';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;
}
