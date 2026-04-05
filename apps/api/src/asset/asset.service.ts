import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    try {
      return await this.prisma.asset.create({ data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException(`Un actif avec le ticker "${dto.ticker}" existe déjà`);
      throw e;
    }
  }

  findAll() {
    return this.prisma.asset.findMany();
  }

  findOne(id: string) {
    return this.prisma.asset.findUnique({
      where: { id },
      include: { esgScores: true },
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    try {
      return await this.prisma.asset.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Asset ${id} introuvable`);
      if (e?.code === 'P2002') throw new ConflictException(`Un actif avec ce ticker existe déjà`);
      throw e;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.asset.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Asset ${id} introuvable`);
      throw e;
    }
  }
}
