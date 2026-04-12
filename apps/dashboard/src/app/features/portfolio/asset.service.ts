import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AssetType = 'STOCK' | 'ETF' | 'BOND' | 'CRYPTO' | 'OTHER';

export interface CreateAssetPayload {
  name: string;
  ticker: string;
  type: AssetType;
  isin?: string;
  sector?: string;
}

export interface AssetItem {
  id: string;
  name: string;
  ticker: string;
  type: string;
  manualPrice: number | null;
  esgScores: { id: string; score: number; provider: string; date: string }[];
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<AssetItem[]> {
    return this.http.get<AssetItem[]>('/api/assets');
  }

  create(dto: CreateAssetPayload): Observable<AssetItem> {
    return this.http.post<AssetItem>('/api/assets', dto);
  }
}
