import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateEsgScoreDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
