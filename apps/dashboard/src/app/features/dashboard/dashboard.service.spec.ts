import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { DashboardService } from './dashboard.service';

const MOCK_PORTFOLIOS = [
  { id: 'cuid-1', name: 'PEA Éthique', description: 'Mon PEA ISR', createdAt: '', updatedAt: '' },
  { id: 'cuid-2', name: 'Livret Solidaire', description: null, createdAt: '', updatedAt: '' },
];

const MOCK_SUMMARY_1 = {
  totalInvested: 10000,
  currentValue: 11200,
  latentGain: 1200,
  latentGainPct: 12,
  esgScoreWeighted: 72,
  allocationByType: { ETF: 100 },
};

const MOCK_SUMMARY_2 = {
  totalInvested: 5000,
  currentValue: 5000,
  latentGain: 0,
  latentGainPct: 0,
  esgScoreWeighted: null,
  allocationByType: {},
};

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPortfoliosWithSummary()', () => {
    it('should return PortfolioCardData[] combining portfolio list and summaries', async () => {
      const promise = firstValueFrom(service.getPortfoliosWithSummary());

      httpMock.expectOne('/api/portfolios').flush(MOCK_PORTFOLIOS);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush(MOCK_SUMMARY_1);
      httpMock.expectOne('/api/portfolios/cuid-2/summary').flush(MOCK_SUMMARY_2);

      const data = await promise;
      expect(data).toHaveLength(2);

      const pea = data.find((d) => d.id === 'cuid-1')!;
      expect(pea.name).toBe('PEA Éthique');
      expect(pea.description).toBe('Mon PEA ISR');
      expect(pea.totalValue).toBe(11200);
      expect(pea.changePercent).toBe(12);
      expect(pea.esgScore).toBe(72);

      const livret = data.find((d) => d.id === 'cuid-2')!;
      expect(livret.name).toBe('Livret Solidaire');
      expect(livret.description).toBeNull();
      expect(livret.totalValue).toBe(5000);
      expect(livret.changePercent).toBe(0);
      expect(livret.esgScore).toBeNull();
    });

    it('should return an empty array when no portfolios exist', async () => {
      const promise = firstValueFrom(service.getPortfoliosWithSummary());

      httpMock.expectOne('/api/portfolios').flush([]);

      const data = await promise;
      expect(data).toHaveLength(0);
    });

    it('should preserve the order of portfolios', async () => {
      const promise = firstValueFrom(service.getPortfoliosWithSummary());

      httpMock.expectOne('/api/portfolios').flush(MOCK_PORTFOLIOS);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush(MOCK_SUMMARY_1);
      httpMock.expectOne('/api/portfolios/cuid-2/summary').flush(MOCK_SUMMARY_2);

      const data = await promise;
      expect(data[0].id).toBe('cuid-1');
      expect(data[1].id).toBe('cuid-2');
    });

    it('should throw an error when the portfolios endpoint fails', async () => {
      const promise = firstValueFrom(service.getPortfoliosWithSummary());

      httpMock.expectOne('/api/portfolios').flush('Server error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(promise).rejects.toBeTruthy();
    });

    it('should throw an error when a summary endpoint fails', async () => {
      const promise = firstValueFrom(service.getPortfoliosWithSummary());

      httpMock.expectOne('/api/portfolios').flush([MOCK_PORTFOLIOS[0]]);
      httpMock.expectOne('/api/portfolios/cuid-1/summary').flush('Not found', {
        status: 404,
        statusText: 'Not Found',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });
});
