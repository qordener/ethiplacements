import { Component, computed, input } from '@angular/core';

export interface BarItem {
  label: string;
  /** Score 0–max, ou null si non renseigné */
  value: number | null;
  color: string;
}

@Component({
  selector: 'epi-bar-chart',
  standalone: true,
  template: `
    <div
      data-testid="bar-list"
      class="bar-chart"
      role="list"
    >
      @for (bar of bars(); track bar.label) {
        <div
          data-testid="bar-row"
          class="bar-chart__row"
          role="listitem"
        >
          <span data-testid="bar-label" class="bar-chart__label">{{ bar.label }}</span>

          <div class="bar-chart__track">
            <div
              data-testid="bar-fill"
              class="bar-chart__fill"
              role="progressbar"
              [attr.aria-valuenow]="bar.value ?? 0"
              [attr.aria-valuemin]="0"
              [attr.aria-valuemax]="max()"
              [attr.aria-label]="bar.label + ' : ' + (bar.value ?? 'non noté')"
              [style.width]="fillWidth(bar.value)"
              [style.background]="bar.color"
            ></div>
          </div>

          <span data-testid="bar-value" class="bar-chart__value">
            {{ bar.value !== null ? bar.value : '—' }}
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 12px);
    }

    .bar-chart__row {
      display: grid;
      grid-template-columns: 10rem 1fr 2.5rem;
      align-items: center;
      gap: var(--space-3, 12px);
    }

    .bar-chart__label {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #4A4A6A);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-chart__track {
      background: var(--color-surface-alt, #F0F0F8);
      border-radius: var(--radius-full, 9999px);
      height: 10px;
      overflow: hidden;
    }

    .bar-chart__fill {
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      transition: width 0.4s ease;
    }

    .bar-chart__value {
      font-size: var(--text-sm, 0.875rem);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--color-text, #1A1A2E);
      text-align: right;
    }
  `],
})
export class BarChart {
  readonly bars = input.required<BarItem[]>();
  readonly max  = input<number>(100);

  fillWidth(value: number | null): string {
    if (value === null) return '0%';
    const pct = Math.min(100, (value / this.max()) * 100);
    return `${pct}%`;
  }
}
