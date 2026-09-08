import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PriceFetcherService } from './price-fetcher.service';

/**
 * Toute l'application raisonne et affiche en euros : `currentValue`,
 * `totalInvested` et le plafond PEA sont additionnés sans conversion. Un prix
 * libellé dans une autre devise ne peut donc pas être stocké — il gonflerait
 * ou minorerait la valorisation d'un facteur silencieux.
 */
const PORTFOLIO_CURRENCY = 'EUR';

@Injectable()
export class PriceSchedulerService {
  private readonly logger = new Logger(PriceSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fetcher: PriceFetcherService,
  ) {}

  /**
   * Runs every hour during market hours (Mon–Fri, 9h–18h CET).
   */
  @Cron('0 9-18 * * 1-5', { timeZone: 'Europe/Paris' })
  async refreshPrices(): Promise<void> {
    this.logger.log('Démarrage du rafraîchissement des prix…');

    const assets = await this.prisma.asset.findMany({
      select: { id: true, ticker: true, isin: true },
    });

    if (assets.length === 0) {
      this.logger.log('Aucun actif en base, rien à fetcher.');
      return;
    }

    // Premier filtre : le ticker désigne-t-il bien le titre attendu ? Un
    // ticker Euronext court entre facilement en collision avec une valeur
    // américaine homonyme (SU → Suncor et non Schneider). Quand l'ISIN est
    // connu, il fait autorité : en cas de désaccord on s'abstient, plutôt que
    // d'enregistrer le prix d'une autre société ou de corriger d'office la
    // saisie de l'utilisateur.
    const eligible: { id: string; ticker: string }[] = [];

    for (const asset of assets) {
      if (!asset.isin) {
        eligible.push({ id: asset.id, ticker: asset.ticker });
        continue;
      }

      const expected = await this.fetcher.resolveSymbolFromIsin(asset.isin);
      if (!expected) {
        // ISIN non résolu : on ne sait pas trancher, donc on laisse passer le
        // ticker tel quel. Le garde-fou de devise reste en dernier recours.
        eligible.push({ id: asset.id, ticker: asset.ticker });
        continue;
      }

      if (expected.toUpperCase() !== asset.ticker.toUpperCase()) {
        this.logger.warn(
          `Ticker « ${asset.ticker} » incohérent avec l'ISIN ${asset.isin}, ` +
            `qui correspond à « ${expected} » — prix ignoré. Corriger le ticker de cet actif.`,
        );
        continue;
      }

      eligible.push({ id: asset.id, ticker: asset.ticker });
    }

    if (eligible.length === 0) {
      this.logger.warn('Aucun actif avec un ticker vérifiable, rien à fetcher.');
      return;
    }

    const prices = await this.fetcher.fetchPrices(eligible.map((a) => a.ticker));

    if (prices.length === 0) {
      this.logger.warn('Aucun prix récupéré (API indisponible ou tous les tickers inconnus).');
      return;
    }

    // Build a map ticker → assetId for O(1) lookup
    const tickerToId = new Map(eligible.map((a) => [a.ticker, a.id]));

    const snapshots = prices
      .map((p) => {
        const assetId = tickerToId.get(p.ticker);
        if (!assetId) return null;

        // Second filtre : la devise. Il rattrape les actifs sans ISIN, pour
        // lesquels aucun contrôle d'identité n'a pu être fait.
        if (p.currency !== PORTFOLIO_CURRENCY) {
          this.logger.warn(
            `Prix de « ${p.ticker} » libellé en ${p.currency} et non en ${PORTFOLIO_CURRENCY} — ignoré. ` +
              `Vérifier que le ticker désigne bien la place de cotation attendue (suffixe .PA pour Euronext Paris).`,
          );
          return null;
        }

        return { assetId, price: p.price, currency: p.currency, source: 'yahoo' };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (snapshots.length === 0) {
      this.logger.warn('Aucun prix retenu après contrôle de devise.');
      return;
    }

    await this.prisma.priceSnapshot.createMany({ data: snapshots });

    this.logger.log(`${snapshots.length}/${assets.length} prix enregistrés.`);
  }
}
