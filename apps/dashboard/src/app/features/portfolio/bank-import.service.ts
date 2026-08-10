import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImportedTransactionRow {
  fitId: string;
  kind: 'BUY' | 'SELL' | 'DIVIDEND';
  date: string;
  quantity: number | null;
  price: number | null;
  amount: number;
  securityName: string;
  securityTicker: string | null;
  holdingId: string | null;
  skippedReason: string | null;
  imported: boolean;
  error: string | null;
}

export interface ImportedDepositRow {
  fitId: string;
  date: string;
  amount: number;
  label: string;
  imported: boolean;
  error: string | null;
}

export interface BankImportResult {
  transactions: ImportedTransactionRow[];
  deposits: ImportedDepositRow[];
}

@Injectable({ providedIn: 'root' })
export class BankImportService {
  private readonly http = inject(HttpClient);

  importOfx(portfolioId: string, file: File, confirm: boolean): Observable<BankImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BankImportResult>(
      `/api/portfolios/${portfolioId}/import/ofx`,
      formData,
      { params: { confirm: String(confirm) } },
    );
  }
}
