import { IsUrl } from 'class-validator';

export class SyncLabelsDto {
  @IsUrl()
  url: string;
}
