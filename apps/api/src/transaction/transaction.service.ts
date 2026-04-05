import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(holdingId: string, dto: CreateTransactionDto) {
    const holding = await this.prisma.holding.findUnique({ where: { id: holdingId } });
    if (!holding) throw new NotFoundException(`Holding ${holdingId} introuvable`);

    if (dto.type === 'BUY') {
      // Recalcul CUMP : (ancienne_qty * ancien_pru + nouvelle_qty * prix) / (ancienne_qty + nouvelle_qty)
      const totalQty = holding.quantity + dto.quantity;
      const newAveragePrice = totalQty > 0
        ? (holding.quantity * holding.averagePrice + dto.quantity * dto.price) / totalQty
        : dto.price;

      const transaction = await this.prisma.transaction.create({
        data: { holdingId, ...dto, date: new Date(dto.date) },
      });

      await this.prisma.holding.update({
        where: { id: holdingId },
        data: { quantity: totalQty, averagePrice: newAveragePrice },
      });

      return transaction;
    }

    if (dto.type === 'SELL') {
      if (dto.quantity > holding.quantity) {
        throw new UnprocessableEntityException(
          `Quantité vendue (${dto.quantity}) supérieure à la position détenue (${holding.quantity})`
        );
      }

      const transaction = await this.prisma.transaction.create({
        data: { holdingId, ...dto, date: new Date(dto.date) },
      });

      // PRU invariant après SELL, seule la quantité diminue
      await this.prisma.holding.update({
        where: { id: holdingId },
        data: { quantity: holding.quantity - dto.quantity, averagePrice: holding.averagePrice },
      });

      return transaction;
    }

    // DIVIDEND : crée la transaction sans modifier le holding
    return this.prisma.transaction.create({
      data: { holdingId, ...dto, date: new Date(dto.date) },
    });
  }

  findAllByHolding(holdingId: string) {
    return this.prisma.transaction.findMany({
      where: { holdingId },
      orderBy: { date: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    try {
      return await this.prisma.transaction.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException(`Transaction ${id} introuvable`);
      throw e;
    }
  }

  async remove(id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException(`Transaction ${id} introuvable`);

    await this.prisma.transaction.delete({ where: { id } });

    // Recalcul complet du holding depuis les transactions restantes (ordre chronologique)
    const remaining = await this.prisma.transaction.findMany({
      where: { holdingId: transaction.holdingId },
      orderBy: { date: 'asc' },
    });

    const { quantity, averagePrice } = this._recalculateHolding(remaining);

    await this.prisma.holding.update({
      where: { id: transaction.holdingId },
      data: { quantity, averagePrice },
    });
  }

  /**
   * Rejoue toutes les transactions BUY/SELL dans l'ordre chronologique
   * pour recalculer la quantité et le PRU (CUMP) du holding.
   * Les DIVIDEND n'affectent ni la quantité ni le PRU.
   */
  private _recalculateHolding(transactions: Array<{ type: string; quantity: number; price: number }>) {
    let quantity = 0;
    let averagePrice = 0;

    for (const tx of transactions) {
      if (tx.type === 'BUY') {
        const totalQty = quantity + tx.quantity;
        averagePrice = totalQty > 0
          ? (quantity * averagePrice + tx.quantity * tx.price) / totalQty
          : tx.price;
        quantity = totalQty;
      } else if (tx.type === 'SELL') {
        quantity = Math.max(0, quantity - tx.quantity);
        // PRU invariant après SELL
      }
      // DIVIDEND : ignoré dans le calcul
    }

    return { quantity, averagePrice };
  }
}
