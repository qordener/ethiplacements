import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;
}
