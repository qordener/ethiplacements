import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  let fixture: ComponentFixture<MetricCard>;

  async function setup(overrides: {
    label?: string;
    value?: string | number;
    trend?: 'positive' | 'negative' | 'neutral' | null;
    sublabel?: string | null;
  } = {}) {
    await TestBed.configureTestingModule({
      imports: [MetricCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('label', overrides.label ?? 'Valeur actuelle');
    fixture.componentRef.setInput('value', overrides.value ?? '3 100 €');
    if (overrides.trend !== undefined) fixture.componentRef.setInput('trend', overrides.trend);
    if (overrides.sublabel !== undefined) fixture.componentRef.setInput('sublabel', overrides.sublabel);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(fixture.nativeElement.querySelector('[data-testid="metric-card"]')).toBeTruthy();
  });

  // ─── Affichage basique ────────────────────────────────────────────────────────

  describe('affichage', () => {
    it('should display the label', async () => {
      await setup({ label: 'Investi' });
      const label = fixture.nativeElement.querySelector('[data-testid="metric-label"]');
      expect(label.textContent).toContain('Investi');
    });

    it('should display the value', async () => {
      await setup({ value: '3 100 €' });
      const value = fixture.nativeElement.querySelector('[data-testid="metric-value"]');
      expect(value.textContent).toContain('3 100 €');
    });

    it('should display numeric value formatted as string', async () => {
      await setup({ value: 72 });
      const value = fixture.nativeElement.querySelector('[data-testid="metric-value"]');
      expect(value.textContent).toContain('72');
    });
  });

  // ─── Tendance ────────────────────────────────────────────────────────────────

  describe('tendance (trend)', () => {
    it('should apply positive class when trend is positive', async () => {
      await setup({ trend: 'positive' });
      const value = fixture.nativeElement.querySelector('[data-testid="metric-value"]');
      expect(value.classList.contains('metric-card__value--positive')).toBe(true);
    });

    it('should apply negative class when trend is negative', async () => {
      await setup({ trend: 'negative' });
      const value = fixture.nativeElement.querySelector('[data-testid="metric-value"]');
      expect(value.classList.contains('metric-card__value--negative')).toBe(true);
    });

    it('should not apply trend class when trend is neutral', async () => {
      await setup({ trend: 'neutral' });
      const value = fixture.nativeElement.querySelector('[data-testid="metric-value"]');
      expect(value.classList.contains('metric-card__value--positive')).toBe(false);
      expect(value.classList.contains('metric-card__value--negative')).toBe(false);
    });

    it('should not apply trend class when trend is null', async () => {
      await setup({ trend: null });
      const value = fixture.nativeElement.querySelector('[data-testid="metric-value"]');
      expect(value.classList.contains('metric-card__value--positive')).toBe(false);
      expect(value.classList.contains('metric-card__value--negative')).toBe(false);
    });

    it('should display trend icon for positive trend', async () => {
      await setup({ trend: 'positive' });
      const icon = fixture.nativeElement.querySelector('[data-testid="trend-icon"]');
      expect(icon).toBeTruthy();
    });

    it('should display trend icon for negative trend', async () => {
      await setup({ trend: 'negative' });
      const icon = fixture.nativeElement.querySelector('[data-testid="trend-icon"]');
      expect(icon).toBeTruthy();
    });

    it('should not display trend icon when trend is null', async () => {
      await setup({ trend: null });
      const icon = fixture.nativeElement.querySelector('[data-testid="trend-icon"]');
      expect(icon).toBeNull();
    });
  });

  // ─── Sublabel ────────────────────────────────────────────────────────────────

  describe('sublabel', () => {
    it('should display sublabel when provided', async () => {
      await setup({ sublabel: '+ 100 € depuis le début' });
      const sublabel = fixture.nativeElement.querySelector('[data-testid="metric-sublabel"]');
      expect(sublabel).toBeTruthy();
      expect(sublabel.textContent).toContain('+ 100 €');
    });

    it('should not display sublabel when not provided', async () => {
      await setup();
      const sublabel = fixture.nativeElement.querySelector('[data-testid="metric-sublabel"]');
      expect(sublabel).toBeNull();
    });
  });

  // ─── Tooltip pédagogique ─────────────────────────────────────────────────────

  describe('tooltip', () => {
    it('should not display a tooltip trigger when tooltip is not provided', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger).toBeNull();
    });

    it('should display a tooltip trigger when tooltip text is provided', async () => {
      await setup();
      fixture.componentRef.setInput('tooltip', 'Explication de la métrique.');
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger).toBeTruthy();
    });

    it('should show the tooltip panel when trigger is clicked', async () => {
      await setup();
      fixture.componentRef.setInput('tooltip', 'Explication de la métrique.');
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      trigger.click();
      fixture.detectChanges();
      const panel = fixture.nativeElement.querySelector('[data-testid="info-tooltip"]');
      expect(panel).toBeTruthy();
      expect(panel.textContent).toContain('Explication de la métrique.');
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have a semantic structure with label and value', async () => {
      await setup({ label: 'Investi', value: '1 500 €' });
      const card = fixture.nativeElement.querySelector('[data-testid="metric-card"]');
      expect(card).toBeTruthy();
      expect(card.querySelector('[data-testid="metric-label"]')).toBeTruthy();
      expect(card.querySelector('[data-testid="metric-value"]')).toBeTruthy();
    });
  });
});
