import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { EsgLabelController } from './esg-label.controller';
import { EsgLabelService } from './esg-label.service';
import { SyncLabelsDto } from './dto/sync-labels.dto';

const mockEsgLabelService = {
  syncFromUrl: vi.fn(),
  findAllByAsset: vi.fn(),
};

describe('EsgLabelController', () => {
  let controller: EsgLabelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EsgLabelController],
      providers: [{ provide: EsgLabelService, useValue: mockEsgLabelService }],
    }).compile();

    controller = module.get<EsgLabelController>(EsgLabelController);
    vi.clearAllMocks();
  });

  describe('sync', () => {
    it('should call service.syncFromUrl with the provided URL', async () => {
      const dto: SyncLabelsDto = { url: 'https://example.com/referentiel.xlsx' };
      const stats = { totalRows: 10, matched: 3, skippedLabels: 2, unmatchedIsin: 5 };
      mockEsgLabelService.syncFromUrl.mockResolvedValue(stats);

      const result = await controller.sync(dto);

      expect(mockEsgLabelService.syncFromUrl).toHaveBeenCalledWith(dto.url);
      expect(result).toEqual(stats);
    });
  });

  describe('findAllByAsset', () => {
    it('should return all labels for the given asset', async () => {
      const labels = [{ id: 'l1', assetId: 'asset-1', label: 'ISR' }];
      mockEsgLabelService.findAllByAsset.mockResolvedValue(labels);

      const result = await controller.findAllByAsset('asset-1');

      expect(mockEsgLabelService.findAllByAsset).toHaveBeenCalledWith('asset-1');
      expect(result).toEqual(labels);
    });
  });
});
