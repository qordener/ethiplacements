import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonutChart, DonutSegment } from './donut-chart';

const MOCK_SEGMENTS: DonutSegment[] = [
  { label: 'Actions',     value: 50, color: '#2D6A4F' },
  { label: 'Obligations', value: 30, color: '#40916C' },
  { label: 'ETF',         value: 20, color: '#52B788' },
];

describe('DonutChart', () => {
  let fixture: ComponentFixture<DonutChart>;
  let component: DonutChart;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChart],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChart);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('segments', MOCK_SEGMENTS);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('SVG', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('segments', MOCK_SEGMENTS);
      fixture.detectChanges();
    });

    it('should render an SVG element', () => {
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render one path per segment', () => {
      const paths = fixture.nativeElement.querySelectorAll('[data-testid="donut-slice"]');
      expect(paths).toHaveLength(3);
    });

    it('should apply the correct fill color to each slice', () => {
      const paths = fixture.nativeElement.querySelectorAll('[data-testid="donut-slice"]');
      expect(paths[0].getAttribute('fill')).toBe('#2D6A4F');
      expect(paths[1].getAttribute('fill')).toBe('#40916C');
      expect(paths[2].getAttribute('fill')).toBe('#52B788');
    });

    it('should render a center label when provided', () => {
      fixture.componentRef.setInput('centerLabel', 'Total');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('[data-testid="donut-center-label"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Total');
    });

    it('should not render center label when not provided', () => {
      const label = fixture.nativeElement.querySelector('[data-testid="donut-center-label"]');
      expect(label).toBeNull();
    });
  });

  describe('légende', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('segments', MOCK_SEGMENTS);
      fixture.detectChanges();
    });

    it('should render one legend item per segment', () => {
      const items = fixture.nativeElement.querySelectorAll('[data-testid="donut-legend-item"]');
      expect(items).toHaveLength(3);
    });

    it('should display the label in each legend item', () => {
      const items = fixture.nativeElement.querySelectorAll('[data-testid="donut-legend-item"]');
      expect(items[0].textContent).toContain('Actions');
      expect(items[1].textContent).toContain('Obligations');
      expect(items[2].textContent).toContain('ETF');
    });

    it('should display the percentage in each legend item', () => {
      const items = fixture.nativeElement.querySelectorAll('[data-testid="donut-legend-item"]');
      expect(items[0].textContent).toContain('50');
      expect(items[1].textContent).toContain('30');
      expect(items[2].textContent).toContain('20');
    });

    it('should apply the segment color to the legend dot', () => {
      const dots = fixture.nativeElement.querySelectorAll('[data-testid="donut-legend-dot"]');
      expect(dots[0].style.background).toBe('rgb(45, 106, 79)');
    });
  });

  describe('accessibilité', () => {
    it('should expose an aria-label on the figure', () => {
      fixture.componentRef.setInput('segments', MOCK_SEGMENTS);
      fixture.componentRef.setInput('ariaLabel', 'Répartition par type d\'actif');
      fixture.detectChanges();
      const figure = fixture.nativeElement.querySelector('figure');
      expect(figure.getAttribute('aria-label')).toBe('Répartition par type d\'actif');
    });

    it('should use role="img" on the SVG', () => {
      fixture.componentRef.setInput('segments', MOCK_SEGMENTS);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('role')).toBe('img');
    });
  });

  describe('cas limites', () => {
    it('should render nothing when segments is empty', () => {
      fixture.componentRef.setInput('segments', []);
      fixture.detectChanges();
      const paths = fixture.nativeElement.querySelectorAll('[data-testid="donut-slice"]');
      expect(paths).toHaveLength(0);
    });

    it('should handle a single segment (100%)', () => {
      fixture.componentRef.setInput('segments', [{ label: 'Actions', value: 100, color: '#2D6A4F' }]);
      fixture.detectChanges();
      const paths = fixture.nativeElement.querySelectorAll('[data-testid="donut-slice"]');
      expect(paths).toHaveLength(1);
    });
  });
});
