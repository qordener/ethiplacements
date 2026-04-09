import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { PortfolioService } from './portfolio.service';

const MOCK_CREATED_PORTFOLIO = {
  id: 'cuid-new',
  name: 'Mon PEA',
  description: 'Portefeuille ISR',
  createdAt: '2026-04-07T00:00:00.000Z',
  updatedAt: '2026-04-07T00:00:00.000Z',
};

describe('PortfolioService', () => {
  let service: PortfolioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PortfolioService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createPortfolio()', () => {
    it('should POST to /api/portfolios with name and description', async () => {
      const promise = firstValueFrom(
        service.createPortfolio({ name: 'Mon PEA', description: 'Portefeuille ISR' })
      );

      const req = httpMock.expectOne('/api/portfolios');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Mon PEA', description: 'Portefeuille ISR' });
      req.flush(MOCK_CREATED_PORTFOLIO);

      const result = await promise;
      expect(result.id).toBe('cuid-new');
      expect(result.name).toBe('Mon PEA');
    });

    it('should POST with null description when not provided', async () => {
      const promise = firstValueFrom(service.createPortfolio({ name: 'Livret A' }));

      const req = httpMock.expectOne('/api/portfolios');
      expect(req.request.body).toEqual({ name: 'Livret A', description: null });
      req.flush({ ...MOCK_CREATED_PORTFOLIO, name: 'Livret A', description: null });

      const result = await promise;
      expect(result.description).toBeNull();
    });

    it('should throw an error when the API returns 500', async () => {
      const promise = firstValueFrom(service.createPortfolio({ name: 'Mon PEA' }));

      httpMock.expectOne('/api/portfolios').flush('Server error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(promise).rejects.toBeTruthy();
    });

    it('should return the created portfolio with all fields', async () => {
      const promise = firstValueFrom(
        service.createPortfolio({ name: 'Mon PEA', description: 'ISR' })
      );

      httpMock.expectOne('/api/portfolios').flush(MOCK_CREATED_PORTFOLIO);

      const result = await promise;
      expect(result).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });
});
