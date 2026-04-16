import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

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
}
