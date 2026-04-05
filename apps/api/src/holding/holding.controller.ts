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
import { HoldingService } from './holding.service';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';

@Controller()
export class HoldingController {
  constructor(private readonly holdingService: HoldingService) {}

  @Post('portfolios/:portfolioId/holdings')
  create(@Param('portfolioId') portfolioId: string, @Body() dto: CreateHoldingDto) {
    return this.holdingService.create(portfolioId, dto);
  }

  @Get('portfolios/:portfolioId/holdings')
  findAllByPortfolio(@Param('portfolioId') portfolioId: string) {
    return this.holdingService.findAllByPortfolio(portfolioId);
  }

  @Get('holdings/:id')
  async findOne(@Param('id') id: string) {
    const holding = await this.holdingService.findOne(id);
    if (!holding) throw new NotFoundException(`Holding ${id} introuvable`);
    return holding;
  }

  @Patch('holdings/:id')
  update(@Param('id') id: string, @Body() dto: UpdateHoldingDto) {
    return this.holdingService.update(id, dto);
  }

  @Delete('holdings/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.holdingService.remove(id);
  }
}
