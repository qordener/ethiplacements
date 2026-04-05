import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaP2025Error extends Error {
  code = 'P2025';
  constructor() { super('Record not found'); }
}

const mockPrisma = {
  transaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  holding: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    vi.clearAllMocks();
  });

  // ─── create BUY — recalcul CUMP ──────────────────────────────────────────

  describe('create BUY', () => {
    it('should create a BUY transaction and recalculate averagePrice (CUMP)', async () => {
      // Arrange : holding existant — 10 parts à 100 €
      const holding = { id: 'h1', quantity: 10, averagePrice: 100 };
      mockPrisma.holding.findUnique.mockResolvedValue(holding);

      const dto = { type: 'BUY', quantity: 5, price: 120, date: new Date('2024-01-15') };
      const created = { id: 'tx1', holdingId: 'h1', ...dto };
      mockPrisma.transaction.create.mockResolvedValue(created);
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 15, averagePrice: 106.67 });

      // Act
      const result = await service.create('h1', dto as any);

      // Assert — CUMP = (10 * 100 + 5 * 120) / (10 + 5) = 1600/15 ≈ 106.67
      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: {
          quantity: 15,
          averagePrice: expect.closeTo(106.67, 1),
        },
      });
      expect(result).toEqual(created);
    });

    it('should create a BUY on an empty holding (quantity = 0) and set PRU to purchase price', async () => {
      // Arrange : holding clôturé — position soldée
      const holding = { id: 'h1', quantity: 0, averagePrice: 0 };
      mockPrisma.holding.findUnique.mockResolvedValue(holding);

      const dto = { type: 'BUY', quantity: 10, price: 90, date: new Date('2024-02-01') };
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx2', holdingId: 'h1', ...dto });
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 10, averagePrice: 90 });

      await service.create('h1', dto as any);

      // CUMP = (0 * 0 + 10 * 90) / (0 + 10) = 90
      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: { quantity: 10, averagePrice: 90 },
      });
    });

    it('should throw NotFoundException when holding does not exist', async () => {
      mockPrisma.holding.findUnique.mockResolvedValue(null);

      await expect(service.create('nonexistent', { type: 'BUY', quantity: 5, price: 100, date: new Date() } as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── create SELL — quantité et PRU ───────────────────────────────────────

  describe('create SELL', () => {
    it('should create a SELL transaction and decrement quantity without changing PRU', async () => {
      // Arrange : holding — 20 parts à 110 €
      const holding = { id: 'h1', quantity: 20, averagePrice: 110 };
      mockPrisma.holding.findUnique.mockResolvedValue(holding);

      const dto = { type: 'SELL', quantity: 8, price: 130, date: new Date('2024-03-01') };
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx3', holdingId: 'h1', ...dto });
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 12, averagePrice: 110 });

      await service.create('h1', dto as any);

      // PRU inchangé, quantité décrémentée
      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: {
          quantity: 12,
          averagePrice: 110, // PRU invariant après SELL
        },
      });
    });

    it('should allow selling all shares (quantity reaches 0) and keep the holding', async () => {
      const holding = { id: 'h1', quantity: 10, averagePrice: 100 };
      mockPrisma.holding.findUnique.mockResolvedValue(holding);

      const dto = { type: 'SELL', quantity: 10, price: 150, date: new Date() };
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx4', holdingId: 'h1', ...dto });
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 0, averagePrice: 100 });

      await service.create('h1', dto as any);

      // Holding conservé à quantity = 0 (historique intact)
      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: { quantity: 0, averagePrice: 100 },
      });
      // Holding NON supprimé
      expect(mockPrisma.holding.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw UnprocessableEntityException when selling more than available quantity', async () => {
      const holding = { id: 'h1', quantity: 5, averagePrice: 100 };
      mockPrisma.holding.findUnique.mockResolvedValue(holding);

      const dto = { type: 'SELL', quantity: 10, price: 120, date: new Date() };

      await expect(service.create('h1', dto as any))
        .rejects.toThrow(UnprocessableEntityException);

      // Ni transaction créée, ni holding modifié
      expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
      expect(mockPrisma.holding.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when holding does not exist', async () => {
      mockPrisma.holding.findUnique.mockResolvedValue(null);

      await expect(service.create('nonexistent', { type: 'SELL', quantity: 5, price: 100, date: new Date() } as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAllByHolding ─────────────────────────────────────────────────────

  describe('findAllByHolding', () => {
    it('should return all transactions for a holding ordered by date DESC', async () => {
      const transactions = [
        { id: 'tx2', type: 'SELL', date: new Date('2024-03-01') },
        { id: 'tx1', type: 'BUY', date: new Date('2024-01-15') },
      ];
      mockPrisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.findAllByHolding('h1');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { holdingId: 'h1' },
        orderBy: { date: 'desc' },
      });
      expect(result[0].type).toBe('SELL'); // plus récente en premier
    });

    it('should return empty array when holding has no transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAllByHolding('h-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const tx = { id: 'tx1', holdingId: 'h1', type: 'BUY', quantity: 10, price: 100, date: new Date() };
      mockPrisma.transaction.findUnique.mockResolvedValue(tx);

      const result = await service.findOne('tx1');

      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({ where: { id: 'tx1' } });
      expect(result).toEqual(tx);
    });

    it('should return null when transaction does not exist', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update transaction notes without recalculating the holding', async () => {
      const dto = { notes: 'Correction saisie' };
      const updated = { id: 'tx1', holdingId: 'h1', type: 'BUY', quantity: 10, price: 100, notes: 'Correction saisie' };
      mockPrisma.transaction.update.mockResolvedValue(updated);

      const result = await service.update('tx1', dto as any);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: dto,
      });
      expect(result.notes).toBe('Correction saisie');
    });

    it('should throw NotFoundException when transaction does not exist (P2025)', async () => {
      mockPrisma.transaction.update.mockRejectedValue(new PrismaP2025Error());

      await expect(service.update('nonexistent', { notes: 'X' } as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove — recalcul holding ────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a transaction and recalculate holding quantity and PRU from remaining transactions', async () => {
      // Arrange : on supprime tx1 (BUY 10 @ 100)
      // Il reste tx2 (BUY 5 @ 120) → nouvelle quantité = 5, nouveau PRU = 120
      const txToDelete = { id: 'tx1', holdingId: 'h1', type: 'BUY', quantity: 10, price: 100 };
      const remainingTransactions = [
        { id: 'tx2', holdingId: 'h1', type: 'BUY', quantity: 5, price: 120, date: new Date('2024-02-01') },
      ];

      mockPrisma.transaction.findUnique.mockResolvedValue(txToDelete);
      mockPrisma.transaction.delete.mockResolvedValue(txToDelete);
      mockPrisma.transaction.findMany.mockResolvedValue(remainingTransactions);
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 5, averagePrice: 120 });

      await service.remove('tx1');

      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: 'tx1' } });
      // Recalcul depuis les transactions restantes
      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: { quantity: 5, averagePrice: 120 },
      });
    });

    it('should reset holding to quantity=0 and averagePrice=0 when all transactions are deleted', async () => {
      const txToDelete = { id: 'tx1', holdingId: 'h1', type: 'BUY', quantity: 10, price: 100 };

      mockPrisma.transaction.findUnique.mockResolvedValue(txToDelete);
      mockPrisma.transaction.delete.mockResolvedValue(txToDelete);
      mockPrisma.transaction.findMany.mockResolvedValue([]); // plus aucune transaction
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 0, averagePrice: 0 });

      await service.remove('tx1');

      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: { quantity: 0, averagePrice: 0 },
      });
    });

    it('should correctly recalculate PRU after deleting one of several BUY transactions', async () => {
      // Suppression de tx2 (BUY 5 @ 120)
      // Restent : tx1 (BUY 10 @ 100) et tx3 (SELL 3 @ 150)
      // Résultat : quantité = 10 - 3 = 7, PRU = 100 (inchangé par SELL)
      const txToDelete = { id: 'tx2', holdingId: 'h1', type: 'BUY', quantity: 5, price: 120 };
      const remainingTransactions = [
        { id: 'tx1', holdingId: 'h1', type: 'BUY', quantity: 10, price: 100, date: new Date('2024-01-01') },
        { id: 'tx3', holdingId: 'h1', type: 'SELL', quantity: 3, price: 150, date: new Date('2024-03-01') },
      ];

      mockPrisma.transaction.findUnique.mockResolvedValue(txToDelete);
      mockPrisma.transaction.delete.mockResolvedValue(txToDelete);
      mockPrisma.transaction.findMany.mockResolvedValue(remainingTransactions);
      mockPrisma.holding.update.mockResolvedValue({ id: 'h1', quantity: 7, averagePrice: 100 });

      await service.remove('tx2');

      expect(mockPrisma.holding.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: { quantity: 7, averagePrice: 100 },
      });
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
