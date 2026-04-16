import { Component, input } from '@angular/core';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

@Component({
  selector: 'epi-metric-card',
  standalone: true,
  imports: [InfoTooltip],
  template: `
    <div data-testid="metric-card" class="metric-card">
      <span class="metric-card__label-row">
        <span data-testid="metric-label" class="metric-card__label">{{ label() }}</span>
        @if (tooltip()) {
          <app-info-tooltip [text]="tooltip()!" />
        }
      </span>

      <span
        data-testid="metric-value"
        class="metric-card__value"
        [class.metric-card__value--positive]="trend() === 'positive'"
        [class.metric-card__value--negative]="trend() === 'negative'"
      >
        @if (trend() === 'positive' || trend() === 'negative') {
          <span data-testid="trend-icon" class="metric-card__trend-icon" aria-hidden="true">
            {{ trend() === 'positive' ? '↑' : '↓' }}
          </span>
        }
        {{ value() }}
      </span>

      @if (sublabel()) {
        <span data-testid="metric-sublabel" class="metric-card__sublabel">
          {{ sublabel() }}
        </span>
      }
    </div>
  `,
  styles: [`
    .metric-card {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e8e8f0);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    .metric-card__label-row {
      display: flex;
      align-items: center;
      gap: var(--space-1, 4px);
    }

    .metric-card__label {
      font-size: var(--text-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-subtle, #6a6a8a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-card__value {
      font-size: var(--text-xl, 1.25rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #1a1a2e);
      font-family: var(--font-mono, monospace);
      display: flex;
      align-items: center;
      gap: var(--space-1, 4px);
    }

    .metric-card__value--positive { color: var(--color-gain, #15803d); }
    .metric-card__value--negative { color: var(--color-loss, #dc2626); }

    .metric-card__trend-icon {
      font-size: var(--text-sm, 0.875rem);
    }

    .metric-card__sublabel {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #4a4a6a);
    }
  `],
})
export class MetricCard {
  label    = input.required<string>();
  value    = input.required<string | number>();
  trend    = input<'positive' | 'negative' | 'neutral' | null>(null);
  sublabel = input<string | null>(null);
  tooltip  = input<string | null>(null);
}
