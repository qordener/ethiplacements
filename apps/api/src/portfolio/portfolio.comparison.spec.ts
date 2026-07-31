import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';
import { PriceFetcherService } from '../price/price-fetcher.service';

const mockPrisma = {
  portfolio: { findUnique: vi.fn() },
  priceSnapshot: { findMany: vi.fn() },
};

const mockPriceFetcher = {
  fetchHistory: vi.fn(),
};

describe('PortfolioService.getComparison', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PriceFetcherService, useValue: mockPriceFetcher },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    vi.clearAllMocks();
  });

  it('should throw NotFoundException when portfolio does not exist', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue(null);

    await expect(service.getComparison('nonexistent')).rejects.toThrow(NotFoundException);
    expect(mockPriceFetcher.fetchHistory).not.toHaveBeenCalled();
  });

  it('should fetch CAC 40 and MSCI World SRI history alongside the portfolio history', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1', holdings: [] });
    mockPriceFetcher.fetchHistory.mockResolvedValue([]);

    await service.getComparison('p1');

    expect(mockPriceFetcher.fetchHistory).toHaveBeenCalledWith('^FCHI', '1m');
    expect(mockPriceFetcher.fetchHistory).toHaveBeenCalledWith('SUSW.L', '1m');
  });

  it('should pass the requested range through to both benchmarks', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1', holdings: [] });
    mockPriceFetcher.fetchHistory.mockResolvedValue([]);

    await service.getComparison('p1', '1y');

    expect(mockPriceFetcher.fetchHistory).toHaveBeenCalledWith('^FCHI', '1y');
    expect(mockPriceFetcher.fetchHistory).toHaveBeenCalledWith('SUSW.L', '1y');
  });

  it('should return the portfolio history and both benchmark series as date/value points', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      holdings: [{ quantity: 10, averagePrice: 100, assetId: 'a1' }],
    });
    mockPrisma.priceSnapshot.findMany.mockResolvedValue([
      { assetId: 'a1', price: 110, fetchedAt: new Date('2026-04-01T15:00:00Z') },
    ]);
    mockPriceFetcher.fetchHistory
      .mockResolvedValueOnce([{ date: '2026-04-01', price: 7500 }]) // CAC 40
      .mockResolvedValueOnce([{ date: '2026-04-01', price: 96.5 }]); // MSCI World SRI

    const result = await service.getComparison('p1');

    expect(result.portfolio).toEqual([{ date: '2026-04-01', value: 1100 }]);
    expect(result.benchmarks.cac40).toEqual([{ date: '2026-04-01', value: 7500 }]);
    expect(result.benchmarks.msciWorldSri).toEqual([{ date: '2026-04-01', value: 96.5 }]);
  });

  it('should return empty benchmark series when Yahoo Finance is unreachable, without failing the request', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1', holdings: [] });
    mockPriceFetcher.fetchHistory.mockResolvedValue([]);

    const result = await service.getComparison('p1');

    expect(result.benchmarks.cac40).toEqual([]);
    expect(result.benchmarks.msciWorldSri).toEqual([]);
  });
});
