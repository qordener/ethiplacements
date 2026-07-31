import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { PriceFetcherService } from './price-fetcher.service';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const makeYahooResponse = (price: number, currency = 'EUR') => ({
  data: {
    chart: {
      result: [{
        meta: {
          regularMarketPrice: price,
          currency,
        },
      }],
    },
  },
});

describe('PriceFetcherService', () => {
  let service: PriceFetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceFetcherService],
    }).compile();

    service = module.get<PriceFetcherService>(PriceFetcherService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── fetchPrice ───────────────────────────────────────────────────────────

  describe('fetchPrice', () => {
    it('should return price and currency for a valid ticker', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(makeYahooResponse(155.5, 'EUR'));

      const result = await service.fetchPrice('BN.PA');

      expect(result).toEqual({ ticker: 'BN.PA', price: 155.5, currency: 'EUR' });
    });

    it('should use previousClose when regularMarketPrice is absent', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: {
          chart: {
            result: [{ meta: { previousClose: 150, currency: 'EUR' } }],
          },
        },
      });

      const result = await service.fetchPrice('BN.PA');

      expect(result?.price).toBe(150);
    });

    it('should return null when chart result is empty', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: { chart: { result: null } },
      });

      const result = await service.fetchPrice('UNKNOWN');

      expect(result).toBeNull();
    });

    it('should return null when price is zero', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(makeYahooResponse(0));

      const result = await service.fetchPrice('ZERO');

      expect(result).toBeNull();
    });

    it('should return null when axios throws (network error)', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.fetchPrice('BN.PA');

      expect(result).toBeNull();
    });

    it('should encode special characters in the ticker URL', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(makeYahooResponse(100));

      await service.fetchPrice('BN.PA');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('BN.PA'),
        expect.any(Object),
      );
    });
  });

  // ─── fetchHistory ─────────────────────────────────────────────────────────

  describe('fetchHistory', () => {
    const makeHistoryResponse = (timestamps: number[], closes: (number | null)[]) => ({
      data: {
        chart: {
          result: [{
            timestamp: timestamps,
            indicators: { quote: [{ close: closes }] },
          }],
        },
      },
    });

    it('should return one point per timestamp with date and price', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(
        makeHistoryResponse([1735689600, 1735776000], [7500.5, 7550.25])
      );

      const result = await service.fetchHistory('^FCHI', '1m');

      expect(result).toEqual([
        { date: '2025-01-01', price: 7500.5 },
        { date: '2025-01-02', price: 7550.25 },
      ]);
    });

    it('should skip null closes (non-trading days at range edges)', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(
        makeHistoryResponse([1735689600, 1735776000, 1735862400], [null, 7550.25, null])
      );

      const result = await service.fetchHistory('^FCHI', '1m');

      expect(result).toEqual([{ date: '2025-01-02', price: 7550.25 }]);
    });

    it('should return empty array when chart result is empty', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { chart: { result: null } } });

      const result = await service.fetchHistory('UNKNOWN', '1m');

      expect(result).toEqual([]);
    });

    it('should return empty array when axios throws (network error)', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.fetchHistory('^FCHI', '1m');

      expect(result).toEqual([]);
    });

    it('should map the range parameter to the Yahoo range query param', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(makeHistoryResponse([], []));

      await service.fetchHistory('^FCHI', '3m');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('range=3mo'),
        expect.any(Object),
      );
    });

    it('should map the 1y range to Yahoo\'s 1y range param', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue(makeHistoryResponse([], []));

      await service.fetchHistory('^FCHI', '1y');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('range=1y'),
        expect.any(Object),
      );
    });
  });

  // ─── fetchPrices ──────────────────────────────────────────────────────────

  describe('fetchPrices', () => {
    it('should return results for all successful tickers', async () => {
      mockedAxios.get = vi.fn()
        .mockResolvedValueOnce(makeYahooResponse(155, 'EUR'))
        .mockResolvedValueOnce(makeYahooResponse(200, 'USD'));

      const results = await service.fetchPrices(['BN.PA', 'AAPL']);

      expect(results).toHaveLength(2);
      expect(results[0].ticker).toBe('BN.PA');
      expect(results[1].ticker).toBe('AAPL');
    });

    it('should skip failed tickers and return partial results', async () => {
      mockedAxios.get = vi.fn()
        .mockResolvedValueOnce(makeYahooResponse(155, 'EUR'))
        .mockRejectedValueOnce(new Error('timeout'));

      const results = await service.fetchPrices(['BN.PA', 'BAD']);

      expect(results).toHaveLength(1);
      expect(results[0].ticker).toBe('BN.PA');
    });

    it('should return empty array when all tickers fail', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('network error'));

      const results = await service.fetchPrices(['BAD1', 'BAD2']);

      expect(results).toHaveLength(0);
    });

    it('should return empty array for empty input', async () => {
      const results = await service.fetchPrices([]);

      expect(results).toHaveLength(0);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});
