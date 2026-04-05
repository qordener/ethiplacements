import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EsgScoreService } from './esg-score.service';
import { CreateEsgScoreDto } from './dto/create-esg-score.dto';
import { UpdateEsgScoreDto } from './dto/update-esg-score.dto';

@Controller()
export class EsgScoreController {
  constructor(private readonly esgScoreService: EsgScoreService) {}

  // POST /assets/:assetId/esg-scores
  @Post('assets/:assetId/esg-scores')
  create(@Param('assetId') assetId: string, @Body() dto: CreateEsgScoreDto) {
    return this.esgScoreService.create({ ...dto, assetId });
  }

  // GET /assets/:assetId/esg-scores
  @Get('assets/:assetId/esg-scores')
  findAllByAsset(@Param('assetId') assetId: string) {
    return this.esgScoreService.findAllByAsset(assetId);
  }

  // GET /esg-scores/:id
  @Get('esg-scores/:id')
  async findOne(@Param('id') id: string) {
    const score = await this.esgScoreService.findOne(id);
    if (!score) throw new NotFoundException(`EsgScore ${id} introuvable`);
    return score;
  }

  // PATCH /esg-scores/:id
  @Patch('esg-scores/:id')
  update(@Param('id') id: string, @Body() dto: UpdateEsgScoreDto) {
    return this.esgScoreService.update(id, dto);
  }

  // DELETE /esg-scores/:id
  @Delete('esg-scores/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.esgScoreService.remove(id);
  }
}
