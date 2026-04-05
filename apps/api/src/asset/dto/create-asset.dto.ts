import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AssetType } from '../../../generated/prisma/enums';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsString()
  @IsOptional()
  isin?: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsString()
  @IsOptional()
  sector?: string;
}
