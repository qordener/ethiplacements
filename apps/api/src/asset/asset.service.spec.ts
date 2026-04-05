import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AssetService } from './asset.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaP2025Error extends Error {
  code = 'P2025';
  constructor() { super('Record not found'); }
}

class PrismaP2002Error extends Error {
  code = 'P2002';
  constructor() { super('Unique constraint failed'); }
}

const mockPrisma = {
  asset: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('AssetService', () => {
  let service: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    vi.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an asset with all fields', async () => {
      const dto = { name: 'Amundi MSCI World SRI', ticker: 'CW8', isin: 'LU1861134382', type: 'ETF', sector: 'Global' };
      const expected = { id: 'cuid1', ...dto, holdings: [], esgScores: [] };
      mockPrisma.asset.create.mockResolvedValue(expected);

      const result = await service.create(dto as any);

      expect(mockPrisma.asset.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(expected);
    });

    it('should create an asset with only required fields (name, ticker, type)', async () => {
      const dto = { name: 'Bitcoin', ticker: 'BTC', type: 'CRYPTO' };
      const expected = { id: 'cuid2', ...dto, isin: null, sector: null };
      mockPrisma.asset.create.mockResolvedValue(expected);

      await service.create(dto as any);

      expect(mockPrisma.asset.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw ConflictException when ticker already exists (P2002)', async () => {
      mockPrisma.asset.create.mockRejectedValue(new PrismaP2002Error());

      await expect(service.create({ name: 'Duplicate', ticker: 'CW8', type: 'ETF' } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all assets', async () => {
      const assets = [
        { id: 'cuid1', name: 'CW8', ticker: 'CW8', type: 'ETF' },
        { id: 'cuid2', name: 'BTC', ticker: 'BTC', type: 'CRYPTO' },
      ];
      mockPrisma.asset.findMany.mockResolvedValue(assets);

      const result = await service.findAll();

      expect(mockPrisma.asset.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no assets exist', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an asset with its esgScores included', async () => {
      const asset = {
        id: 'cuid1',
        name: 'Amundi MSCI World SRI',
        ticker: 'CW8',
        type: 'ETF',
        esgScores: [{ id: 'esg1', score: 72, provider: 'MSCI' }],
      };
      mockPrisma.asset.findUnique.mockResolvedValue(asset);

      const result = await service.findOne('cuid1');

      expect(mockPrisma.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'cuid1' },
        include: { esgScores: true },
      });
      expect(result).toEqual(asset);
    });

    it('should return null when asset does not exist', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the asset', async () => {
      const dto = { sector: 'Technology' };
      const updated = { id: 'cuid1', name: 'CW8', ticker: 'CW8', type: 'ETF', sector: 'Technology' };
      mockPrisma.asset.update.mockResolvedValue(updated);

      const result = await service.update('cuid1', dto as any);

      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'cuid1' },
        data: dto,
      });
      expect(result.sector).toBe('Technology');
    });

    it('should throw NotFoundException when asset does not exist (P2025)', async () => {
      mockPrisma.asset.update.mockRejectedValue(new PrismaP2025Error());

      await expect(service.update('nonexistent', { sector: 'X' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to a duplicate ticker (P2002)', async () => {
      mockPrisma.asset.update.mockRejectedValue(new PrismaP2002Error());

      await expect(service.update('cuid1', { ticker: 'BTC' } as any)).rejects.toThrow(ConflictException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the asset', async () => {
      const deleted = { id: 'cuid1', name: 'CW8', ticker: 'CW8', type: 'ETF' };
      mockPrisma.asset.delete.mockResolvedValue(deleted);

      const result = await service.remove('cuid1');

      expect(mockPrisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'cuid1' } });
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException when asset does not exist (P2025)', async () => {
      mockPrisma.asset.delete.mockRejectedValue(new PrismaP2025Error());

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
