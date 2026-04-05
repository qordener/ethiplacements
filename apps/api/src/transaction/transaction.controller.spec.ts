import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

const mockTransactionService = {
  create: vi.fn(),
  findAllByHolding: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: TransactionService, useValue: mockTransactionService }],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    vi.clearAllMocks();
  });

  // ─── POST /holdings/:holdingId/transactions ────────────────────────────────

  describe('create', () => {
    it('should call service.create with holdingId and dto', async () => {
      const dto = { type: 'BUY', quantity: 10, price: 100, date: new Date() };
      const created = { id: 'tx1', holdingId: 'h1', ...dto };
      mockTransactionService.create.mockResolvedValue(created);

      const result = await controller.create('h1', dto as any);

      expect(mockTransactionService.create).toHaveBeenCalledWith('h1', dto);
      expect(result).toEqual(created);
    });
  });

  // ─── GET /holdings/:holdingId/transactions ─────────────────────────────────

  describe('findAllByHolding', () => {
    it('should return all transactions for the given holding', async () => {
      const transactions = [
        { id: 'tx2', type: 'SELL', date: new Date('2024-03-01') },
        { id: 'tx1', type: 'BUY', date: new Date('2024-01-15') },
      ];
      mockTransactionService.findAllByHolding.mockResolvedValue(transactions);

      const result = await controller.findAllByHolding('h1');

      expect(mockTransactionService.findAllByHolding).toHaveBeenCalledWith('h1');
      expect(result).toHaveLength(2);
    });
  });

  // ─── GET /transactions/:id ─────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the transaction when found', async () => {
      const tx = { id: 'tx1', type: 'BUY', quantity: 10, price: 100 };
      mockTransactionService.findOne.mockResolvedValue(tx);

      const result = await controller.findOne('tx1');

      expect(result).toEqual(tx);
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      mockTransactionService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PATCH /transactions/:id ───────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the transaction', async () => {
      const dto = { notes: 'Correction' };
      const updated = { id: 'tx1', type: 'BUY', notes: 'Correction' };
      mockTransactionService.update.mockResolvedValue(updated);

      const result = await controller.update('tx1', dto as any);

      expect(mockTransactionService.update).toHaveBeenCalledWith('tx1', dto);
      expect(result).toEqual(updated);
    });
  });

  // ─── DELETE /transactions/:id ──────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the transaction and return 204', async () => {
      mockTransactionService.remove.mockResolvedValue(undefined);

      await controller.remove('tx1');

      expect(mockTransactionService.remove).toHaveBeenCalledWith('tx1');
    });
  });
});
