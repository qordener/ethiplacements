import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface DonutSegment {
  label: string;
  /** Valeur en pourcentage (0–100) */
  value: number;
  color: string;
}

interface ComputedSegment extends DonutSegment {
  path: string;
}

const CX = 50;
const CY = 50;
const R  = 40;
const r  = 24;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function arcPath(startDeg: number, endDeg: number): string {
  const start = toRad(startDeg - 90);
  const end   = toRad(endDeg   - 90);

  const x1 = CX + R * Math.cos(start);
  const y1 = CY + R * Math.sin(start);
  const x2 = CX + R * Math.cos(end);
  const y2 = CY + R * Math.sin(end);
  const x3 = CX + r * Math.cos(end);
  const y3 = CY + r * Math.sin(end);
  const x4 = CX + r * Math.cos(start);
  const y4 = CY + r * Math.sin(start);

  const large = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${x1.toFixed(3)} ${y1.toFixed(3)}`,
    `A ${R} ${R} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`,
    `L ${x3.toFixed(3)} ${y3.toFixed(3)}`,
    `A ${r} ${r} 0 ${large} 0 ${x4.toFixed(3)} ${y4.toFixed(3)}`,
    'Z',
  ].join(' ');
}

@Component({
  selector: 'epi-donut-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <figure
      class="donut-chart"
      [attr.aria-label]="ariaLabel()"
    >
      <svg
        viewBox="0 0 100 100"
        role="img"
        class="donut-chart__svg"
        aria-hidden="true"
      >
        @for (seg of computedSegments(); track seg.label) {
          <path
            data-testid="donut-slice"
            [attr.d]="seg.path"
            [attr.fill]="seg.color"
            class="donut-chart__slice"
          />
        }

        @if (centerLabel()) {
          <text
            data-testid="donut-center-label"
            x="50" y="53"
            text-anchor="middle"
            class="donut-chart__center-label"
          >{{ centerLabel() }}</text>
        }
      </svg>

      <figcaption class="donut-chart__legend">
        @for (seg of computedSegments(); track seg.label) {
          <div data-testid="donut-legend-item" class="donut-chart__legend-item">
            <span
              data-testid="donut-legend-dot"
              class="donut-chart__legend-dot"
              [style.background]="seg.color"
            ></span>
            <span class="donut-chart__legend-label">{{ seg.label }}</span>
            <span class="donut-chart__legend-value">{{ seg.value | number:'1.0-1' }} %</span>
          </div>
        }
      </figcaption>
    </figure>
  `,
  styles: [`
    .donut-chart {
      display: flex;
      align-items: center;
      gap: var(--space-6, 24px);
      margin: 0;
    }

    .donut-chart__svg {
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }

    .donut-chart__slice {
      transition: opacity 0.15s ease;
    }
    .donut-chart__slice:hover { opacity: 0.85; }

    .donut-chart__center-label {
      font-size: 8px;
      fill: var(--color-text-muted, #4A4A6A);
    }

    .donut-chart__legend {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    .donut-chart__legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text, #1A1A2E);
    }

    .donut-chart__legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .donut-chart__legend-label {
      flex: 1;
      color: var(--color-text-muted, #4A4A6A);
    }

    .donut-chart__legend-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      min-width: 3.5rem;
      text-align: right;
    }
  `],
})
export class DonutChart {
  readonly segments   = input.required<DonutSegment[]>();
  readonly centerLabel = input<string | null>(null);
  readonly ariaLabel   = input<string>('Graphique en anneau');

  readonly computedSegments = computed<ComputedSegment[]>(() => {
    const segs = this.segments();
    if (!segs.length) return [];

    const total = segs.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return [];

    let cursor = 0;
    return segs.map((seg) => {
      const pct        = (seg.value / total) * 100;
      const startDeg   = (cursor / total) * 360;
      const endDeg     = startDeg + (seg.value / total) * 360;
      cursor          += seg.value;

      // Cas spécial : segment unique (360°) — deux demi-arcs
      let path: string;
      if (segs.length === 1) {
        path = arcPath(0, 180) + ' ' + arcPath(180, 359.999);
      } else {
        path = arcPath(startDeg, endDeg);
      }

      return { ...seg, value: pct, path };
    });
  });
}
