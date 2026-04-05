import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  portfolio: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('PortfolioService.getSummary', () => {
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

  it('should throw NotFoundException when portfolio does not exist', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue(null);

    await expect(service.getSummary('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should return zeros for an empty portfolio (no holdings)', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Vide',
      holdings: [],
    });

    const summary = await service.getSummary('p1');

    expect(summary.totalInvested).toBe(0);
    expect(summary.currentValue).toBe(0);
    expect(summary.latentGain).toBe(0);
    expect(summary.latentGainPct).toBe(0);
    expect(summary.esgScoreWeighted).toBeNull();
    expect(summary.allocationByType).toEqual({});
  });

  it('should calculate totalInvested as sum of (quantity × averagePrice)', async () => {
    // 10 parts CW8 @ PRU 100 + 5 parts BTC @ PRU 30000 = 1000 + 150000 = 151000
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      holdings: [
        {
          id: 'h1', quantity: 10, averagePrice: 100,
          asset: { type: 'ETF', manualPrice: null, esgScores: [] },
        },
        {
          id: 'h2', quantity: 5, averagePrice: 30000,
          asset: { type: 'CRYPTO', manualPrice: null, esgScores: [] },
        },
      ],
    });

    const summary = await service.getSummary('p1');

    expect(summary.totalInvested).toBe(151000);
  });

  it('should use manualPrice for currentValue when available, fallback to averagePrice', async () => {
    // h1 : manualPrice = 110 → currentValue = 10 * 110 = 1100
    // h2 : pas de manualPrice → fallback sur averagePrice 200 → 5 * 200 = 1000
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      holdings: [
        {
          id: 'h1', quantity: 10, averagePrice: 100,
          asset: { type: 'ETF', manualPrice: 110, esgScores: [] },
        },
        {
          id: 'h2', quantity: 5, averagePrice: 200,
          asset: { type: 'STOCK', manualPrice: null, esgScores: [] },
        },
      ],
    });

    const summary = await service.getSummary('p1');

    expect(summary.totalInvested).toBe(2000); // 10*100 + 5*200
    expect(summary.currentValue).toBe(2100);  // 10*110 + 5*200
    expect(summary.latentGain).toBe(100);
    expect(summary.latentGainPct).toBeCloseTo(5, 1); // 100/2000 * 100 = 5%
  });

  it('should calculate weighted ESG score based on investment weight', async () => {
    // h1 : 1000 € investi, score ESG 80 → poids 50%
    // h2 : 1000 € investi, score ESG 60 → poids 50%
    // Résultat attendu : (80 * 1000 + 60 * 1000) / 2000 = 70
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      holdings: [
        {
          id: 'h1', quantity: 10, averagePrice: 100,
          asset: {
            type: 'ETF', manualPrice: null,
            esgScores: [
              { score: 80, date: new Date('2024-03-01') },
              { score: 70, date: new Date('2024-01-01') }, // plus ancien, ignoré
            ],
          },
        },
        {
          id: 'h2', quantity: 20, averagePrice: 50,
          asset: {
            type: 'BOND', manualPrice: null,
            esgScores: [{ score: 60, date: new Date('2024-02-01') }],
          },
        },
      ],
    });

    const summary = await service.getSummary('p1');

    // Utilise le score le plus récent de chaque actif
    expect(summary.esgScoreWeighted).toBeCloseTo(70, 1);
  });

  it('should return null esgScoreWeighted when no holding has ESG scores', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      holdings: [
        {
          id: 'h1', quantity: 10, averagePrice: 100,
          asset: { type: 'ETF', manualPrice: null, esgScores: [] },
        },
      ],
    });

    const summary = await service.getSummary('p1');

    expect(summary.esgScoreWeighted).toBeNull();
  });

  it('should compute allocationByType as percentage of totalInvested', async () => {
    // ETF : 1000 € (50%), CRYPTO : 1000 € (50%)
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      holdings: [
        {
          id: 'h1', quantity: 10, averagePrice: 100,
          asset: { type: 'ETF', manualPrice: null, esgScores: [] },
        },
        {
          id: 'h2', quantity: 5, averagePrice: 200,
          asset: { type: 'CRYPTO', manualPrice: null, esgScores: [] },
        },
      ],
    });

    const summary = await service.getSummary('p1');

    expect(summary.allocationByType['ETF']).toBeCloseTo(50, 1);
    expect(summary.allocationByType['CRYPTO']).toBeCloseTo(50, 1);
  });

  it('should exclude holdings with quantity=0 from allocation and ESG calculations', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      holdings: [
        {
          id: 'h1', quantity: 10, averagePrice: 100,
          asset: { type: 'ETF', manualPrice: null, esgScores: [{ score: 75, date: new Date() }] },
        },
        {
          id: 'h2', quantity: 0, averagePrice: 200, // position clôturée
          asset: { type: 'STOCK', manualPrice: null, esgScores: [{ score: 30, date: new Date() }] },
        },
      ],
    });

    const summary = await service.getSummary('p1');

    expect(summary.allocationByType['STOCK']).toBeUndefined();
    // ESG uniquement basé sur h1
    expect(summary.esgScoreWeighted).toBeCloseTo(75, 1);
  });
});
