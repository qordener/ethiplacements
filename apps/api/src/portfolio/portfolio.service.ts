import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

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
      include: { holdings: { include: { asset: true } } },
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
}
