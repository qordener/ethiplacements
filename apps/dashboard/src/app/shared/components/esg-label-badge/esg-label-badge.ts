import { Component, input } from '@angular/core';

export interface EsgLabel {
  label: string;
  source: string;
  asOfDate: string;
}

@Component({
  selector: 'epi-esg-label-badge',
  standalone: true,
  template: `
    @if (labels().length > 0) {
      <span data-testid="esg-label-badges" class="esg-label-badges">
        @for (l of labels(); track l.label) {
          <span
            data-testid="esg-label-badge"
            class="esg-label-badge"
            [attr.title]="tooltipFor(l)"
          >{{ l.label }}</span>
        }
      </span>
    }
  `,
  styles: [`
    .esg-label-badges {
      display: inline-flex;
      gap: var(--space-1, 4px);
      flex-wrap: wrap;
    }

    .esg-label-badge {
      display: inline-block;
      font-size: var(--text-xs, 0.75rem);
      font-weight: 600;
      letter-spacing: 0.02em;
      padding: 1px var(--space-2, 8px);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-esg-high-bg, #f0fdf4);
      color: var(--color-esg-high, #15803d);
      border: 1px solid var(--color-esg-high-border, #bbf7d0);
      cursor: default;
    }
  `],
})
export class EsgLabelBadge {
  labels = input<EsgLabel[]>([]);

  tooltipFor(l: EsgLabel): string {
    return `Source : ${l.source} — arrêté au ${this.formatDate(l.asOfDate)}`;
  }

  private formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR');
  }
}
