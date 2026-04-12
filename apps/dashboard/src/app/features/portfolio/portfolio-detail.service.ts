import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export interface EsgScore {
  id: string;
  score: number;
  provider: string;
  date: string;
}

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  type: string;
  manualPrice: number | null;
  esgScores: EsgScore[];
}

export interface Holding {
  id: string;
  quantity: number;
  averagePrice: number;
  asset: Asset;
}

export interface PortfolioDetail {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  holdings: Holding[];
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  latentGain: number;
  latentGainPct: number;
  esgScoreWeighted: number | null;
  allocationByType: Record<string, number>;
}

export interface PortfolioDetailData {
  portfolio: PortfolioDetail;
  summary: PortfolioSummary;
}

@Injectable({ providedIn: 'root' })
export class PortfolioDetailService {
  private readonly http = inject(HttpClient);

  getPortfolioDetail(id: string): Observable<PortfolioDetailData> {
    return forkJoin({
      portfolio: this.http.get<PortfolioDetail>(`/api/portfolios/${id}`),
      summary: this.http.get<PortfolioSummary>(`/api/portfolios/${id}/summary`),
    });
  }
}
