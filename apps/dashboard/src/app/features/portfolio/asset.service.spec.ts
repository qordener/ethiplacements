import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AssetService, CreateAssetPayload } from './asset.service';

const MOCK_ASSETS = [
  { id: 'a1', name: 'Danone', ticker: 'BN', type: 'STOCK', manualPrice: 155, esgScores: [] },
  { id: 'a2', name: 'iShares MSCI World SRI', ticker: 'SUSW', type: 'ETF', manualPrice: null, esgScores: [] },
];

describe('AssetService', () => {
  let service: AssetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should GET /api/assets', async () => {
      const promise = firstValueFrom(service.findAll());

      const req = httpMock.expectOne('/api/assets');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_ASSETS);

      const result = await promise;
      expect(result).toHaveLength(2);
    });

    it('should return an array of assets with their properties', async () => {
      const promise = firstValueFrom(service.findAll());

      httpMock.expectOne('/api/assets').flush(MOCK_ASSETS);

      const result = await promise;
      expect(result[0].ticker).toBe('BN');
      expect(result[1].type).toBe('ETF');
    });

    it('should return empty array when no assets exist', async () => {
      const promise = firstValueFrom(service.findAll());

      httpMock.expectOne('/api/assets').flush([]);

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should POST to /api/assets with name, ticker and type', async () => {
      const payload: CreateAssetPayload = { name: 'Tesla', ticker: 'TSLA', type: 'STOCK' };
      const created = { id: 'a3', ...payload, manualPrice: null, esgScores: [] };
      const promise = firstValueFrom(service.create(payload));

      const req = httpMock.expectOne('/api/assets');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(created);

      const result = await promise;
      expect(result.id).toBe('a3');
      expect(result.ticker).toBe('TSLA');
    });

    it('should throw when ticker already exists (409)', async () => {
      const payload: CreateAssetPayload = { name: 'Danone', ticker: 'BN', type: 'STOCK' };
      const promise = firstValueFrom(service.create(payload));

      httpMock.expectOne('/api/assets').flush('Conflict', {
        status: 409,
        statusText: 'Conflict',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });

  // ─── updatePrice ──────────────────────────────────────────────────────────

  describe('updatePrice()', () => {
    it('should PATCH /api/assets/:id with manualPrice', async () => {
      const updated = { ...MOCK_ASSETS[0], manualPrice: 162.5 };
      const promise = firstValueFrom(service.updatePrice('a1', { manualPrice: 162.5 }));

      const req = httpMock.expectOne('/api/assets/a1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ manualPrice: 162.5 });
      req.flush(updated);

      const result = await promise;
      expect(result.manualPrice).toBe(162.5);
    });

    it('should include manualPriceDate when provided', async () => {
      const updated = { ...MOCK_ASSETS[0], manualPrice: 155, manualPriceDate: '2026-04-12' };
      const promise = firstValueFrom(
        service.updatePrice('a1', { manualPrice: 155, manualPriceDate: '2026-04-12' })
      );

      const req = httpMock.expectOne('/api/assets/a1');
      expect(req.request.body).toEqual({ manualPrice: 155, manualPriceDate: '2026-04-12' });
      req.flush(updated);

      await promise;
    });

    it('should throw when asset does not exist (404)', async () => {
      const promise = firstValueFrom(service.updatePrice('nonexistent', { manualPrice: 100 }));

      httpMock.expectOne('/api/assets/nonexistent').flush('Not found', {
        status: 404,
        statusText: 'Not Found',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });
});
