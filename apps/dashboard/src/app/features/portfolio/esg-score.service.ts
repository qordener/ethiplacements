import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateEsgScorePayload {
  score: number;
  provider: string;
  date?: string;
}

export interface EsgScoreResult {
  id: string;
  assetId: string;
  score: number;
  provider: string;
  date: string;
  details: string | null;
}

@Injectable({ providedIn: 'root' })
export class EsgScoreService {
  private readonly http = inject(HttpClient);

  create(assetId: string, dto: CreateEsgScorePayload): Observable<EsgScoreResult> {
    return this.http.post<EsgScoreResult>(`/api/assets/${assetId}/esg-scores`, dto);
  }
}
