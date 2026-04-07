import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  latentGain: number;
  latentGainPct: number;
  esgScoreWeighted: number | null;
  allocationByType: Record<string, number>;
}

export interface PortfolioCardData {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  changePercent: number;
  esgScore: number | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getPortfoliosWithSummary(): Observable<PortfolioCardData[]> {
    return this.http.get<Portfolio[]>('/api/portfolios').pipe(
      switchMap((portfolios) => {
        if (portfolios.length === 0) return of([]);

        const summaries$ = portfolios.map((p) =>
          this.http.get<PortfolioSummary>(`/api/portfolios/${p.id}/summary`)
        );

        return forkJoin(summaries$).pipe(
          map((summaries) =>
            portfolios.map((p, i) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              totalValue: summaries[i].currentValue,
              changePercent: summaries[i].latentGainPct,
              esgScore: summaries[i].esgScoreWeighted,
            }))
          )
        );
      })
    );
  }
}
