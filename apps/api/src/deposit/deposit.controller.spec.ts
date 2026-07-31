import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { DepositService, PEA_CEILING } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

const mockDepositService = {
  create: vi.fn(),
  findAllByPortfolio: vi.fn(),
  remove: vi.fn(),
  getCeiling: vi.fn(),
};

describe('DepositController', () => {
  let controller: DepositController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepositController],
      providers: [{ provide: DepositService, useValue: mockDepositService }],
    }).compile();

    controller = module.get<DepositController>(DepositController);
    vi.clearAllMocks();
  });

  // ─── POST /portfolios/:portfolioId/deposits ────────────────────────────────

  describe('create', () => {
    it('should call service.create with portfolioId and dto', async () => {
      const dto = { amount: 1000, date: '2026-01-15' };
      const created = { id: 'd1', portfolioId: 'p1', ...dto };
      mockDepositService.create.mockResolvedValue(created);

      const result = await controller.create('p1', dto as CreateDepositDto);

      expect(mockDepositService.create).toHaveBeenCalledWith('p1', dto);
      expect(result).toEqual(created);
    });
  });

  // ─── GET /portfolios/:portfolioId/deposits ─────────────────────────────────

  describe('findAllByPortfolio', () => {
    it('should return all deposits for the given portfolio', async () => {
      const deposits = [{ id: 'd1', amount: 1000 }, { id: 'd2', amount: 500 }];
      mockDepositService.findAllByPortfolio.mockResolvedValue(deposits);

      const result = await controller.findAllByPortfolio('p1');

      expect(mockDepositService.findAllByPortfolio).toHaveBeenCalledWith('p1');
      expect(result).toHaveLength(2);
    });
  });

  // ─── DELETE /deposits/:id ───────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return the deleted deposit', async () => {
      const deleted = { id: 'd1', amount: 1000 };
      mockDepositService.remove.mockResolvedValue(deleted);

      const result = await controller.remove('d1');

      expect(mockDepositService.remove).toHaveBeenCalledWith('d1');
      expect(result).toEqual(deleted);
    });
  });

  // ─── GET /portfolios/:portfolioId/pea-ceiling ───────────────────────────────

  describe('getCeiling', () => {
    it('should return the ceiling stats for the given portfolio', async () => {
      const stats = { totalDeposited: 75_000, ceiling: PEA_CEILING, remaining: 75_000, percentage: 50 };
      mockDepositService.getCeiling.mockResolvedValue(stats);

      const result = await controller.getCeiling('p1');

      expect(mockDepositService.getCeiling).toHaveBeenCalledWith('p1');
      expect(result).toEqual(stats);
    });
  });
});
