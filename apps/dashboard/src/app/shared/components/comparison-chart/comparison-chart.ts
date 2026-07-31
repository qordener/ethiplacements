import { Component, computed, input } from '@angular/core';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

export interface ComparisonPoint {
  date: string;
  value: number;
}

export interface ComparisonSeries {
  key: string;
  label: string;
  color: string;
  points: ComparisonPoint[];
}

interface RenderedSeries {
  key: string;
  label: string;
  color: string;
  path: string;
  endValue: number;
  endX: number;
  endY: number;
}

const VIEWBOX_W = 800;
const VIEWBOX_H = 260;
const PAD_LEFT = 40;
const PAD_RIGHT = 64;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const CHART_W = VIEWBOX_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = VIEWBOX_H - PAD_TOP - PAD_BOTTOM;

@Component({
  selector: 'epi-comparison-chart',
  standalone: true,
  imports: [InfoTooltip],
  template: `
    @if (renderedSeries().length === 0) {
      <div data-testid="comparison-chart-empty" class="comparison-chart__empty">
        Données insuffisantes pour afficher le comparateur.
      </div>
    } @else {
      <svg
        data-testid="comparison-chart-svg"
        [attr.viewBox]="'0 0 ' + VIEWBOX_W + ' ' + VIEWBOX_H"
        role="img"
        [attr.aria-label]="ariaLabel()"
        class="comparison-chart__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        @for (tick of yTicks(); track tick.y) {
          <line
            [attr.x1]="PAD_LEFT" [attr.x2]="VIEWBOX_W - PAD_RIGHT"
            [attr.y1]="tick.y" [attr.y2]="tick.y"
            class="comparison-chart__grid"
          />
          <text [attr.x]="PAD_LEFT - 6" [attr.y]="tick.y + 4" class="comparison-chart__axis-label" text-anchor="end">
            {{ tick.label }}
          </text>
        }

        @if (baselineY(); as by) {
          <line
            [attr.x1]="PAD_LEFT" [attr.x2]="VIEWBOX_W - PAD_RIGHT"
            [attr.y1]="by" [attr.y2]="by"
            class="comparison-chart__baseline"
          />
        }

        @for (s of renderedSeries(); track s.key) {
          <path
            data-testid="comparison-chart-line"
            [attr.d]="s.path"
            [attr.stroke]="s.color"
            class="comparison-chart__line"
          />
          <circle
            [attr.cx]="s.endX" [attr.cy]="s.endY" r="3.5"
            [attr.fill]="s.color"
            class="comparison-chart__end-dot"
          />
          <text
            data-testid="comparison-chart-end-label"
            [attr.x]="s.endX + 6" [attr.y]="s.endY + 4"
            [attr.fill]="s.color"
            class="comparison-chart__end-label"
          >{{ formatIndex(s.endValue) }}</text>
        }
      </svg>

      <div class="comparison-chart__legend">
        @for (s of series(); track s.key) {
          <span data-testid="comparison-chart-legend-item" class="comparison-chart__legend-item">
            <span class="comparison-chart__legend-swatch" [style.background]="s.color"></span>
            {{ s.label }}
            @if (s.points.length === 0) {
              <span data-testid="comparison-chart-legend-unavailable" class="comparison-chart__legend-unavailable">
                (non disponible)
              </span>
            }
          </span>
        }
        <epi-info-tooltip text="Chaque série est indexée à 100 à son propre premier point disponible, pour comparer des évolutions relatives entre un portefeuille en euros et des indices/ETF en points — pas des valeurs absolues." />
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .comparison-chart__svg {
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .comparison-chart__grid {
      stroke: var(--color-border, #e8e8f0);
      stroke-width: 1;
    }

    .comparison-chart__baseline {
      stroke: var(--color-text-subtle, #6a6a8a);
      stroke-width: 1;
      stroke-dasharray: 3 3;
    }

    .comparison-chart__line {
      fill: none;
      stroke-width: 2;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    .comparison-chart__end-label {
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono, monospace);
    }

    .comparison-chart__axis-label {
      font-size: 10px;
      fill: var(--color-text-subtle, #6a6a8a);
      font-family: var(--font-mono, monospace);
    }

    .comparison-chart__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      color: var(--color-text-subtle, #6a6a8a);
      font-size: var(--text-sm, 0.875rem);
    }

    .comparison-chart__legend {
      display: flex;
      align-items: center;
      gap: var(--space-4, 16px);
      flex-wrap: wrap;
      margin-top: var(--space-3, 12px);
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #4a4a6a);
    }

    .comparison-chart__legend-item {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
    }

    .comparison-chart__legend-swatch {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .comparison-chart__legend-unavailable {
      color: var(--color-text-subtle, #6a6a8a);
      font-style: italic;
    }
  `],
})
export class ComparisonChart {
  readonly VIEWBOX_W = VIEWBOX_W;
  readonly VIEWBOX_H = VIEWBOX_H;
  readonly PAD_LEFT = PAD_LEFT;
  readonly PAD_RIGHT = PAD_RIGHT;

