import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

export const PEA_CEILING = 150_000;

export interface PeaCeiling {
  totalDeposited: number;
  ceiling: number;
  remaining: number;
  percentage: number;
}

@Injectable()
export class DepositService {
  constructor(private readonly prisma: PrismaService) {}

  create(portfolioId: string, dto: CreateDepositDto) {
    return this.prisma.deposit.create({
      data: { portfolioId, ...dto, date: new Date(dto.date) },
    });
  }

  findAllByPortfolio(portfolioId: string) {
    return this.prisma.deposit.findMany({
      where: { portfolioId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.deposit.delete({ where: { id } });
    } catch (e: unknown) {
      const code = (e as Prisma.PrismaClientKnownRequestError)?.code;
      if (code === 'P2025') throw new NotFoundException(`Versement ${id} introuvable`);
      throw e;
    }
  }

  async getCeiling(portfolioId: string): Promise<PeaCeiling> {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException(`Portfolio ${portfolioId} introuvable`);

    const deposits = await this.prisma.deposit.findMany({ where: { portfolioId } });
    const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
    const remaining = Math.max(0, PEA_CEILING - totalDeposited);
    const percentage = (totalDeposited / PEA_CEILING) * 100;

    return { totalDeposited, ceiling: PEA_CEILING, remaining, percentage };
  }
}
