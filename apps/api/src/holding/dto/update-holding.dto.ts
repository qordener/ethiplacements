import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateHoldingDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  averagePrice?: number;
}
