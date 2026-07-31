import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { DepositService, CreateDepositPayload } from './deposit.service';

const MOCK_DEPOSIT = {
  id: 'd1',
  portfolioId: 'p1',
  amount: 1000,
  date: '2026-01-15T00:00:00.000Z',
  notes: null,
};

const MOCK_CEILING = { totalDeposited: 75_000, ceiling: 150_000, remaining: 75_000, percentage: 50 };

describe('DepositService', () => {
  let service: DepositService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepositService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DepositService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should POST to /api/portfolios/:id/deposits', async () => {
      const payload: CreateDepositPayload = { amount: 1000, date: '2026-01-15' };
      const promise = firstValueFrom(service.create('p1', payload));

      const req = httpMock.expectOne('/api/portfolios/p1/deposits');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(MOCK_DEPOSIT);

      const result = await promise;
      expect(result.id).toBe('d1');
      expect(result.amount).toBe(1000);
    });

    it('should throw when the API rejects the payload (400)', async () => {
      const payload: CreateDepositPayload = { amount: -5, date: '2026-01-15' };
      const promise = firstValueFrom(service.create('p1', payload));

      httpMock.expectOne('/api/portfolios/p1/deposits').flush('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });

  // ─── findAllByPortfolio ─────────────────────────────────────────────────────

  describe('findAllByPortfolio()', () => {
    it('should GET /api/portfolios/:id/deposits', async () => {
      const promise = firstValueFrom(service.findAllByPortfolio('p1'));

      const req = httpMock.expectOne('/api/portfolios/p1/deposits');
      expect(req.request.method).toBe('GET');
      req.flush([MOCK_DEPOSIT]);

      const result = await promise;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('d1');
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should DELETE /api/deposits/:id', async () => {
      const promise = firstValueFrom(service.remove('d1'));

      const req = httpMock.expectOne('/api/deposits/d1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
    });
  });

  // ─── getCeiling ───────────────────────────────────────────────────────────

  describe('getCeiling()', () => {
    it('should GET /api/portfolios/:id/pea-ceiling', async () => {
      const promise = firstValueFrom(service.getCeiling('p1'));

      const req = httpMock.expectOne('/api/portfolios/p1/pea-ceiling');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_CEILING);

      const result = await promise;
      expect(result).toEqual(MOCK_CEILING);
    });
  });
});
