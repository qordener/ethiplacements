import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EsgLabelService } from './esg-label.service';
import { SyncLabelsDto } from './dto/sync-labels.dto';

@Controller()
export class EsgLabelController {
  constructor(private readonly esgLabelService: EsgLabelService) {}

  @Post('esg-labels/sync')
  sync(@Body() dto: SyncLabelsDto) {
    return this.esgLabelService.syncFromUrl(dto.url);
  }

  @Get('assets/:assetId/labels')
  findAllByAsset(@Param('assetId') assetId: string) {
    return this.esgLabelService.findAllByAsset(assetId);
  }
}
