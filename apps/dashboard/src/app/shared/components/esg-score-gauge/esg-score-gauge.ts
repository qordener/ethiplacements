import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EsgLabel = 'Insuffisant' | 'Moyen' | 'Élevé' | 'Exemplaire';
export type EsgColorClass = 'esg-danger' | 'esg-warning' | 'esg-success' | 'esg-primary';

@Component({
  selector: 'app-esg-score-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="esg-gauge"
      data-testid="esg-gauge"
      [attr.aria-label]="ariaLabel()"
    >
      <span
        class="esg-label"
        data-testid="esg-label"
        [class]="colorClass()"
      >{{ label() }}</span>

      <span class="esg-score" data-testid="esg-score">{{ score() }}/100</span>

      <span class="esg-provider" data-testid="esg-provider">{{ provider() }}</span>
    </div>
  `,
  styles: [`
    .esg-gauge {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-family: var(--font-sans, Inter, system-ui, sans-serif);
    }
    .esg-label {
      font-size: 14px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .esg-label.esg-danger  { color: var(--color-danger, #E76F51); }
    .esg-label.esg-warning { color: var(--color-warning, #E9C46A); }
    .esg-label.esg-success { color: var(--color-success, #40916C); }
    .esg-label.esg-primary { color: var(--color-primary, #2D6A4F); }
    .esg-score, .esg-provider {
      font-size: 12px;
      color: var(--color-neutral-600, #4A4A6A);
    }
  `],
})
export class EsgScoreGauge {
  score = input.required<number>();
  provider = input.required<string>();
  updatedAt = input.required<string>();

  label = computed<EsgLabel>(() => {
    const s = this.score();
    if (s >= 80) return 'Exemplaire';
    if (s >= 60) return 'Élevé';
    if (s >= 40) return 'Moyen';
    return 'Insuffisant';
  });

  colorClass = computed<EsgColorClass>(() => {
    const s = this.score();
    if (s >= 80) return 'esg-primary';
    if (s >= 60) return 'esg-success';
    if (s >= 40) return 'esg-warning';
    return 'esg-danger';
  });

  ariaLabel = computed(() => `Score ESG : ${this.score()}/100 — ${this.label()} (${this.provider()})`);
}
