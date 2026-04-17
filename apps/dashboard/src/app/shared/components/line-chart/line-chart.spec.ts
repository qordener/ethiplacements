import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChart, LinePoint } from './line-chart';

const POINTS_2: LinePoint[] = [
  { date: '2026-04-01', value: 1000 },
  { date: '2026-04-30', value: 1500 },
];

const POINTS_5: LinePoint[] = [
  { date: '2026-04-01', value: 1000 },
  { date: '2026-04-08', value: 1100 },
  { date: '2026-04-15', value: 950 },
  { date: '2026-04-22', value: 1200 },
  { date: '2026-04-29', value: 1500 },
];

describe('LineChart', () => {
  let fixture: ComponentFixture<LineChart>;

  async function setup(points: LinePoint[] = POINTS_2, ariaLabel?: string) {
    await TestBed.configureTestingModule({ imports: [LineChart] }).compileComponents();
    fixture = TestBed.createComponent(LineChart);
    fixture.componentRef.setInput('points', points);
    if (ariaLabel) fixture.componentRef.setInput('ariaLabel', ariaLabel);
    fixture.detectChanges();
  }

  // ─── État vide ────────────────────────────────────────────────────────────

  describe('état vide (moins de 2 points)', () => {
    it('should show empty state when points array is empty', async () => {
      await setup([]);
      const empty = fixture.nativeElement.querySelector('[data-testid="line-chart-empty"]');
      expect(empty).toBeTruthy();
    });

    it('should show empty state when only one point', async () => {
      await setup([{ date: '2026-04-01', value: 1000 }]);
      const empty = fixture.nativeElement.querySelector('[data-testid="line-chart-empty"]');
      expect(empty).toBeTruthy();
    });

    it('should not render SVG when empty', async () => {
      await setup([]);
      const svg = fixture.nativeElement.querySelector('[data-testid="line-chart-svg"]');
      expect(svg).toBeNull();
    });
  });

  // ─── Rendu SVG ────────────────────────────────────────────────────────────

  describe('rendu SVG', () => {
    it('should render SVG when 2+ points', async () => {
      await setup(POINTS_2);
      const svg = fixture.nativeElement.querySelector('[data-testid="line-chart-svg"]');
      expect(svg).toBeTruthy();
    });

    it('should render the line path', async () => {
      await setup(POINTS_2);
      const line = fixture.nativeElement.querySelector('[data-testid="line-chart-line"]');
      expect(line).toBeTruthy();
      expect(line.getAttribute('d')).toContain('M');
      expect(line.getAttribute('d')).toContain('L');
    });

    it('should render the area fill path', async () => {
      await setup(POINTS_2);
      const area = fixture.nativeElement.querySelector('[data-testid="line-chart-area"]');
      expect(area).toBeTruthy();
      expect(area.getAttribute('d')).toContain('Z'); // chemin fermé
    });

    it('should not render empty state when SVG is shown', async () => {
      await setup(POINTS_2);
      const empty = fixture.nativeElement.querySelector('[data-testid="line-chart-empty"]');
      expect(empty).toBeNull();
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should set role="img" on SVG', async () => {
      await setup(POINTS_2);
      const svg = fixture.nativeElement.querySelector('[data-testid="line-chart-svg"]');
      expect(svg.getAttribute('role')).toBe('img');
    });

    it('should apply the ariaLabel input as aria-label', async () => {
      await setup(POINTS_2, 'Évolution du portefeuille');
      const svg = fixture.nativeElement.querySelector('[data-testid="line-chart-svg"]');
      expect(svg.getAttribute('aria-label')).toBe('Évolution du portefeuille');
    });

    it('should have a default aria-label', async () => {
      await setup(POINTS_2);
      const svg = fixture.nativeElement.querySelector('[data-testid="line-chart-svg"]');
      expect(svg.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ─── Mises à jour réactives ───────────────────────────────────────────────

  describe('réactivité', () => {
    it('should switch to empty state when points drop below 2', async () => {
      await setup(POINTS_5);
      expect(fixture.nativeElement.querySelector('[data-testid="line-chart-svg"]')).toBeTruthy();

      fixture.componentRef.setInput('points', []);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="line-chart-empty"]')).toBeTruthy();
    });

    it('should update line path when points change', async () => {
      await setup(POINTS_2);
      const pathBefore = fixture.nativeElement.querySelector('[data-testid="line-chart-line"]').getAttribute('d');

      fixture.componentRef.setInput('points', POINTS_5);
      fixture.detectChanges();

      const pathAfter = fixture.nativeElement.querySelector('[data-testid="line-chart-line"]').getAttribute('d');
      expect(pathAfter).not.toBe(pathBefore);
    });
  });
});
