import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { HoldingService, CreateHoldingPayload } from './holding.service';

const MOCK_HOLDING = {
  id: 'h1',
  portfolioId: 'p1',
  assetId: 'asset1',
  quantity: 10,
  averagePrice: 150,
  asset: { id: 'asset1', name: 'Danone', ticker: 'BN', type: 'STOCK', manualPrice: 155 },
};

describe('HoldingService', () => {
  let service: HoldingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HoldingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HoldingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should POST to /api/portfolios/:id/holdings', async () => {
      const payload: CreateHoldingPayload = { assetId: 'asset1', quantity: 10, averagePrice: 150 };
      const promise = firstValueFrom(service.create('p1', payload));

      const req = httpMock.expectOne('/api/portfolios/p1/holdings');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(MOCK_HOLDING);

      const result = await promise;
      expect(result.id).toBe('h1');
      expect(result.quantity).toBe(10);
    });

    it('should return the created holding with asset info', async () => {
      const payload: CreateHoldingPayload = { assetId: 'asset1', quantity: 5, averagePrice: 200 };
      const promise = firstValueFrom(service.create('p1', payload));

      httpMock.expectOne('/api/portfolios/p1/holdings').flush(MOCK_HOLDING);

      const result = await promise;
      expect(result.asset.ticker).toBe('BN');
    });

    it('should throw when API returns 409 (asset already in portfolio)', async () => {
      const payload: CreateHoldingPayload = { assetId: 'asset1', quantity: 5, averagePrice: 200 };
      const promise = firstValueFrom(service.create('p1', payload));

      httpMock.expectOne('/api/portfolios/p1/holdings').flush('Conflict', {
        status: 409,
        statusText: 'Conflict',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should DELETE /api/holdings/:id', async () => {
      const promise = firstValueFrom(service.remove('h1'));

      const req = httpMock.expectOne('/api/holdings/h1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
    });

    it('should throw when holding does not exist (404)', async () => {
      const promise = firstValueFrom(service.remove('nonexistent'));

      httpMock.expectOne('/api/holdings/nonexistent').flush('Not found', {
        status: 404,
        statusText: 'Not Found',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });
});
