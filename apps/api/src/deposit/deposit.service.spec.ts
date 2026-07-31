import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DepositService, PEA_CEILING } from './deposit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

class PrismaP2025Error extends Error {
  code = 'P2025';
  constructor() { super('Record not found'); }
}

const mockPrisma = {
  portfolio: {
    findUnique: vi.fn(),
  },
  deposit: {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
};

describe('DepositService', () => {
  let service: DepositService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DepositService>(DepositService);
    vi.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a deposit with amount and date', async () => {
      const dto = { amount: 1000, date: '2026-01-15' };
      const expected = { id: 'd1', portfolioId: 'p1', amount: 1000, date: new Date('2026-01-15') };
      mockPrisma.deposit.create.mockResolvedValue(expected);

      const result = await service.create('p1', dto as CreateDepositDto);

      expect(mockPrisma.deposit.create).toHaveBeenCalledWith({
        data: { portfolioId: 'p1', amount: 1000, date: new Date('2026-01-15') },
      });
      expect(result).toEqual(expected);
    });
  });

  // ─── findAllByPortfolio ─────────────────────────────────────────────────────

  describe('findAllByPortfolio', () => {
    it('should return all deposits of a portfolio, most recent first', async () => {
      const deposits = [
        { id: 'd2', portfolioId: 'p1', amount: 500, date: new Date('2026-02-01') },
        { id: 'd1', portfolioId: 'p1', amount: 1000, date: new Date('2026-01-15') },
      ];
      mockPrisma.deposit.findMany.mockResolvedValue(deposits);

      const result = await service.findAllByPortfolio('p1');

      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith({
        where: { portfolioId: 'p1' },
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when portfolio has no deposits', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([]);

      const result = await service.findAllByPortfolio('p-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the deposit', async () => {
      const deleted = { id: 'd1', portfolioId: 'p1', amount: 1000, date: new Date('2026-01-15') };
      mockPrisma.deposit.delete.mockResolvedValue(deleted);

      const result = await service.remove('d1');

      expect(mockPrisma.deposit.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException when deposit does not exist (P2025)', async () => {
      mockPrisma.deposit.delete.mockRejectedValue(new PrismaP2025Error());

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getCeiling ───────────────────────────────────────────────────────────

  describe('getCeiling', () => {
    it('should throw NotFoundException when portfolio does not exist', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue(null);

      await expect(service.getCeiling('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return zeroed stats when no deposits recorded', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.deposit.findMany.mockResolvedValue([]);

      const result = await service.getCeiling('p1');

      expect(result).toEqual({ totalDeposited: 0, ceiling: PEA_CEILING, remaining: PEA_CEILING, percentage: 0 });
    });

    it('should sum deposits and compute remaining/percentage', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.deposit.findMany.mockResolvedValue([
        { id: 'd1', amount: 50_000 },
        { id: 'd2', amount: 25_000 },
      ]);

      const result = await service.getCeiling('p1');

      expect(result.totalDeposited).toBe(75_000);
      expect(result.remaining).toBe(75_000);
      expect(result.percentage).toBeCloseTo(50, 5);
    });

    it('should not let remaining go negative when deposits exceed the ceiling', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.deposit.findMany.mockResolvedValue([{ id: 'd1', amount: 160_000 }]);

      const result = await service.getCeiling('p1');

      expect(result.remaining).toBe(0);
      expect(result.percentage).toBeCloseTo((160_000 / PEA_CEILING) * 100, 5);
    });

    it('should ignore internal rebalancing: selling and rebuying an asset must not create a deposit', async () => {
      // Un arbitrage (SELL puis BUY sur des Transaction/Holding) ne touche jamais
      // la table Deposit — donc getCeiling reste basé uniquement sur les
      // versements explicitement enregistrés, jamais sur l'activité de trading.
      mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.deposit.findMany.mockResolvedValue([{ id: 'd1', amount: 10_000 }]);

      const result = await service.getCeiling('p1');

      expect(result.totalDeposited).toBe(10_000);
      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith({ where: { portfolioId: 'p1' } });
    });
  });
});
