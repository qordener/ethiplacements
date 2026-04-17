import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  portfolio: { findUnique: vi.fn() },
  priceSnapshot: { findMany: vi.fn() },
};

// Helper : crée un snapshot à une date donnée (YYYY-MM-DD HH:mm)
function snap(assetId: string, price: number, isoDate: string) {
  return { assetId, price, fetchedAt: new Date(isoDate) };
}

describe('PortfolioService.getHistory', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    vi.clearAllMocks();
  });

  it('should throw NotFoundException when portfolio does not exist', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue(null);

    await expect(service.getHistory('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should return empty array when portfolio has no active holdings', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1', holdings: [],
    });

    const result = await service.getHistory('p1');

    expect(result).toEqual([]);
    expect(mockPrisma.priceSnapshot.findMany).not.toHaveBeenCalled();
  });

  it('should return empty array when no snapshots exist in range', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([]);

    const result = await service.getHistory('p1');

    expect(result).toEqual([]);
  });

  it('should return one point per day with portfolio value', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      snap('a1', 110, '2026-04-01T15:00:00Z'),
      snap('a1', 115, '2026-04-02T15:00:00Z'),
    ]);

    const result = await service.getHistory('p1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-04-01', value: 1100 });
    expect(result[1]).toEqual({ date: '2026-04-02', value: 1150 });
  });

  it('should use the last snapshot of the day when multiple exist', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    // Deux snapshots le même jour : doit utiliser le dernier (116)
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      snap('a1', 112, '2026-04-01T10:00:00Z'),
      snap('a1', 116, '2026-04-01T16:00:00Z'),
    ]);

    const result = await service.getHistory('p1');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2026-04-01', value: 1160 });
  });

  it('should carry forward last known price for days with missing snapshots', async () => {
    // J1: a1=110, J2: pas de snapshot pour a1, J3: a1=120
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      snap('a1', 110, '2026-04-01T15:00:00Z'),
      snap('a1', 120, '2026-04-03T15:00:00Z'),
    ]);

    const result = await service.getHistory('p1');

    // Seuls les jours avec snapshots sont émis (pas d'interpolation des jours vides)
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-04-01', value: 1100 });
    expect(result[1]).toEqual({ date: '2026-04-03', value: 1200 });
  });

  it('should sum across multiple holdings', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [
        { quantity: 10, averagePrice: 100, assetId: 'a1' },
        { quantity: 5, averagePrice: 200, assetId: 'a2' },
      ],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      snap('a1', 110, '2026-04-01T15:00:00Z'),
      snap('a2', 210, '2026-04-01T15:00:00Z'),
    ]);

    const result = await service.getHistory('p1');

    // 10 * 110 + 5 * 210 = 1100 + 1050 = 2150
    expect(result[0].value).toBe(2150);
  });

  it('should use averagePrice as fallback for assets with no snapshot that day', async () => {
    // a1 a un snapshot, a2 n'en a pas → a2 utilise son averagePrice
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [
        { quantity: 10, averagePrice: 100, assetId: 'a1' },
        { quantity: 5, averagePrice: 200, assetId: 'a2' },
      ],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      snap('a1', 110, '2026-04-01T15:00:00Z'),
      // Aucun snapshot pour a2
    ]);

    const result = await service.getHistory('p1');

    // 10 * 110 + 5 * 200 = 1100 + 1000 = 2100
    expect(result[0].value).toBe(2100);
  });

  it('should query snapshots with correct date range for 3m', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([]);

    await service.getHistory('p1', '3m');

    const call = mockPrisma.priceSnapshot.findMany.mock.calls[0][0];
    const since: Date = call.where.fetchedAt.gte;
    const diffDays = Math.round((Date.now() - since.getTime()) / 86_400_000);
    expect(diffDays).toBeCloseTo(90, 0);
  });

  it('should query snapshots with correct date range for 1y', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([]);

    await service.getHistory('p1', '1y');

    const call = mockPrisma.priceSnapshot.findMany.mock.calls[0][0];
    const since: Date = call.where.fetchedAt.gte;
    const diffDays = Math.round((Date.now() - since.getTime()) / 86_400_000);
    expect(diffDays).toBeCloseTo(365, 0);
  });

  it('should exclude holdings with quantity=0', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [
        { quantity: 10, averagePrice: 100, assetId: 'a1' },
        { quantity: 0, averagePrice: 200, assetId: 'a2' }, // clôturée
      ],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      snap('a1', 110, '2026-04-01T15:00:00Z'),
    ]);

    const result = await service.getHistory('p1');

    // Seul a1 contribue : 10 * 110 = 1100
    expect(result[0].value).toBe(1100);
  });
});
