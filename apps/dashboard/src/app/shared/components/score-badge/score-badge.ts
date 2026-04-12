import { Component, input, computed } from '@angular/core';

type EsgTier = 'high' | 'medium' | 'low' | 'na';

@Component({
  selector: 'epi-score-badge',
  standalone: true,
  template: `
    <span
      data-testid="score-badge"
      class="score-badge"
      [class.score-badge--high]="tier() === 'high'"
      [class.score-badge--medium]="tier() === 'medium'"
      [class.score-badge--low]="tier() === 'low'"
      [class.score-badge--na]="tier() === 'na'"
      [attr.aria-label]="ariaLabel()"
    >
      {{ displayValue() }}
      @if (label()) {
        <span data-testid="score-label" class="score-badge__label">{{ label() }}</span>
      }
    </span>
  `,
  styles: [`
    .score-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-1, 4px) var(--space-2, 8px);
      border-radius: var(--radius-full, 9999px);
      font-size: var(--text-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: var(--font-mono, monospace);
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .score-badge--high {
      color: var(--color-esg-high, #15803d);
      background: var(--color-esg-high-bg, #f0fdf4);
      border-color: var(--color-esg-high-border, #bbf7d0);
    }

    .score-badge--medium {
      color: var(--color-esg-medium, #b45309);
      background: var(--color-esg-medium-bg, #fffbeb);
      border-color: var(--color-esg-medium-border, #fbbf24);
    }

    .score-badge--low {
      color: var(--color-esg-low, #b91c1c);
      background: var(--color-esg-low-bg, #fef2f2);
      border-color: var(--color-esg-low-border, #f87171);
    }

    .score-badge--na {
      color: var(--color-esg-na, #6a6a8a);
      background: var(--color-esg-na-bg, #f0f0f8);
      border-color: var(--color-esg-na-border, #c5c5d8);
    }

    .score-badge__label {
      font-family: var(--font-sans, sans-serif);
      font-weight: var(--font-weight-medium, 500);
    }
  `],
})
export class ScoreBadge {
  score = input.required<number | null>();
  label = input<string | undefined>(undefined);

  tier = computed<EsgTier>(() => {
    const s = this.score();
    if (s === null) return 'na';
    if (s >= 70) return 'high';
    if (s >= 40) return 'medium';
    return 'low';
  });

  displayValue = computed(() => {
    const s = this.score();
    if (s === null) return '—';
    return Math.round(s).toString();
  });

  ariaLabel = computed(() => {
    const lbl = this.label();
    const s = this.score();
    const val = s === null ? 'N/A' : `${Math.round(s)}`;
    return lbl ? `${lbl} : ${val}` : `Score ESG : ${val}`;
  });
}
