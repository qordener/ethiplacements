import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PriceSchedulerService } from './price-scheduler.service';
import { PriceFetcherService } from './price-fetcher.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  asset: { findMany: vi.fn() },
  priceSnapshot: { createMany: vi.fn() },
};

const mockFetcher = {
  fetchPrices: vi.fn(),
};

describe('PriceSchedulerService', () => {
  let service: PriceSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceSchedulerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PriceFetcherService, useValue: mockFetcher },
      ],
    }).compile();

    service = module.get<PriceSchedulerService>(PriceSchedulerService);
    vi.clearAllMocks();
  });

  describe('refreshPrices', () => {
    it('should do nothing when no assets exist', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([]);

      await service.refreshPrices();

      expect(mockFetcher.fetchPrices).not.toHaveBeenCalled();
      expect(mockPrisma.priceSnapshot.createMany).not.toHaveBeenCalled();
    });

    it('should fetch prices for all asset tickers', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'a1', ticker: 'BN.PA' },
        { id: 'a2', ticker: 'AAPL' },
      ]);
      mockFetcher.fetchPrices.mockResolvedValue([
        { ticker: 'BN.PA', price: 155.5, currency: 'EUR' },
        { ticker: 'AAPL', price: 200, currency: 'USD' },
      ]);
      mockPrisma.priceSnapshot.createMany.mockResolvedValue({ count: 2 });

      await service.refreshPrices();

      expect(mockFetcher.fetchPrices).toHaveBeenCalledWith(['BN.PA', 'AAPL']);
    });

    it('should persist a snapshot for each fetched price', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'a1', ticker: 'BN.PA' },
      ]);
      mockFetcher.fetchPrices.mockResolvedValue([
        { ticker: 'BN.PA', price: 155.5, currency: 'EUR' },
      ]);
      mockPrisma.priceSnapshot.createMany.mockResolvedValue({ count: 1 });

      await service.refreshPrices();

      expect(mockPrisma.priceSnapshot.createMany).toHaveBeenCalledWith({
        data: [{ assetId: 'a1', price: 155.5, currency: 'EUR', source: 'yahoo' }],
      });
    });

    it('should skip tickers not found in the asset map', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'a1', ticker: 'BN.PA' },
      ]);
      // Fetcher returns an extra ticker not in DB (shouldn't happen but defensive)
      mockFetcher.fetchPrices.mockResolvedValue([
        { ticker: 'BN.PA', price: 155.5, currency: 'EUR' },
        { ticker: 'GHOST', price: 10, currency: 'USD' },
      ]);
      mockPrisma.priceSnapshot.createMany.mockResolvedValue({ count: 1 });

      await service.refreshPrices();

      expect(mockPrisma.priceSnapshot.createMany).toHaveBeenCalledWith({
        data: [{ assetId: 'a1', price: 155.5, currency: 'EUR', source: 'yahoo' }],
      });
    });

    it('should not call createMany when fetcher returns nothing', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'a1', ticker: 'BN.PA' },
      ]);
      mockFetcher.fetchPrices.mockResolvedValue([]);

      await service.refreshPrices();

      expect(mockPrisma.priceSnapshot.createMany).not.toHaveBeenCalled();
    });
  });
});
