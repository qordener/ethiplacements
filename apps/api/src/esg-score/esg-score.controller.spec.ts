import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EsgScoreController } from './esg-score.controller';
import { EsgScoreService } from './esg-score.service';

const mockEsgScoreService = {
  create: vi.fn(),
  findAllByAsset: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('EsgScoreController', () => {
  let controller: EsgScoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EsgScoreController],
      providers: [{ provide: EsgScoreService, useValue: mockEsgScoreService }],
    }).compile();

    controller = module.get<EsgScoreController>(EsgScoreController);
    vi.clearAllMocks();
  });

  // ─── POST /assets/:assetId/esg-scores ─────────────────────────────────────

  describe('create', () => {
    it('should call service.create and return the created ESG score', async () => {
      const dto = { score: 72, provider: 'MSCI' };
      const created = { id: 'esg1', assetId: 'asset1', ...dto, date: new Date(), details: null };
      mockEsgScoreService.create.mockResolvedValue(created);

      const result = await controller.create('asset1', dto as any);

      expect(mockEsgScoreService.create).toHaveBeenCalledWith({ ...dto, assetId: 'asset1' });
      expect(result).toEqual(created);
    });
  });

  // ─── GET /assets/:assetId/esg-scores ──────────────────────────────────────

  describe('findAllByAsset', () => {
    it('should return all ESG scores for the given asset', async () => {
      const scores = [
        { id: 'esg1', score: 72, provider: 'MSCI' },
        { id: 'esg2', score: 68, provider: 'Sustainalytics' },
      ];
      mockEsgScoreService.findAllByAsset.mockResolvedValue(scores);

      const result = await controller.findAllByAsset('asset1');

      expect(mockEsgScoreService.findAllByAsset).toHaveBeenCalledWith('asset1');
      expect(result).toHaveLength(2);
    });
  });

  // ─── GET /esg-scores/:id ──────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the ESG score when found', async () => {
      const score = { id: 'esg1', score: 72, provider: 'MSCI' };
      mockEsgScoreService.findOne.mockResolvedValue(score);

      const result = await controller.findOne('esg1');

      expect(result).toEqual(score);
    });

    it('should throw NotFoundException when ESG score does not exist', async () => {
      mockEsgScoreService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PATCH /esg-scores/:id ────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the ESG score', async () => {
      const dto = { score: 80 };
      const updated = { id: 'esg1', score: 80, provider: 'MSCI' };
      mockEsgScoreService.update.mockResolvedValue(updated);

      const result = await controller.update('esg1', dto as any);

      expect(mockEsgScoreService.update).toHaveBeenCalledWith('esg1', dto);
      expect(result).toEqual(updated);
    });
  });

  // ─── DELETE /esg-scores/:id ───────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return the deleted ESG score', async () => {
      const deleted = { id: 'esg1', score: 72, provider: 'MSCI' };
      mockEsgScoreService.remove.mockResolvedValue(deleted);

      const result = await controller.remove('esg1');

      expect(mockEsgScoreService.remove).toHaveBeenCalledWith('esg1');
      expect(result).toEqual(deleted);
    });
  });
});
