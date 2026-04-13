import { Component, computed, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ScoreBadge } from '../score-badge/score-badge';

export type ChangeClass = 'change-positive' | 'change-negative' | 'change-neutral';

@Component({
  selector: 'app-portfolio-card',
  standalone: true,
  imports: [CommonModule, ScoreBadge],
  template: `
    <div
      role="button"
      data-testid="portfolio-card"
      class="portfolio-card"
      [attr.aria-label]="'Portefeuille ' + name()"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      tabindex="0"
    >
      <div class="portfolio-card__header">
        <span data-testid="portfolio-name" class="portfolio-card__name">{{ name() }}</span>
        <div class="portfolio-card__header-actions">
          <span
            data-testid="portfolio-change"
            class="portfolio-card__change"
            [class]="changeClass()"
          >{{ formattedChange() }}</span>
          <button
            data-testid="btn-delete-portfolio"
            class="portfolio-card__delete-btn"
            aria-label="Supprimer ce portefeuille"
            (click)="onDeleteClick($event)"
          >🗑</button>
        </div>
      </div>

      <div class="portfolio-card__value">
        <span data-testid="portfolio-value">{{ formattedValue() }}</span>
      </div>

      <p data-testid="portfolio-description" class="portfolio-card__description">
        {{ hasDescription() ? description() : 'Aucune description' }}
      </p>

      @if (esgScore() !== null) {
        <div data-testid="portfolio-esg" class="portfolio-card__esg">
          <epi-score-badge [score]="esgScore()" label="Score ESG" />
        </div>
      }
    </div>
  `,
  styles: [`
    .portfolio-card {
      background: var(--color-neutral-100, #F8F9FA);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-4, 16px);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      outline: none;
      transition: box-shadow 0.15s ease;
    }
    .portfolio-card:hover, .portfolio-card:focus {
      box-shadow: var(--shadow-md);
    }
    .portfolio-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2, 8px);
    }
    .portfolio-card__header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }
    .portfolio-card__delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-sm, 0.875rem);
      opacity: 0.5;
      transition: opacity 0.15s ease;
    }
    .portfolio-card__delete-btn:hover {
      opacity: 1;
    }
    .portfolio-card__name {
      font-size: var(--text-lg, 1.25rem);
      font-weight: 600;
      color: var(--color-neutral-900, #1A1A2E);
    }
    .portfolio-card__value {
      font-size: var(--text-xl, 1.5rem);
      font-weight: 700;
      color: var(--color-neutral-900, #1A1A2E);
      margin-bottom: var(--space-2, 8px);
    }
    .portfolio-card__change {
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
    }
    .change-positive { color: var(--color-success, #40916C); }
    .change-negative { color: var(--color-danger, #E76F51); }
    .change-neutral  { color: var(--color-neutral-600, #4A4A6A); }
    .portfolio-card__description {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-600, #4A4A6A);
      margin: var(--space-2, 8px) 0;
    }
    .portfolio-card__esg {
      margin-top: var(--space-3, 12px);
      padding-top: var(--space-3, 12px);
      border-top: 1px solid var(--color-neutral-200, #E2E4E9);
    }
  `],
})
export class PortfolioCard {
  id = input.required<string>();
  name = input.required<string>();
  description = input.required<string | null>();
  totalValue = input.required<number>();
  changePercent = input.required<number>();
  esgScore = input.required<number | null>();

  cardClick = output<string>();
  deleteClick = output<string>();

  changeClass = computed<ChangeClass>(() => {
    const c = this.changePercent();
    if (c > 0) return 'change-positive';
    if (c < 0) return 'change-negative';
    return 'change-neutral';
  });

  formattedChange = computed(() => {
    const c = this.changePercent();
    const sign = c > 0 ? '+' : '';
    return `${sign}${c.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  });

  formattedValue = computed(() =>
    this.totalValue().toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    })
  );

  hasDescription = computed(() => !!this.description());

  onClick() {
    this.cardClick.emit(this.id());
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClick.emit(this.id());
  }
}
