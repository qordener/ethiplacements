import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

const mockPortfolioService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('PortfolioController', () => {
  let controller: PortfolioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [{ provide: PortfolioService, useValue: mockPortfolioService }],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    vi.clearAllMocks();
  });

  // ─── POST /portfolios ─────────────────────────────────────────────────────

  describe('create', () => {
    it('should call service.create and return the created portfolio', async () => {
      const dto = { name: 'Mon ISR', description: 'Portfolio éthique' };
      const created = { id: 'cuid1', ...dto, createdAt: new Date(), updatedAt: new Date() };
      mockPortfolioService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(mockPortfolioService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  // ─── GET /portfolios ──────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all portfolios', async () => {
      const portfolios = [{ id: 'cuid1', name: 'P1' }, { id: 'cuid2', name: 'P2' }];
      mockPortfolioService.findAll.mockResolvedValue(portfolios);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
    });
  });

  // ─── GET /portfolios/:id ──────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the portfolio when found', async () => {
      const portfolio = { id: 'cuid1', name: 'Mon ISR', holdings: [] };
      mockPortfolioService.findOne.mockResolvedValue(portfolio);

      const result = await controller.findOne('cuid1');

      expect(result).toEqual(portfolio);
    });

    it('should throw NotFoundException when portfolio does not exist', async () => {
      mockPortfolioService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PATCH /portfolios/:id ────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the portfolio', async () => {
      const dto = { name: 'Nouveau nom' };
      const updated = { id: 'cuid1', name: 'Nouveau nom', description: null };
      mockPortfolioService.update.mockResolvedValue(updated);

      const result = await controller.update('cuid1', dto);

      expect(mockPortfolioService.update).toHaveBeenCalledWith('cuid1', dto);
      expect(result).toEqual(updated);
    });
  });

  // ─── DELETE /portfolios/:id ───────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return the deleted portfolio', async () => {
      const deleted = { id: 'cuid1', name: 'À supprimer' };
      mockPortfolioService.remove.mockResolvedValue(deleted);

      const result = await controller.remove('cuid1');

      expect(mockPortfolioService.remove).toHaveBeenCalledWith('cuid1');
      expect(result).toEqual(deleted);
    });
  });
});
