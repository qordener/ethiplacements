import { Component, computed, input } from '@angular/core';

export interface LinePoint {
  date: string;   // YYYY-MM-DD
  value: number;
}

const VIEWBOX_W = 600;
const VIEWBOX_H = 200;
const PAD_LEFT = 70;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 36;

@Component({
  selector: 'epi-line-chart',
  standalone: true,
  template: `
    @if (points().length < 2) {
      <div data-testid="line-chart-empty" class="line-chart__empty">
        Données insuffisantes pour afficher le graphique.
      </div>
    } @else {
      <svg
        data-testid="line-chart-svg"
        [attr.viewBox]="'0 0 ' + W + ' ' + H"
        [attr.aria-label]="ariaLabel()"
        role="img"
        class="line-chart__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Grille horizontale -->
        @for (tick of yTicks(); track tick.y) {
          <line
            [attr.x1]="PAD_LEFT"
            [attr.x2]="W - PAD_RIGHT"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
            class="line-chart__grid"
          />
          <text
            [attr.x]="PAD_LEFT - 6"
            [attr.y]="tick.y + 4"
            class="line-chart__axis-label"
            text-anchor="end"
          >{{ tick.label }}</text>
        }

        <!-- Zone de remplissage sous la courbe -->
        <path
          data-testid="line-chart-area"
          [attr.d]="areaPath()"
          class="line-chart__area"
        />

        <!-- Courbe principale -->
        <path
          data-testid="line-chart-line"
          [attr.d]="linePath()"
          class="line-chart__line"
        />

        <!-- Labels dates (premier et dernier) -->
        <text
          [attr.x]="PAD_LEFT"
          [attr.y]="H - 6"
          class="line-chart__axis-label"
          text-anchor="middle"
        >{{ firstDate() }}</text>
        <text
          [attr.x]="W - PAD_RIGHT"
          [attr.y]="H - 6"
          class="line-chart__axis-label"
          text-anchor="end"
        >{{ lastDate() }}</text>
      </svg>
    }
  `,
  styles: [`
    :host { display: block; }

    .line-chart__svg {
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .line-chart__grid {
      stroke: var(--color-border, #e8e8f0);
      stroke-width: 1;
    }

    .line-chart__line {
      fill: none;
      stroke: var(--color-primary, #2D6A4F);
      stroke-width: 2.5;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    .line-chart__area {
      fill: var(--color-primary, #2D6A4F);
      opacity: 0.12;
    }

    .line-chart__axis-label {
      font-size: 10px;
      fill: var(--color-text-subtle, #6a6a8a);
      font-family: var(--font-mono, monospace);
    }

    .line-chart__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      color: var(--color-text-subtle, #6a6a8a);
      font-size: var(--text-sm, 0.875rem);
    }
  `],
})
export class LineChart {
  readonly W = VIEWBOX_W;
  readonly H = VIEWBOX_H;
  readonly PAD_LEFT = PAD_LEFT;
  readonly PAD_RIGHT = PAD_RIGHT;

  points    = input.required<LinePoint[]>();
  ariaLabel = input<string>('Graphique de performance');

  private readonly chartW = VIEWBOX_W - PAD_LEFT - PAD_RIGHT;
  private readonly chartH = VIEWBOX_H - PAD_TOP - PAD_BOTTOM;

  private readonly minMax = computed(() => {
    const vals = this.points().map(p => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    // Padding vertical de 5% pour que la courbe ne touche pas les bords
    const pad = (max - min) * 0.05 || max * 0.05 || 1;
    return { min: min - pad, max: max + pad };
  });

  private readonly coords = computed(() => {
    const pts = this.points();
    const { min, max } = this.minMax();
    const n = pts.length;
    return pts.map((p, i) => ({
      x: PAD_LEFT + (i / (n - 1)) * this.chartW,
      y: PAD_TOP + (1 - (p.value - min) / (max - min)) * this.chartH,
    }));
  });

  linePath = computed(() => {
    const pts = this.coords();
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  areaPath = computed(() => {
    const pts = this.coords();
    if (pts.length < 2) return '';
    const base = PAD_TOP + this.chartH;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return `${line} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`;
  });

  yTicks = computed(() => {
    const { min, max } = this.minMax();
    const count = 4;
    return Array.from({ length: count }, (_, i) => {
      const fraction = i / (count - 1);
      const value = min + fraction * (max - min);
      const y = PAD_TOP + (1 - fraction) * this.chartH;
      return { y, label: this.formatValue(value) };
    });
  });

  firstDate = computed(() =>
    this.points().length > 0 ? this.formatDate(this.points()[0].date) : ''
  );

  lastDate = computed(() =>
    this.points().length > 0 ? this.formatDate(this.points()[this.points().length - 1].date) : ''
  );

  private formatValue(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toFixed(0);
  }

  private formatDate(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }
}
