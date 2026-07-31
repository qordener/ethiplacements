import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateDepositPayload {
  amount: number;
  date: string;
  notes?: string;
}

export interface Deposit {
  id: string;
  portfolioId: string;
  amount: number;
  date: string;
  notes: string | null;
}

export interface PeaCeiling {
  totalDeposited: number;
  ceiling: number;
  remaining: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class DepositService {
  private readonly http = inject(HttpClient);

  create(portfolioId: string, dto: CreateDepositPayload): Observable<Deposit> {
    return this.http.post<Deposit>(`/api/portfolios/${portfolioId}/deposits`, dto);
  }

  findAllByPortfolio(portfolioId: string): Observable<Deposit[]> {
    return this.http.get<Deposit[]>(`/api/portfolios/${portfolioId}/deposits`);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/deposits/${id}`);
  }

  getCeiling(portfolioId: string): Observable<PeaCeiling> {
    return this.http.get<PeaCeiling>(`/api/portfolios/${portfolioId}/pea-ceiling`);
  }
}
