import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { EsgScoreService, CreateEsgScorePayload } from './esg-score.service';

const MOCK_ESG_SCORE = {
  id: 'esg-1',
  assetId: 'asset-1',
  score: 75,
  provider: 'manual',
  date: '2026-04-12T00:00:00.000Z',
  details: null,
};

describe('EsgScoreService', () => {
  let service: EsgScoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EsgScoreService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EsgScoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should POST to /api/assets/:assetId/esg-scores', async () => {
      const payload: CreateEsgScorePayload = { score: 75, provider: 'manual' };
      const promise = firstValueFrom(service.create('asset-1', payload));

      const req = httpMock.expectOne('/api/assets/asset-1/esg-scores');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(MOCK_ESG_SCORE);

      const result = await promise;
      expect(result.id).toBe('esg-1');
      expect(result.score).toBe(75);
    });

    it('should include an optional date in the payload', async () => {
      const payload: CreateEsgScorePayload = {
        score: 60,
        provider: 'MSCI',
        date: '2026-01-15',
      };
      const promise = firstValueFrom(service.create('asset-1', payload));

      const req = httpMock.expectOne('/api/assets/asset-1/esg-scores');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...MOCK_ESG_SCORE, score: 60, provider: 'MSCI' });

      const result = await promise;
      expect(result.provider).toBe('MSCI');
    });

    it('should throw when asset does not exist (404)', async () => {
      const promise = firstValueFrom(service.create('nonexistent', { score: 50, provider: 'manual' }));

      httpMock.expectOne('/api/assets/nonexistent/esg-scores').flush('Not found', {
        status: 404,
        statusText: 'Not Found',
      });

      await expect(promise).rejects.toBeTruthy();
    });

    it('should throw when score is out of range (400)', async () => {
      const promise = firstValueFrom(service.create('asset-1', { score: 150, provider: 'manual' }));

      httpMock.expectOne('/api/assets/asset-1/esg-scores').flush('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(promise).rejects.toBeTruthy();
    });
  });
});
