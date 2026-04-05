import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEsgScoreDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
