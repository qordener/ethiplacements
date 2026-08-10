import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { BankImportService, BankImportResult } from './bank-import.service';

describe('BankImportService', () => {
  let service: BankImportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BankImportService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BankImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('importOfx()', () => {
    it('should POST a FormData with the file to /api/portfolios/:id/import/ofx', () => {
      const file = new File(['<OFX></OFX>'], 'releve.ofx', { type: 'application/x-ofx' });
      service.importOfx('p1', file, false).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/portfolios/p1/import/ofx');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect(req.request.params.get('confirm')).toBe('false');
      req.flush({ transactions: [], deposits: [] });
    });

    it('should pass confirm=true when requested', () => {
      const file = new File(['<OFX></OFX>'], 'releve.ofx');
      service.importOfx('p1', file, true).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/portfolios/p1/import/ofx');
      expect(req.request.params.get('confirm')).toBe('true');
      req.flush({ transactions: [], deposits: [] });
    });

    it('should return the parsed result', async () => {
      const result: BankImportResult = {
        transactions: [{ fitId: 'B1', kind: 'BUY', date: '2026-01-15', quantity: 10, price: 350, amount: -3500, securityName: 'CW8', securityTicker: 'CW8', holdingId: 'h1', skippedReason: null, imported: false, error: null }],
        deposits: [],
      };
      const file = new File(['<OFX></OFX>'], 'releve.ofx');
      const promise = firstValueFrom(service.importOfx('p1', file, false));

      httpMock.expectOne((r) => r.url === '/api/portfolios/p1/import/ofx').flush(result);

      expect(await promise).toEqual(result);
    });
  });
});
