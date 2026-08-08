import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { EsgLabelService } from './esg-label.service';
import { PrismaService } from '../prisma/prisma.service';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

interface FixtureRow {
  label: string;
  isin: string;
  date_arrete: Date;
  nom_du_fonds?: string;
}

async function buildWorkbookBuffer(rows: FixtureRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('referentiel');
  sheet.columns = [
    { header: 'label', key: 'label' },
    { header: 'societe_de_gestion', key: 'societe_de_gestion' },
    { header: 'nom_du_fonds', key: 'nom_du_fonds' },
    { header: 'isin', key: 'isin' },
    { header: 'code_AMF', key: 'code_AMF' },
    { header: 'lei', key: 'lei' },
    { header: 'date_arrete', key: 'date_arrete' },
  ];
  for (const row of rows) {
    sheet.addRow({ label: row.label, isin: row.isin, date_arrete: row.date_arrete, nom_du_fonds: row.nom_du_fonds ?? '' });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

const mockPrisma = {
  asset: { findMany: vi.fn() },
  assetLabel: { upsert: vi.fn(), findMany: vi.fn() },
};

describe('EsgLabelService', () => {
  let service: EsgLabelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EsgLabelService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<EsgLabelService>(EsgLabelService);
    vi.clearAllMocks();
  });

  afterEach(() => vi.restoreAllMocks());

  describe('syncFromUrl', () => {
    it('should match a row whose ISIN is known and has a relevant label', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'ISR', isin: 'FR0000000001', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([{ id: 'asset-1', isin: 'FR0000000001' }]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(mockPrisma.assetLabel.upsert).toHaveBeenCalledWith({
        where: { assetId_label: { assetId: 'asset-1', label: 'ISR' } },
        create: { assetId: 'asset-1', label: 'ISR', asOfDate: new Date('2026-06-30'), source: 'Banque de France' },
        update: expect.objectContaining({ asOfDate: new Date('2026-06-30') }),
      });
      expect(result).toEqual({ totalRows: 1, matched: 1, skippedLabels: 0, unmatchedIsin: 0 });
    });

    it('should skip rows with a label outside ISR/GREENFIN/FINANSOL (e.g. CIES, RELANCE)', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'CIES', isin: 'FR0000000002', date_arrete: new Date('2026-06-30') },
        { label: 'RELANCE', isin: 'FR0000000003', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(result).toEqual({ totalRows: 2, matched: 0, skippedLabels: 2, unmatchedIsin: 0 });
      expect(mockPrisma.assetLabel.upsert).not.toHaveBeenCalled();
    });

    it('should count rows with a relevant label but no matching asset in the database', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'GREENFIN', isin: 'FR9999999999', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([{ id: 'asset-1', isin: 'FR0000000001' }]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(result).toEqual({ totalRows: 1, matched: 0, skippedLabels: 0, unmatchedIsin: 1 });
    });

    it('should recognize the relevant labels case-insensitively', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'isr', isin: 'FR0000000001', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([{ id: 'asset-1', isin: 'FR0000000001' }]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(result.matched).toBe(1);
    });

    it('should throw BadRequestException when a required column is missing', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('referentiel');
      sheet.addRow(['label', 'nom_du_fonds']); // pas de colonne isin ni date_arrete
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });

      await expect(service.syncFromUrl('https://example.com/referentiel.xlsx')).rejects.toThrow(BadRequestException);
    });

    it('should process multiple matching rows and sum the counters', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'ISR', isin: 'FR0000000001', date_arrete: new Date('2026-06-30') },
        { label: 'GREENFIN', isin: 'FR0000000002', date_arrete: new Date('2026-06-30') },
        { label: 'FINANSOL', isin: 'FR0000000003', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'asset-1', isin: 'FR0000000001' },
        { id: 'asset-2', isin: 'FR0000000002' },
        { id: 'asset-3', isin: 'FR0000000003' },
      ]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(result).toEqual({ totalRows: 3, matched: 3, skippedLabels: 0, unmatchedIsin: 0 });
      expect(mockPrisma.assetLabel.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('syncFromUrl — ISIN multiples', () => {
    it('should match a row listing several ISIN (multi-class fund) separated by ";"', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'FINANSOL', isin: 'FR0000000001;FR0000000002', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([{ id: 'asset-2', isin: 'FR0000000002' }]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(result.matched).toBe(1);
      expect(mockPrisma.assetLabel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { assetId_label: { assetId: 'asset-2', label: 'FINANSOL' } } })
      );
    });

    it('should match a row listing several ISIN separated by ", "', async () => {
      const buffer = await buildWorkbookBuffer([
        { label: 'ISR', isin: 'FR0000000003, FR0000000004', date_arrete: new Date('2026-06-30') },
      ]);
      mockedAxios.get = vi.fn().mockResolvedValue({ data: buffer });
      mockPrisma.asset.findMany.mockResolvedValue([{ id: 'asset-4', isin: 'FR0000000004' }]);

      const result = await service.syncFromUrl('https://example.com/referentiel.xlsx');

      expect(result.matched).toBe(1);
    });
  });

  describe('findAllByAsset', () => {
    it('should return all labels for the given asset', async () => {
      const labels = [{ id: 'l1', assetId: 'asset-1', label: 'ISR' }];
      mockPrisma.assetLabel.findMany.mockResolvedValue(labels);

      const result = await service.findAllByAsset('asset-1');

      expect(mockPrisma.assetLabel.findMany).toHaveBeenCalledWith({ where: { assetId: 'asset-1' } });
      expect(result).toEqual(labels);
    });
  });
});
