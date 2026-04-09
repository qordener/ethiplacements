import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PortfolioDetailService, PortfolioDetailData } from './portfolio-detail.service';

const MOCK_PORTFOLIO = {
  id: 'cuid-1',
  name: 'Mon PEA',
  description: 'Portefeuille ISR',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  holdings: [
    {
      id: 'holding-1',
      quantity: 10,
      averagePrice: 150,
      asset: {
        id: 'asset-1',
        name: 'Danone',
        ticker: 'BN',
        type: 'STOCK',
        manualPrice: 155,
      },
    },
  ],
};

const MOCK_SUMMARY = {
  totalInvested: 1500,
  currentValue: 1550,
  latentGain: 50,
  latentGainPct: 3.33,
  esgScoreWeighted: 72,
  allocationByType: { STOCK: 100 },
};

describe('PortfolioDetailService', () => {
  let service: PortfolioDetailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PortfolioDetailService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PortfolioDetailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPortfolioDetail', () => {
    it('should call GET /api/portfolios/:id and /api/portfolios/:id/summary in parallel', () => {
      service.getPortfolioDetail('cuid-1').subscribe();

      const detailReq = httpMock.expectOne('/api/portfolios/cuid-1');
      const summaryReq = httpMock.expectOne('/api/portfolios/cuid-1/summary');

      expect(detailReq.request.method).toBe('GET');
      expect(summaryReq.request.method).toBe('GET');

      detailReq.flush(MOCK_PORTFOLIO);
      summaryReq.flush(MOCK_SUMMARY);
    });

    it('should return combined portfolio and summary data', async () => {
      let result: PortfolioDetailData | undefined;

      service.getPortfolioDetail('cuid-1').subscribe((data) => (result = data));

      httpMock.expectOne('/api/portfolios/cuid-1').flush(MOCK_PORTFOLIO);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush(MOCK_SUMMARY);

      expect(result).toEqual({ portfolio: MOCK_PORTFOLIO, summary: MOCK_SUMMARY });
    });

    it('should expose portfolio name', async () => {
      let result: PortfolioDetailData | undefined;

      service.getPortfolioDetail('cuid-1').subscribe((data) => (result = data));

      httpMock.expectOne('/api/portfolios/cuid-1').flush(MOCK_PORTFOLIO);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush(MOCK_SUMMARY);

      expect(result?.portfolio.name).toBe('Mon PEA');
    });

    it('should expose holdings with asset info', async () => {
      let result: PortfolioDetailData | undefined;

      service.getPortfolioDetail('cuid-1').subscribe((data) => (result = data));

      httpMock.expectOne('/api/portfolios/cuid-1').flush(MOCK_PORTFOLIO);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush(MOCK_SUMMARY);

      expect(result?.portfolio.holdings).toHaveLength(1);
      expect(result?.portfolio.holdings[0].asset.ticker).toBe('BN');
    });

    it('should expose esgScoreWeighted from summary', async () => {
      let result: PortfolioDetailData | undefined;

      service.getPortfolioDetail('cuid-1').subscribe((data) => (result = data));

      httpMock.expectOne('/api/portfolios/cuid-1').flush(MOCK_PORTFOLIO);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush(MOCK_SUMMARY);

      expect(result?.summary.esgScoreWeighted).toBe(72);
    });

    it('should handle null esgScoreWeighted', async () => {
      let result: PortfolioDetailData | undefined;

      service.getPortfolioDetail('cuid-1').subscribe((data) => (result = data));

      httpMock.expectOne('/api/portfolios/cuid-1').flush(MOCK_PORTFOLIO);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush({ ...MOCK_SUMMARY, esgScoreWeighted: null });

      expect(result?.summary.esgScoreWeighted).toBeNull();
    });

    it('should use the provided id in the URL', () => {
      service.getPortfolioDetail('other-id').subscribe();

      httpMock.expectOne('/api/portfolios/other-id').flush(MOCK_PORTFOLIO);
      httpMock.expectOne('/api/portfolios/other-id/summary').flush(MOCK_SUMMARY);
    });
  });
});
