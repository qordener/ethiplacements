import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AssetType } from '../../../generated/prisma/enums';

export class UpdateAssetDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  ticker?: string;

  @IsString()
  @IsOptional()
  isin?: string;

  @IsEnum(AssetType)
  @IsOptional()
  type?: AssetType;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  manualPrice?: number;

  @IsDateString()
  @IsOptional()
  manualPriceDate?: string;
}
