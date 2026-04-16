// ─── Données de test partagées entre les specs E2E ───────────────────────────

export const PORTFOLIO_P1 = {
  id: 'p1',
  name: 'PEA Éthique',
  description: 'Mon portefeuille ISR',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const PORTFOLIO_P2 = {
  id: 'p2',
  name: 'Compte Spéculatif',
  description: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const SUMMARY_P1 = {
  totalInvested: 1500,
  currentValue: 1550,
  latentGain: 50,
  latentGainPct: 3.33,
  esgScoreWeighted: 75,
  allocationByType: { STOCK: 100 },
};

export const SUMMARY_P2 = {
  totalInvested: 1000,
  currentValue: 950,
  latentGain: -50,
  latentGainPct: -5,
  esgScoreWeighted: 22,
  allocationByType: { CRYPTO: 100 },
};

export const HOLDING_H1 = {
  id: 'h1',
  quantity: 10,
  averagePrice: 150,
  asset: {
    id: 'a1',
    name: 'Danone',
    ticker: 'BN',
    type: 'STOCK',
    manualPrice: 155,
    esgScores: [
      { id: 'esg1', score: 75, provider: 'manual', date: '2024-01-01T00:00:00.000Z' },
    ],
  },
};

export const DETAIL_P1_EMPTY = {
  ...PORTFOLIO_P1,
  holdings: [],
};

export const DETAIL_P1_WITH_HOLDING = {
  ...PORTFOLIO_P1,
  holdings: [HOLDING_H1],
};

export const SUMMARY_P1_EMPTY = {
  ...SUMMARY_P1,
  esgScoreWeighted: null,
  allocationByType: {},
};
