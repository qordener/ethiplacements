import { Component, computed, input } from '@angular/core';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

type CeilingTier = 'ok' | 'warning' | 'danger';

@Component({
  selector: 'epi-pea-ceiling-gauge',
  standalone: true,
  imports: [InfoTooltip],
  template: `
    <div data-testid="pea-ceiling-gauge" class="pea-gauge">
      <div class="pea-gauge__header">
        <span class="pea-gauge__label">
          Plafond de versement PEA
          <epi-info-tooltip text="Le PEA est plafonné à 150 000 € de versements cumulés — ce plafond porte sur l'argent que vous déposez, pas sur la valeur de votre portefeuille. Vendre puis racheter un actif à l'intérieur du PEA ne compte pas comme un nouveau versement." />
        </span>
        <span data-testid="pea-ceiling-value" class="pea-gauge__value">
          {{ formattedDeposited() }} / {{ formattedCeiling() }}
        </span>
      </div>

      <div
        data-testid="pea-ceiling-track"
        class="pea-gauge__track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="clampedPercentage()"
        [attr.aria-label]="ariaLabel()"
      >
        <div
          data-testid="pea-ceiling-fill"
          class="pea-gauge__fill"
          [class.pea-gauge__fill--warning]="tier() === 'warning'"
          [class.pea-gauge__fill--danger]="tier() === 'danger'"
          [style.width.%]="clampedPercentage()"
        ></div>
      </div>

      <span data-testid="pea-ceiling-remaining" class="pea-gauge__remaining">
        {{ formattedRemaining() }} restants avant le plafond
      </span>
    </div>
  `,
  styles: [`
    .pea-gauge {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    .pea-gauge__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2, 8px);
    }

    .pea-gauge__label {
      font-size: var(--text-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-subtle, #6a6a8a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
    }

    .pea-gauge__value {
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: var(--font-mono, monospace);
      color: var(--color-text, #1a1a2e);
      white-space: nowrap;
    }

    .pea-gauge__track {
      height: 10px;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-surface-alt, #f0f0f8);
      overflow: hidden;
    }

    .pea-gauge__fill {
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-gain, #15803d);
      transition: width var(--transition-slow, 0.25s ease);
    }

    .pea-gauge__fill--warning { background: var(--color-warning, #d97706); }
    .pea-gauge__fill--danger  { background: var(--color-loss, #dc2626); }

    .pea-gauge__remaining {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #4a4a6a);
    }
  `],
})
export class PeaCeilingGauge {
  totalDeposited = input.required<number>();
  ceiling = input.required<number>();

  percentage = computed(() => {
    const ceiling = this.ceiling();
    if (ceiling <= 0) return 0;
    return (this.totalDeposited() / ceiling) * 100;
  });

  clampedPercentage = computed(() => Math.min(100, Math.max(0, this.percentage())));

  remaining = computed(() => Math.max(0, this.ceiling() - this.totalDeposited()));

  tier = computed<CeilingTier>(() => {
    const pct = this.percentage();
    if (pct >= 90) return 'danger';
    if (pct >= 75) return 'warning';
    return 'ok';
  });

  formattedDeposited = computed(() => this.formatEur(this.totalDeposited()));
  formattedCeiling = computed(() => this.formatEur(this.ceiling()));
  formattedRemaining = computed(() => this.formatEur(this.remaining()));

  ariaLabel = computed(() =>
    `Versements PEA : ${this.formattedDeposited()} sur ${this.formattedCeiling()}, soit ${Math.round(this.percentage())} % du plafond`
  );

  private formatEur(value: number): string {
    return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }
}
