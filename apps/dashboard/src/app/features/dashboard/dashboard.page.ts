import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService, PortfolioCardData } from './dashboard.service';
import { PortfolioCard } from '../../shared/components/portfolio-card/portfolio-card';

type PageState = 'loading' | 'loaded' | 'empty' | 'error';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PortfolioCard],
  template: `
    @switch (state()) {
      @case ('loading') {
        <div data-testid="dashboard-loading" class="dashboard-loading" aria-live="polite" aria-busy="true">
          <span class="sr-only">Chargement des portefeuilles…</span>
          <div class="spinner"></div>
        </div>
      }
      @case ('error') {
        <div data-testid="dashboard-error" class="dashboard-error" role="alert">
          <p>Le chargement des portefeuilles est impossible. Vérifiez que l'API est démarrée.</p>
        </div>
      }
      @case ('empty') {
        <div data-testid="dashboard-empty" class="dashboard-empty" role="status">
          <p>Aucun portefeuille — commencez par en créer un.</p>
        </div>
      }
      @case ('loaded') {
        <div class="dashboard-grid">
          @for (portfolio of portfolios(); track portfolio.id) {
            <app-portfolio-card
              [id]="portfolio.id"
              [name]="portfolio.name"
              [description]="portfolio.description"
              [totalValue]="portfolio.totalValue"
              [changePercent]="portfolio.changePercent"
              [esgScore]="portfolio.esgScore"
              (cardClick)="onCardClick($event)"
            />
          }
        </div>
      }
    }
  `,
  styles: [`
    .dashboard-loading {
      display: flex;
      justify-content: center;
      padding: var(--space-8, 32px);
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-neutral-200, #E2E4E9);
      border-top-color: var(--color-primary, #2D6A4F);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .dashboard-error,
    .dashboard-empty {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-neutral-600, #4A4A6A);
    }
    .dashboard-error {
      color: var(--color-danger, #E76F51);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4, 16px);
      padding: var(--space-4, 16px);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  state = signal<PageState>('loading');
  portfolios = signal<PortfolioCardData[]>([]);

  ngOnInit() {
    this.dashboardService.getPortfoliosWithSummary().subscribe({
      next: (data) => {
        this.portfolios.set(data);
        this.state.set(data.length === 0 ? 'empty' : 'loaded');
      },
      error: () => {
        this.state.set('error');
      },
    });
  }

  onCardClick(id: string) {
    this.router.navigate(['/portfolio', id]);
  }
}