  series    = input.required<ComparisonSeries[]>();
  ariaLabel = input<string>('Comparateur de performance indexée');

  // ─── Alignement des séries sur un axe de dates commun ──────────────────────
  private readonly allDates = computed(() => {
    const set = new Set<string>();
    for (const s of this.series()) {
      for (const p of s.points) set.add(p.date);
    }
    return Array.from(set).sort();
  });

  // Pour chaque série : indexée à 100 sur son propre premier point, valeur
  // reportée (forward-fill) sur les dates suivantes de l'axe commun où elle
  // n'a pas de donnée propre.
  private readonly indexedSeries = computed(() => {
    const dates = this.allDates();
    return this.series()
      .filter((s) => s.points.length >= 2)
      .map((s) => {
        const byDate = new Map(s.points.map((p) => [p.date, p.value]));
        const firstDate = s.points[0].date;
        const base = s.points[0].value;
        const startIdx = dates.indexOf(firstDate);

        let lastKnown = base;
        const values: { idx: number; indexed: number }[] = [];
        for (let i = startIdx; i < dates.length; i++) {
          const raw = byDate.get(dates[i]);
          if (raw !== undefined) lastKnown = raw;
          values.push({ idx: i, indexed: (lastKnown / base) * 100 });
        }

        return { key: s.key, label: s.label, color: s.color, values };
      });
  });

  private readonly yDomain = computed(() => {
    const all = this.indexedSeries().flatMap((s) => s.values.map((v) => v.indexed));
    if (all.length === 0) return { min: 90, max: 110 };
    const min = Math.min(100, ...all);
    const max = Math.max(100, ...all);
    const pad = (max - min) * 0.1 || 5;
    return { min: min - pad, max: max + pad };
  });

  private x(idx: number): number {
    const n = this.allDates().length;
    if (n <= 1) return PAD_LEFT;
    return PAD_LEFT + (idx / (n - 1)) * CHART_W;
  }

  private y(indexed: number): number {
    const { min, max } = this.yDomain();
    if (max === min) return PAD_TOP + CHART_H / 2;
    return PAD_TOP + (1 - (indexed - min) / (max - min)) * CHART_H;
  }

  renderedSeries = computed<RenderedSeries[]>(() =>
    this.indexedSeries().map((s) => {
      const path = s.values
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${this.x(v.idx).toFixed(1)},${this.y(v.indexed).toFixed(1)}`)
        .join(' ');
      const end = s.values[s.values.length - 1];
      return { key: s.key, label: s.label, color: s.color, path, endValue: end.indexed, endX: this.x(end.idx), endY: this.y(end.indexed) };
    })
  );

  baselineY = computed<number | null>(() => {
    if (this.renderedSeries().length === 0) return null;
    const { min, max } = this.yDomain();
    if (100 < min || 100 > max) return null;
    return this.y(100);
  });

  yTicks = computed(() => {
    const { min, max } = this.yDomain();
    const count = 4;
    return Array.from({ length: count }, (_, i) => {
      const fraction = i / (count - 1);
      const value = min + fraction * (max - min);
      return { y: PAD_TOP + (1 - fraction) * CHART_H, label: Math.round(value).toString() };
    });
  });

  formatIndex(v: number): string {
    return v.toFixed(1);
  }
}
