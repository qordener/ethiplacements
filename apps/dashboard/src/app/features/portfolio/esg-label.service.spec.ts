import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { EsgLabelService, SyncLabelsResult } from './esg-label.service';

describe('EsgLabelService', () => {
  let service: EsgLabelService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EsgLabelService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EsgLabelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('sync()', () => {
    it('should POST to /api/esg-labels/sync with the url', async () => {
      const result: SyncLabelsResult = { totalRows: 10, matched: 3, skippedLabels: 2, unmatchedIsin: 5 };
      const promise = firstValueFrom(service.sync('https://example.com/referentiel.xlsx'));

      const req = httpMock.expectOne('/api/esg-labels/sync');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ url: 'https://example.com/referentiel.xlsx' });
      req.flush(result);

      expect(await promise).toEqual(result);
    });

    it('should throw when the API rejects the URL', async () => {
      const promise = firstValueFrom(service.sync('bad-url'));

      httpMock.expectOne('/api/esg-labels/sync').flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      await expect(promise).rejects.toBeTruthy();
    });
  });
});
