import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Controller()
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post('portfolios/:portfolioId/deposits')
  create(@Param('portfolioId') portfolioId: string, @Body() dto: CreateDepositDto) {
    return this.depositService.create(portfolioId, dto);
  }

  @Get('portfolios/:portfolioId/deposits')
  findAllByPortfolio(@Param('portfolioId') portfolioId: string) {
    return this.depositService.findAllByPortfolio(portfolioId);
  }

  @Delete('deposits/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.depositService.remove(id);
  }

  @Get('portfolios/:portfolioId/pea-ceiling')
  getCeiling(@Param('portfolioId') portfolioId: string) {
    return this.depositService.getCeiling(portfolioId);
  }
}
