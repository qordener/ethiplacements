import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface FetchedPrice {
  ticker: string;
  price: number;
  currency: string;
}

export interface HistoricalPricePoint {
  date: string;
  price: number;
}

export type FetchRange = '1m' | '3m' | '1y';

const YAHOO_RANGE: Record<FetchRange, string> = { '1m': '1mo', '3m': '3mo', '1y': '1y' };

@Injectable()
export class PriceFetcherService {
  private readonly logger = new Logger(PriceFetcherService.name);

  /**
   * Fetches the latest price for a single ticker from Yahoo Finance.
   * Returns null if the ticker is unknown or the API is unreachable.
   */
  async fetchPrice(ticker: string): Promise<FetchedPrice | null> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;

    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const price: number = meta.regularMarketPrice ?? meta.previousClose;
      const currency: string = meta.currency ?? 'USD';

      if (!price || price <= 0) return null;

      return { ticker, price, currency };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Impossible de récupérer le prix de ${ticker}: ${message}`);
      return null;
    }
  }

  /**
   * Fetches the daily closing price history for a single ticker over the
   * given range. Used for benchmarks (indices/ETFs), which — unlike our own
   * holdings — have deep public history directly available from Yahoo,
   * so no local snapshot accumulation is needed.
   */
  async fetchHistory(ticker: string, range: FetchRange): Promise<HistoricalPricePoint[]> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=${YAHOO_RANGE[range]}`;

    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return [];

      const timestamps: number[] = result.timestamp ?? [];
      const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

      const points: HistoricalPricePoint[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const price = closes[i];
        if (price === null || price === undefined) continue;
        points.push({ date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10), price });
      }
      return points;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Impossible de récupérer l'historique de ${ticker}: ${message}`);
      return [];
    }
  }

  /**
   * Fetches prices for multiple tickers concurrently (max 5 at a time).
   */
  async fetchPrices(tickers: string[]): Promise<FetchedPrice[]> {
    const CONCURRENCY = 5;
    const results: FetchedPrice[] = [];

    for (let i = 0; i < tickers.length; i += CONCURRENCY) {
      const batch = tickers.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(batch.map(t => this.fetchPrice(t)));

      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value !== null) {
          results.push(result.value);
        }
      }
    }

    return results;
  }
}
