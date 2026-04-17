import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

export type HistoryRange = '1m' | '3m' | '1y';

export interface HistoryPoint {
  date: string;   // ISO date YYYY-MM-DD
  value: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  latentGain: number;
  latentGainPct: number;
  esgScoreWeighted: number | null;
  allocationByType: Record<string, number>;
}

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePortfolioDto) {
    return this.prisma.portfolio.create({ data: dto });
  }

  findAll() {
    return this.prisma.portfolio.findMany();
  }

  findOne(id: string) {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: { holdings: { include: { asset: { include: { esgScores: true } } } } },
    });
  }

  async update(id: string, dto: UpdatePortfolioDto) {
    try {
      return await this.prisma.portfolio.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Portfolio ${id} introuvable`);
      throw e;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.portfolio.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Portfolio ${id} introuvable`);
      throw e;
    }
  }

  async getSummary(id: string): Promise<PortfolioSummary> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: {
        holdings: {
          include: {
            asset: {
              include: {
                esgScores: true,
                priceSnapshots: {
                  orderBy: { fetchedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!portfolio) throw new NotFoundException(`Portfolio ${id} introuvable`);

    // Exclure les positions clôturées (quantity = 0) des calculs
    const activeHoldings = portfolio.holdings.filter((h) => h.quantity > 0);

    if (activeHoldings.length === 0) {
      return { totalInvested: 0, currentValue: 0, latentGain: 0, latentGainPct: 0, esgScoreWeighted: null, allocationByType: {} };
    }

    let totalInvested = 0;
    let currentValue = 0;
    const allocationRaw: Record<string, number> = {};
    let weightedEsgNumerator = 0;
    let weightedEsgDenominator = 0;

    for (const holding of activeHoldings) {
      const invested = holding.quantity * holding.averagePrice;
      // Priorité : dernier snapshot fetché > prix manuel > prix d'achat moyen
      const latestSnapshot = holding.asset.priceSnapshots[0];
      const price = latestSnapshot?.price ?? holding.asset.manualPrice ?? holding.averagePrice;
      const value = holding.quantity * price;

      totalInvested += invested;
      currentValue += value;

      const assetType = holding.asset.type;
      allocationRaw[assetType] = (allocationRaw[assetType] ?? 0) + invested;

      // Score ESG le plus récent de l'actif
      if (holding.asset.esgScores.length > 0) {
        const latestScore = holding.asset.esgScores.reduce((a, b) =>
          new Date(a.date) >= new Date(b.date) ? a : b
        );
        weightedEsgNumerator += latestScore.score * invested;
        weightedEsgDenominator += invested;
      }
    }

    const latentGain = currentValue - totalInvested;
    const latentGainPct = totalInvested > 0 ? (latentGain / totalInvested) * 100 : 0;

    const allocationByType: Record<string, number> = {};
    for (const [type, amount] of Object.entries(allocationRaw)) {
      allocationByType[type] = (amount / totalInvested) * 100;
    }

    const esgScoreWeighted = weightedEsgDenominator > 0
      ? weightedEsgNumerator / weightedEsgDenominator
      : null;

    return { totalInvested, currentValue, latentGain, latentGainPct, esgScoreWeighted, allocationByType };
  }

  async getHistory(id: string, range: HistoryRange = '1m'): Promise<HistoryPoint[]> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: { holdings: { select: { quantity: true, averagePrice: true, assetId: true } } },
    });

    if (!portfolio) throw new NotFoundException(`Portfolio ${id} introuvable`);

    const activeHoldings = portfolio.holdings.filter((h) => h.quantity > 0);
    if (activeHoldings.length === 0) return [];

    const days = range === '1y' ? 365 : range === '3m' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const assetIds = activeHoldings.map((h) => h.assetId);

    const snapshots = await this.prisma.priceSnapshot.findMany({
      where: { assetId: { in: assetIds }, fetchedAt: { gte: since } },
      orderBy: { fetchedAt: 'asc' },
      select: { assetId: true, price: true, fetchedAt: true },
    });

    if (snapshots.length === 0) return [];

    // ─── Grouper par jour → dernier snapshot de la journée par actif ─────────
    // priceByDateAsset[YYYY-MM-DD][assetId] = last known price that day
    const priceByDateAsset: Record<string, Record<string, number>> = {};
    for (const snap of snapshots) {
      const day = snap.fetchedAt.toISOString().slice(0, 10);
      if (!priceByDateAsset[day]) priceByDateAsset[day] = {};
      priceByDateAsset[day][snap.assetId] = snap.price; // dernier = le plus récent (trié asc)
    }

    // ─── Carry-forward : pour chaque actif, propager le dernier prix connu ───
    const sortedDays = Object.keys(priceByDateAsset).sort();
    const lastKnownPrice: Record<string, number> = {};

    // Initialiser avec prix d'achat moyen comme fallback
    for (const h of activeHoldings) {
      lastKnownPrice[h.assetId] = h.averagePrice;
    }

    const points: HistoryPoint[] = [];

    for (const day of sortedDays) {
      // Mettre à jour les prix connus ce jour
      for (const [assetId, price] of Object.entries(priceByDateAsset[day])) {
        lastKnownPrice[assetId] = price;
      }

      // Valeur du portefeuille ce jour avec les derniers prix connus
      const value = activeHoldings.reduce((sum, h) => {
        const price = lastKnownPrice[h.assetId] ?? h.averagePrice;
        return sum + h.quantity * price;
      }, 0);

      points.push({ date: day, value: Math.round(value * 100) / 100 });
    }

    return points;
  }
}
