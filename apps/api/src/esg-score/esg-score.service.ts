import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEsgScoreDto } from './dto/create-esg-score.dto';
import { UpdateEsgScoreDto } from './dto/update-esg-score.dto';

@Injectable()
export class EsgScoreService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEsgScoreDto & { assetId: string }) {
    return this.prisma.esgScore.create({ data: dto });
  }

  findAllByAsset(assetId: string) {
    return this.prisma.esgScore.findMany({
      where: { assetId },
      orderBy: { date: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.esgScore.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateEsgScoreDto) {
    try {
      return await this.prisma.esgScore.update({ where: { id }, data: dto });
    } catch (e: unknown) {
      const code = (e as Prisma.PrismaClientKnownRequestError)?.code;
      if (code === 'P2025') throw new NotFoundException(`EsgScore ${id} introuvable`);
      throw e;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.esgScore.delete({ where: { id } });
    } catch (e: unknown) {
      const code = (e as Prisma.PrismaClientKnownRequestError)?.code;
      if (code === 'P2025') throw new NotFoundException(`EsgScore ${id} introuvable`);
      throw e;
    }
  }
}
