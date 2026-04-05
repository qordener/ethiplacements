import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EsgScoreService } from './esg-score.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaP2025Error extends Error {
  code = 'P2025';
  constructor() { super('Record not found'); }
}

const mockPrisma = {
  esgScore: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('EsgScoreService', () => {
  let service: EsgScoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EsgScoreService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EsgScoreService>(EsgScoreService);
    vi.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an ESG score with required fields', async () => {
      const dto = { assetId: 'asset1', score: 72, provider: 'MSCI' };
      const expected = { id: 'esg1', ...dto, date: new Date(), details: null };
      mockPrisma.esgScore.create.mockResolvedValue(expected);

      const result = await service.create(dto as any);

      expect(mockPrisma.esgScore.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(expected);
    });

    it('should create an ESG score with details JSON', async () => {
      const dto = {
        assetId: 'asset1',
        score: 65,
        provider: 'Sustainalytics',
        details: '{"E":70,"S":60,"G":65}',
      };
      const expected = { id: 'esg2', ...dto, date: new Date() };
      mockPrisma.esgScore.create.mockResolvedValue(expected);

      const result = await service.create(dto as any);

      expect(mockPrisma.esgScore.create).toHaveBeenCalledWith({ data: dto });
      expect(result.details).toBe(dto.details);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all ESG scores for a given asset', async () => {
      const scores = [
        { id: 'esg1', assetId: 'asset1', score: 72, provider: 'MSCI' },
        { id: 'esg2', assetId: 'asset1', score: 68, provider: 'Sustainalytics' },
      ];
      mockPrisma.esgScore.findMany.mockResolvedValue(scores);

      const result = await service.findAllByAsset('asset1');

      expect(mockPrisma.esgScore.findMany).toHaveBeenCalledWith({
        where: { assetId: 'asset1' },
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when asset has no ESG scores', async () => {
      mockPrisma.esgScore.findMany.mockResolvedValue([]);

      const result = await service.findAllByAsset('asset-no-scores');

      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an ESG score by id', async () => {
      const score = { id: 'esg1', assetId: 'asset1', score: 72, provider: 'MSCI', date: new Date(), details: null };
      mockPrisma.esgScore.findUnique.mockResolvedValue(score);

      const result = await service.findOne('esg1');

      expect(mockPrisma.esgScore.findUnique).toHaveBeenCalledWith({ where: { id: 'esg1' } });
      expect(result).toEqual(score);
    });

    it('should return null when ESG score does not exist', async () => {
      mockPrisma.esgScore.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the ESG score', async () => {
      const dto = { score: 80 };
      const updated = { id: 'esg1', assetId: 'asset1', score: 80, provider: 'MSCI' };
      mockPrisma.esgScore.update.mockResolvedValue(updated);

      const result = await service.update('esg1', dto as any);

      expect(mockPrisma.esgScore.update).toHaveBeenCalledWith({
        where: { id: 'esg1' },
        data: dto,
      });
      expect(result.score).toBe(80);
    });

    it('should throw NotFoundException when ESG score does not exist (P2025)', async () => {
      mockPrisma.esgScore.update.mockRejectedValue(new PrismaP2025Error());

      await expect(service.update('nonexistent', { score: 50 } as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the ESG score', async () => {
      const deleted = { id: 'esg1', assetId: 'asset1', score: 72, provider: 'MSCI' };
      mockPrisma.esgScore.delete.mockResolvedValue(deleted);

      const result = await service.remove('esg1');

      expect(mockPrisma.esgScore.delete).toHaveBeenCalledWith({ where: { id: 'esg1' } });
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException when ESG score does not exist (P2025)', async () => {
      mockPrisma.esgScore.delete.mockRejectedValue(new PrismaP2025Error());

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
