import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PriceFetcherService } from './price-fetcher.service';

@Injectable()
export class PriceSchedulerService {
  private readonly logger = new Logger(PriceSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fetcher: PriceFetcherService,
  ) {}

  /**
   * Runs every hour during market hours (Mon–Fri, 9h–18h CET).
   * Also runs once at startup via an explicit call from the module.
   */
  @Cron('0 9-18 * * 1-5', { timeZone: 'Europe/Paris' })
  async refreshPrices(): Promise<void> {
    this.logger.log('Démarrage du rafraîchissement des prix…');

    const assets = await this.prisma.asset.findMany({
      select: { id: true, ticker: true },
    });

    if (assets.length === 0) {
      this.logger.log('Aucun actif en base, rien à fetcher.');
      return;
    }

    const tickers = assets.map(a => a.ticker);
    const prices = await this.fetcher.fetchPrices(tickers);

    if (prices.length === 0) {
      this.logger.warn('Aucun prix récupéré (API indisponible ou tous les tickers inconnus).');
      return;
    }

    // Build a map ticker → assetId for O(1) lookup
    const tickerToId = new Map(assets.map(a => [a.ticker, a.id]));

    const snapshots = prices
      .map(p => {
        const assetId = tickerToId.get(p.ticker);
        if (!assetId) return null;
        return { assetId, price: p.price, currency: p.currency, source: 'yahoo' };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    await this.prisma.priceSnapshot.createMany({ data: snapshots });

    this.logger.log(`${snapshots.length}/${assets.length} prix enregistrés.`);
  }
}
