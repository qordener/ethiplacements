import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparisonChart, ComparisonSeries } from './comparison-chart';

describe('ComparisonChart', () => {
  let fixture: ComponentFixture<ComparisonChart>;

  async function setup(series: ComparisonSeries[]) {
    await TestBed.configureTestingModule({
      imports: [ComparisonChart],
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonChart);
    fixture.componentRef.setInput('series', series);
    fixture.detectChanges();
  }

  const PORTFOLIO: ComparisonSeries = {
    key: 'portfolio',
    label: 'Portefeuille',
    color: '#1b7a4d',
    points: [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-03', value: 1100 },
    ],
  };

  const CAC40: ComparisonSeries = {
    key: 'cac40',
    label: 'CAC 40',
    color: '#2563eb',
    points: [
      { date: '2026-01-01', value: 7500 },
      { date: '2026-01-02', value: 7550 },
      { date: '2026-01-03', value: 7600 },
    ],
  };

  it('should show the empty state when all series are empty', async () => {
    await setup([{ ...PORTFOLIO, points: [] }, { ...CAC40, points: [] }]);
    const empty = fixture.nativeElement.querySelector('[data-testid="comparison-chart-empty"]');
    expect(empty).toBeTruthy();
  });

  it('should show the empty state when every series has fewer than 2 points', async () => {
    await setup([{ ...PORTFOLIO, points: [{ date: '2026-01-01', value: 1000 }] }]);
    const empty = fixture.nativeElement.querySelector('[data-testid="comparison-chart-empty"]');
    expect(empty).toBeTruthy();
  });

  it('should render the chart when at least one series has 2+ points', async () => {
    await setup([{ ...PORTFOLIO, points: [] }, CAC40]);
    const svg = fixture.nativeElement.querySelector('[data-testid="comparison-chart-svg"]');
    expect(svg).toBeTruthy();
  });

  it('should render one line path per non-empty series', async () => {
    await setup([PORTFOLIO, CAC40]);
    const paths = fixture.nativeElement.querySelectorAll('[data-testid="comparison-chart-line"]');
    expect(paths).toHaveLength(2);
  });

  it('should skip series with no data points entirely', async () => {
    await setup([PORTFOLIO, CAC40, { key: 'msciWorldSri', label: 'MSCI World SRI', color: '#b45309', points: [] }]);
    const paths = fixture.nativeElement.querySelectorAll('[data-testid="comparison-chart-line"]');
    expect(paths).toHaveLength(2);
  });

  it('should index every series to 100 at its own first point', async () => {
    await setup([PORTFOLIO, CAC40]);
    const endLabels = fixture.nativeElement.querySelectorAll('[data-testid="comparison-chart-end-label"]');
    // Portfolio: 1000 -> 1100 = index 110. CAC40: 7500 -> 7600 = index ~101.3
    const texts = Array.from(endLabels).map((el) => (el as HTMLElement).textContent);
    expect(texts.some((t) => t?.includes('110'))).toBe(true);
    expect(texts.some((t) => t?.includes('101'))).toBe(true);
  });

  it('should show a legend entry for every series, including empty ones', async () => {
    await setup([PORTFOLIO, CAC40, { key: 'msciWorldSri', label: 'MSCI World SRI', color: '#b45309', points: [] }]);
    const legendItems = fixture.nativeElement.querySelectorAll('[data-testid="comparison-chart-legend-item"]');
    expect(legendItems).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('MSCI World SRI');
  });

  it('should mark the legend entry as unavailable for an empty series', async () => {
    await setup([PORTFOLIO, { key: 'msciWorldSri', label: 'MSCI World SRI', color: '#b45309', points: [] }]);
    const unavailable = fixture.nativeElement.querySelector('[data-testid="comparison-chart-legend-unavailable"]');
    expect(unavailable).toBeTruthy();
    expect(unavailable.textContent).toContain('non disponible');
  });
});
