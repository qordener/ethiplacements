import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChart, BarItem } from './bar-chart';

const MOCK_BARS: BarItem[] = [
  { label: 'Danone',         value: 75,   color: '#2D6A4F' },
  { label: 'Engie',          value: 55,   color: '#F4A261' },
  { label: 'TotalEnergies',  value: 22,   color: '#E76F51' },
  { label: 'Tesla',          value: null, color: '#ADB5BD' },
];

describe('BarChart', () => {
  let fixture: ComponentFixture<BarChart>;
  let component: BarChart;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChart);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('bars', MOCK_BARS);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('structure', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('bars', MOCK_BARS);
      fixture.detectChanges();
    });

    it('should render one row per bar', () => {
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="bar-row"]');
      expect(rows).toHaveLength(4);
    });

    it('should display the label in each row', () => {
      const labels = fixture.nativeElement.querySelectorAll('[data-testid="bar-label"]');
      expect(labels[0].textContent.trim()).toBe('Danone');
      expect(labels[1].textContent.trim()).toBe('Engie');
    });

    it('should display the numeric value for bars with a score', () => {
      const values = fixture.nativeElement.querySelectorAll('[data-testid="bar-value"]');
      expect(values[0].textContent.trim()).toBe('75');
      expect(values[1].textContent.trim()).toBe('55');
    });

    it('should display "—" for bars with a null value', () => {
      const values = fixture.nativeElement.querySelectorAll('[data-testid="bar-value"]');
      expect(values[3].textContent.trim()).toBe('—');
    });

    it('should render a fill element for each bar', () => {
      const fills = fixture.nativeElement.querySelectorAll('[data-testid="bar-fill"]');
      expect(fills).toHaveLength(4);
    });
  });

  describe('couleurs', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('bars', MOCK_BARS);
      fixture.detectChanges();
    });

    it('should apply the bar color to the fill element', () => {
      const fills = fixture.nativeElement.querySelectorAll('[data-testid="bar-fill"]');
      expect(fills[0].style.background).toBe('rgb(45, 106, 79)');
      expect(fills[2].style.background).toBe('rgb(231, 111, 81)');
    });
  });

  describe('largeur des barres', () => {
    it('should set fill width proportional to value / max (default 100)', () => {
      fixture.componentRef.setInput('bars', [{ label: 'A', value: 50, color: '#000' }]);
      fixture.detectChanges();
      const fill = fixture.nativeElement.querySelector('[data-testid="bar-fill"]');
      expect(fill.style.width).toBe('50%');
    });

    it('should respect a custom max input', () => {
      fixture.componentRef.setInput('bars', [{ label: 'A', value: 50, color: '#000' }]);
      fixture.componentRef.setInput('max', 200);
      fixture.detectChanges();
      const fill = fixture.nativeElement.querySelector('[data-testid="bar-fill"]');
      expect(fill.style.width).toBe('25%');
    });

    it('should set fill width to 0% for a null value', () => {
      fixture.componentRef.setInput('bars', [{ label: 'A', value: null, color: '#ADB5BD' }]);
      fixture.detectChanges();
      const fill = fixture.nativeElement.querySelector('[data-testid="bar-fill"]');
      expect(fill.style.width).toBe('0%');
    });
  });

  describe('accessibilité', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('bars', MOCK_BARS);
      fixture.detectChanges();
    });

    it('should have role="list" on the container', () => {
      const list = fixture.nativeElement.querySelector('[data-testid="bar-list"]');
      expect(list.getAttribute('role')).toBe('list');
    });

    it('should have role="listitem" on each row', () => {
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="bar-row"]');
      rows.forEach((row: Element) => {
        expect(row.getAttribute('role')).toBe('listitem');
      });
    });

    it('should expose aria-valuenow on the fill track', () => {
      const fills = fixture.nativeElement.querySelectorAll('[data-testid="bar-fill"]');
      expect(fills[0].getAttribute('aria-valuenow')).toBe('75');
    });

    it('should expose aria-valuemax on the fill track', () => {
      const fills = fixture.nativeElement.querySelectorAll('[data-testid="bar-fill"]');
      expect(fills[0].getAttribute('aria-valuemax')).toBe('100');
    });
  });

  describe('cas limites', () => {
    it('should render nothing when bars is empty', () => {
      fixture.componentRef.setInput('bars', []);
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="bar-row"]');
      expect(rows).toHaveLength(0);
    });

    it('should cap fill width at 100% when value exceeds max', () => {
      fixture.componentRef.setInput('bars', [{ label: 'A', value: 150, color: '#000' }]);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();
      const fill = fixture.nativeElement.querySelector('[data-testid="bar-fill"]');
      expect(fill.style.width).toBe('100%');
    });
  });
});
