import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaP2025Error extends Error {
  code = 'P2025';
  constructor() { super('Record not found'); }
}

const mockPrisma = {
  portfolio: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    vi.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a portfolio with name and description', async () => {
      const dto = { name: 'Mon portefeuille ISR', description: 'Placements éthiques' };
      const expected = { id: 'cuid1', ...dto, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.portfolio.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(expected);
    });

    it('should create a portfolio with name only (description optional)', async () => {
      const dto = { name: 'Portefeuille minimaliste' };
      const expected = { id: 'cuid2', name: dto.name, description: null, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.portfolio.create.mockResolvedValue(expected);

      await service.create(dto);

      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all portfolios', async () => {
      const portfolios = [
        { id: 'cuid1', name: 'P1', description: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 'cuid2', name: 'P2', description: 'Desc', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockPrisma.portfolio.findMany.mockResolvedValue(portfolios);

      const result = await service.findAll();

      expect(mockPrisma.portfolio.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no portfolios exist', async () => {
      mockPrisma.portfolio.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a portfolio with its holdings included', async () => {
      const portfolio = {
        id: 'cuid1',
        name: 'Mon ISR',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        holdings: [],
      };
      mockPrisma.portfolio.findUnique.mockResolvedValue(portfolio);

      const result = await service.findOne('cuid1');

      expect(mockPrisma.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: 'cuid1' },
        include: { holdings: { include: { asset: { include: { esgScores: true } } } } },
      });
      expect(result).toEqual(portfolio);
    });

    it('should return null when portfolio does not exist', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the portfolio', async () => {
      const dto = { name: 'Nouveau nom' };
      const updated = { id: 'cuid1', name: 'Nouveau nom', description: null, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.portfolio.update.mockResolvedValue(updated);

      const result = await service.update('cuid1', dto);

      expect(mockPrisma.portfolio.update).toHaveBeenCalledWith({
        where: { id: 'cuid1' },
        data: dto,
      });
      expect(result.name).toBe('Nouveau nom');
    });

    it('should throw NotFoundException when portfolio does not exist (P2025)', async () => {
      mockPrisma.portfolio.update.mockRejectedValue(new PrismaP2025Error());

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the portfolio (cascade on holdings via Prisma schema)', async () => {
      const deleted = { id: 'cuid1', name: 'À supprimer', description: null, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.portfolio.delete.mockResolvedValue(deleted);

      const result = await service.remove('cuid1');

      expect(mockPrisma.portfolio.delete).toHaveBeenCalledWith({ where: { id: 'cuid1' } });
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException when portfolio does not exist (P2025)', async () => {
      mockPrisma.portfolio.delete.mockRejectedValue(new PrismaP2025Error());

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
