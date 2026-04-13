import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreatePortfolioPayload {
  name: string;
  description?: string | null;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly http = inject(HttpClient);

  createPortfolio(payload: CreatePortfolioPayload): Observable<Portfolio> {
    return this.http.post<Portfolio>('/api/portfolios', {
      name: payload.name,
      description: payload.description ?? null,
    });
  }

  removePortfolio(id: string): Observable<void> {
    return this.http.delete<void>(`/api/portfolios/${id}`);
  }
}
