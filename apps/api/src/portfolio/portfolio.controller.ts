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
  Query,
} from '@nestjs/common';
import { PortfolioService, HistoryRange } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  create(@Body() dto: CreatePortfolioDto) {
    return this.portfolioService.create(dto);
  }

  @Get()
  findAll() {
    return this.portfolioService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findOne(id);
    if (!portfolio) throw new NotFoundException(`Portfolio ${id} introuvable`);
    return portfolio;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolioService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.portfolioService.remove(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.portfolioService.getSummary(id);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query('range') range?: HistoryRange,
  ) {
    return this.portfolioService.getHistory(id, range ?? '1m');
  }
}
