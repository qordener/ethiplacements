import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EsgLabelBadge, EsgLabel } from './esg-label-badge';

describe('EsgLabelBadge', () => {
  let fixture: ComponentFixture<EsgLabelBadge>;

  async function setup(labels: EsgLabel[] = []) {
    await TestBed.configureTestingModule({
      imports: [EsgLabelBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(EsgLabelBadge);
    fixture.componentRef.setInput('labels', labels);
    fixture.detectChanges();
  }

  it('should render nothing when there are no labels', async () => {
    await setup([]);
    const badges = fixture.nativeElement.querySelector('[data-testid="esg-label-badges"]');
    expect(badges).toBeNull();
  });

  it('should render one badge per label', async () => {
    await setup([
      { label: 'ISR', source: 'Banque de France', asOfDate: '2026-06-30T00:00:00.000Z' },
      { label: 'GREENFIN', source: 'Banque de France', asOfDate: '2026-06-30T00:00:00.000Z' },
    ]);
    const badges = fixture.nativeElement.querySelectorAll('[data-testid="esg-label-badge"]');
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toContain('ISR');
    expect(badges[1].textContent).toContain('GREENFIN');
  });

  it('should include the source and formatted date in the badge title', async () => {
    await setup([{ label: 'ISR', source: 'Banque de France', asOfDate: '2026-06-30T00:00:00.000Z' }]);
    const badge = fixture.nativeElement.querySelector('[data-testid="esg-label-badge"]');
    expect(badge.getAttribute('title')).toContain('Banque de France');
    expect(badge.getAttribute('title')).toContain('30/06/2026');
  });
});
