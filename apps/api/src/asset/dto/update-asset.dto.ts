import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
}
