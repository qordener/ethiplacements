import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { HoldingService } from './holding.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaP2025Error extends Error {
  code = 'P2025';
  constructor() { super('Record not found'); }
}

class PrismaP2002Error extends Error {
  code = 'P2002';
  constructor() { super('Unique constraint failed'); }
}

const mockPrisma = {
  holding: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('HoldingService', () => {
  let service: HoldingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoldingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HoldingService>(HoldingService);
    vi.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a holding with quantity and averagePrice', async () => {
      const dto = { assetId: 'asset1', quantity: 10, averagePrice: 100 };
      const expected = { id: 'h1', portfolioId: 'p1', ...dto };
      mockPrisma.holding.create.mockResolvedValue(expected);

      const result = await service.create('p1', dto as any);

      expect(mockPrisma.holding.create).toHaveBeenCalledWith({
        data: { portfolioId: 'p1', ...dto },
        include: { asset: true },
      });
      expect(result).toEqual(expected);
    });

    it('should throw ConflictException when asset already in portfolio (P2002)', async () => {
      mockPrisma.holding.create.mockRejectedValue(new PrismaP2002Error());

      await expect(service.create('p1', { assetId: 'asset1', quantity: 5, averagePrice: 50 } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  // ─── findAllByPortfolio ─────────────────────────────────────────────���─────

  describe('findAllByPortfolio', () => {
    it('should return all holdings of a portfolio with their asset', async () => {
      const holdings = [
        { id: 'h1', portfolioId: 'p1', assetId: 'asset1', quantity: 10, averagePrice: 100, asset: { ticker: 'CW8' } },
        { id: 'h2', portfolioId: 'p1', assetId: 'asset2', quantity: 5, averagePrice: 200, asset: { ticker: 'BTC' } },
      ];
      mockPrisma.holding.findMany.mockResolvedValue(holdings);

      const result = await service.findAllByPortfolio('p1');

      expect(mockPrisma.holding.findMany).toHaveBeenCalledWith({
        where: { portfolioId: 'p1' },
        include: { asset: { include: { esgScores: true } } },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when portfolio has no holdings', async () => {
      mockPrisma.holding.findMany.mockResolvedValue([]);

      const result = await service.findAllByPortfolio('p-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a holding with asset and transactions', async () => {
      const holding = {
        id: 'h1',
        portfolioId: 'p1',
        assetId: 'asset1',
        quantity: 10,
        averagePrice: 100,
        asset: { ticker: 'CW8' },
        transactions: [],
      };
      mockPrisma.holding.findUnique.mockResolvedValue(holding);

      const result = await service.findOne('h1');

      expect(mockPrisma.holding.findUnique).toHaveBeenCalledWith({
        where: { id: 'h1' },
        include: { asset: { include: { esgScores: true } }, transactions: { orderBy: { date: 'desc' } } },
      });
      expect(result).toEqual(holding);
    });

    it('should return null when holding does not exist', async () => {
      mockPrisma.holding.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update quantity and averagePrice of a holding', async () => {
      const dto = { quantity: 15, averagePrice: 110 };
      const updated = { id: 'h1', portfolioId: 'p1', assetId: 'asset1', ...dto };
      mockPrisma.holding.update.mockResolvedValue(updated);

      const result = await service.update('h1', dto as any);

      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: dto,
      });
      expect(result.quantity).toBe(15);
    });

    it('should throw NotFoundException when holding does not exist (P2025)', async () => {
      mockPrisma.holding.update.mockRejectedValue(new PrismaP2025Error());

      await expect(service.update('nonexistent', { quantity: 5 } as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the holding and cascade to transactions', async () => {
      const deleted = { id: 'h1', portfolioId: 'p1', assetId: 'asset1', quantity: 10, averagePrice: 100 };
      mockPrisma.holding.delete.mockResolvedValue(deleted);

      const result = await service.remove('h1');

      expect(mockPrisma.holding.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException when holding does not exist (P2025)', async () => {
      mockPrisma.holding.delete.mockRejectedValue(new PrismaP2025Error());

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
