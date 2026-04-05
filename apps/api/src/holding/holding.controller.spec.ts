import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HoldingController } from './holding.controller';
import { HoldingService } from './holding.service';

const mockHoldingService = {
  create: vi.fn(),
  findAllByPortfolio: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('HoldingController', () => {
  let controller: HoldingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoldingController],
      providers: [{ provide: HoldingService, useValue: mockHoldingService }],
    }).compile();

    controller = module.get<HoldingController>(HoldingController);
    vi.clearAllMocks();
  });

  // ─── POST /portfolios/:portfolioId/holdings ────────────────────────────────

  describe('create', () => {
    it('should call service.create with portfolioId and dto', async () => {
      const dto = { assetId: 'asset1', quantity: 10, averagePrice: 100 };
      const created = { id: 'h1', portfolioId: 'p1', ...dto, asset: { ticker: 'CW8' } };
      mockHoldingService.create.mockResolvedValue(created);

      const result = await controller.create('p1', dto as any);

      expect(mockHoldingService.create).toHaveBeenCalledWith('p1', dto);
      expect(result).toEqual(created);
    });
  });

  // ─── GET /portfolios/:portfolioId/holdings ─────────────────────────────────

  describe('findAllByPortfolio', () => {
    it('should return all holdings for the given portfolio', async () => {
      const holdings = [
        { id: 'h1', quantity: 10, asset: { ticker: 'CW8' } },
        { id: 'h2', quantity: 5, asset: { ticker: 'BTC' } },
      ];
      mockHoldingService.findAllByPortfolio.mockResolvedValue(holdings);

      const result = await controller.findAllByPortfolio('p1');

      expect(mockHoldingService.findAllByPortfolio).toHaveBeenCalledWith('p1');
      expect(result).toHaveLength(2);
    });
  });

  // ─── GET /holdings/:id ────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the holding when found', async () => {
      const holding = { id: 'h1', quantity: 10, asset: { ticker: 'CW8' }, transactions: [] };
      mockHoldingService.findOne.mockResolvedValue(holding);

      const result = await controller.findOne('h1');

      expect(result).toEqual(holding);
    });

    it('should throw NotFoundException when holding does not exist', async () => {
      mockHoldingService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PATCH /holdings/:id ──────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the holding', async () => {
      const dto = { quantity: 15 };
      const updated = { id: 'h1', quantity: 15, averagePrice: 100 };
      mockHoldingService.update.mockResolvedValue(updated);

      const result = await controller.update('h1', dto as any);

      expect(mockHoldingService.update).toHaveBeenCalledWith('h1', dto);
      expect(result).toEqual(updated);
    });
  });

  // ─── DELETE /holdings/:id ─────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return the deleted holding', async () => {
      const deleted = { id: 'h1', quantity: 10 };
      mockHoldingService.remove.mockResolvedValue(deleted);

      const result = await controller.remove('h1');

      expect(mockHoldingService.remove).toHaveBeenCalledWith('h1');
      expect(result).toEqual(deleted);
    });
  });
});
