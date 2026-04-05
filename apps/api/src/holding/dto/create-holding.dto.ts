import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateHoldingDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  averagePrice: number;
}
