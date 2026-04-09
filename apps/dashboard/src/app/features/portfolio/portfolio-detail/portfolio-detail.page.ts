import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortfolioDetailService, PortfolioDetailData } from '../portfolio-detail.service';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-portfolio-detail-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="portfolio-detail">

      <a
        data-testid="back-to-dashboard"
        routerLink="/dashboard"
        class="portfolio-detail__back"
      >← Retour au tableau de bord</a>

      @switch (state()) {

        @case ('loading') {
          <div data-testid="loading" role="status" class="portfolio-detail__loading">
            Chargement…
          </div>
        }

        @case ('error') {
          <div data-testid="error" class="portfolio-detail__error" role="alert">
            Impossible de charger ce portefeuille. Vérifiez que l'API est démarrée.
          </div>
        }

        @case ('loaded') {
          <h1 data-testid="portfolio-name" class="portfolio-detail__title">
            {{ data()!.portfolio.name }}
          </h1>

          @if (data()!.portfolio.description) {
            <p data-testid="portfolio-description" class="portfolio-detail__description">
              {{ data()!.portfolio.description }}
            </p>
          }

          <section class="portfolio-detail__metrics" aria-label="Métriques du portefeuille">
            <div class="metric-card">
              <span class="metric-card__label">Investi</span>
              <span data-testid="total-invested" class="metric-card__value">
                {{ data()!.summary.totalInvested | number:'1.2-2' }} €
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-card__label">Valeur actuelle</span>
              <span data-testid="current-value" class="metric-card__value">
                {{ data()!.summary.currentValue | number:'1.2-2' }} €
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-card__label">Performance</span>
              <span
                data-testid="latent-gain-pct"
                class="metric-card__value"
                [class.metric-card__value--positive]="data()!.summary.latentGainPct >= 0"
                [class.metric-card__value--negative]="data()!.summary.latentGainPct < 0"
              >
                {{ data()!.summary.latentGainPct | number:'1.2-2' }} %
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-card__label">Score ESG</span>
              <span data-testid="esg-score" class="metric-card__value">
                {{ data()!.summary.esgScoreWeighted !== null ? (data()!.summary.esgScoreWeighted | number:'1.0-0') : '—' }}
              </span>
            </div>
          </section>

          <section class="portfolio-detail__holdings" aria-label="Positions">
            <h2 class="portfolio-detail__section-title">Positions</h2>

            @if (data()!.portfolio.holdings.length === 0) {
              <p data-testid="holdings-empty" class="portfolio-detail__holdings-empty">
                Aucune position pour ce portefeuille.
              </p>
            } @else {
              <table data-testid="holdings-table" class="holdings-table">
                <thead>
                  <tr>
                    <th scope="col">Ticker</th>
                    <th scope="col">Nom</th>
                    <th scope="col">Type</th>
                    <th scope="col" class="holdings-table__num">Quantité</th>
                    <th scope="col" class="holdings-table__num">Prix moyen</th>
                  </tr>
                </thead>
                <tbody>
                  @for (holding of data()!.portfolio.holdings; track holding.id) {
                    <tr data-testid="holding-row" class="holdings-table__row">
                      <td class="holdings-table__ticker">{{ holding.asset.ticker }}</td>
                      <td>{{ holding.asset.name }}</td>
                      <td>{{ holding.asset.type }}</td>
                      <td class="holdings-table__num">{{ holding.quantity }}</td>
                      <td class="holdings-table__num">{{ holding.averagePrice | number:'1.2-2' }} €</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </section>
        }

      }
    </div>
  `,
  styles: [`
    .portfolio-detail {
      max-width: 900px;
      margin: var(--space-8, 32px) auto;
      padding: 0 var(--space-4, 16px);
    }

    .portfolio-detail__back {
      display: inline-block;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-primary, #2D6A4F);
      text-decoration: none;
      margin-bottom: var(--space-6, 24px);
    }

    .portfolio-detail__back:hover {
      text-decoration: underline;
    }

    .portfolio-detail__title {
      font-size: var(--text-2xl, 1.5rem);
      font-weight: 700;
      color: var(--color-neutral-900, #1A1A2E);
      margin-bottom: var(--space-2, 8px);
    }

    .portfolio-detail__description {
      font-size: var(--text-base, 1rem);
      color: var(--color-neutral-600, #4A4A6A);
      margin-bottom: var(--space-6, 24px);
    }

    .portfolio-detail__loading,
    .portfolio-detail__error {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-neutral-600, #4A4A6A);
    }

    .portfolio-detail__error {
      color: var(--color-danger, #E76F51);
    }

    .portfolio-detail__metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-4, 16px);
      margin-bottom: var(--space-8, 32px);
    }

    .metric-card {
      background: var(--color-neutral-50, #F8F9FA);
      border: 1px solid var(--color-neutral-200, #E8E8F0);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    .metric-card__label {
      font-size: var(--text-xs, 0.75rem);
      font-weight: 500;
      color: var(--color-neutral-500, #6A6A8A);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-card__value {
      font-size: var(--text-xl, 1.25rem);
      font-weight: 700;
      color: var(--color-neutral-900, #1A1A2E);
    }

    .metric-card__value--positive { color: var(--color-success, #2D6A4F); }
    .metric-card__value--negative { color: var(--color-danger, #E76F51); }

    .portfolio-detail__section-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-neutral-800, #2A2A4A);
      margin-bottom: var(--space-4, 16px);
    }

    .portfolio-detail__holdings-empty {
      color: var(--color-neutral-500, #6A6A8A);
      font-style: italic;
    }

    .holdings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm, 0.875rem);
    }

    .holdings-table th {
      text-align: left;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-weight: 600;
      color: var(--color-neutral-600, #4A4A6A);
      border-bottom: 2px solid var(--color-neutral-200, #E8E8F0);
    }

    .holdings-table td {
      padding: var(--space-3, 12px);
      border-bottom: 1px solid var(--color-neutral-100, #F0F0F8);
      color: var(--color-neutral-900, #1A1A2E);
    }

    .holdings-table__row:hover td {
      background: var(--color-neutral-50, #F8F9FA);
    }

    .holdings-table__ticker {
      font-weight: 600;
      font-family: monospace;
    }

    .holdings-table__num {
      text-align: right;
    }
  `],
})
export class PortfolioDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly portfolioDetailService = inject(PortfolioDetailService);

  state = signal<PageState>('loading');
  data = signal<PortfolioDetailData | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.portfolioDetailService.getPortfolioDetail(id).subscribe({
      next: (detail) => {
        this.data.set(detail);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
