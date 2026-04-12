import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateHoldingPayload {
  assetId: string;
  quantity: number;
  averagePrice: number;
}

export interface HoldingAsset {
  id: string;
  name: string;
  ticker: string;
  type: string;
  manualPrice: number | null;
}

export interface Holding {
  id: string;
  portfolioId: string;
  assetId: string;
  quantity: number;
  averagePrice: number;
  asset: HoldingAsset;
}

@Injectable({ providedIn: 'root' })
export class HoldingService {
  private readonly http = inject(HttpClient);

  create(portfolioId: string, dto: CreateHoldingPayload): Observable<Holding> {
    return this.http.post<Holding>(`/api/portfolios/${portfolioId}/holdings`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/holdings/${id}`);
  }
}
