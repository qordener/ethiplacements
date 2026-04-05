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
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.assetService.create(dto);
  }

  @Get()
  findAll() {
    return this.assetService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const asset = await this.assetService.findOne(id);
    if (!asset) throw new NotFoundException(`Asset ${id} introuvable`);
    return asset;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }
}
