import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

const mockAssetService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('AssetController', () => {
  let controller: AssetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [{ provide: AssetService, useValue: mockAssetService }],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    vi.clearAllMocks();
  });

  // ─── POST /assets ─────────────────────────────────────────────────────────

  describe('create', () => {
    it('should call service.create and return the created asset', async () => {
      const dto = { name: 'Amundi MSCI World SRI', ticker: 'CW8', type: 'ETF' };
      const created = { id: 'cuid1', ...dto, isin: null, sector: null };
      mockAssetService.create.mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(mockAssetService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  // ─── GET /assets ──────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all assets', async () => {
      const assets = [{ id: 'cuid1', ticker: 'CW8' }, { id: 'cuid2', ticker: 'BTC' }];
      mockAssetService.findAll.mockResolvedValue(assets);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
    });
  });

  // ─── GET /assets/:id ──────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the asset when found', async () => {
      const asset = { id: 'cuid1', ticker: 'CW8', esgScores: [] };
      mockAssetService.findOne.mockResolvedValue(asset);

      const result = await controller.findOne('cuid1');

      expect(result).toEqual(asset);
    });

    it('should throw NotFoundException when asset does not exist', async () => {
      mockAssetService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PATCH /assets/:id ────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the asset', async () => {
      const dto = { sector: 'Technology' };
      const updated = { id: 'cuid1', ticker: 'CW8', sector: 'Technology' };
      mockAssetService.update.mockResolvedValue(updated);

      const result = await controller.update('cuid1', dto as any);

      expect(mockAssetService.update).toHaveBeenCalledWith('cuid1', dto);
      expect(result).toEqual(updated);
    });
  });

  // ─── DELETE /assets/:id ───────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return the deleted asset', async () => {
      const deleted = { id: 'cuid1', ticker: 'CW8' };
      mockAssetService.remove.mockResolvedValue(deleted);

      const result = await controller.remove('cuid1');

      expect(mockAssetService.remove).toHaveBeenCalledWith('cuid1');
      expect(result).toEqual(deleted);
    });
  });
});
