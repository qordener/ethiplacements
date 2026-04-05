import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
