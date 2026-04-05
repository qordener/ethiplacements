import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingDto } from './dto/update-holding.dto';

@Injectable()
export class HoldingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(portfolioId: string, dto: CreateHoldingDto) {
    try {
      return await this.prisma.holding.create({
        data: { portfolioId, ...dto },
        include: { asset: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException(`Cet actif est déjà dans le portefeuille`);
      throw e;
    }
  }

  findAllByPortfolio(portfolioId: string) {
    return this.prisma.holding.findMany({
      where: { portfolioId },
      include: { asset: { include: { esgScores: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.holding.findUnique({
      where: { id },
      include: {
        asset: { include: { esgScores: true } },
        transactions: { orderBy: { date: 'desc' } },
      },
    });
  }

  async update(id: string, dto: UpdateHoldingDto) {
    try {
      return await this.prisma.holding.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Holding ${id} introuvable`);
      throw e;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.holding.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Holding ${id} introuvable`);
      throw e;
    }
  }
}
