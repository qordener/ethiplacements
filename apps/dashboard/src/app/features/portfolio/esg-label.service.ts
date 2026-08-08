import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SyncLabelsResult {
  totalRows: number;
  matched: number;
  skippedLabels: number;
  unmatchedIsin: number;
}

@Injectable({ providedIn: 'root' })
export class EsgLabelService {
  private readonly http = inject(HttpClient);

  sync(url: string): Observable<SyncLabelsResult> {
    return this.http.post<SyncLabelsResult>('/api/esg-labels/sync', { url });
  }
}
