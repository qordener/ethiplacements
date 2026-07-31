import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeaCeilingGauge } from './pea-ceiling-gauge';

function eur(value: number): string {
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

describe('PeaCeilingGauge', () => {
  let fixture: ComponentFixture<PeaCeilingGauge>;

  async function setup(overrides: { totalDeposited?: number; ceiling?: number } = {}) {
    await TestBed.configureTestingModule({
      imports: [PeaCeilingGauge],
    }).compileComponents();

    fixture = TestBed.createComponent(PeaCeilingGauge);
    fixture.componentRef.setInput('totalDeposited', overrides.totalDeposited ?? 75_000);
    fixture.componentRef.setInput('ceiling', overrides.ceiling ?? 150_000);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(fixture.nativeElement.querySelector('[data-testid="pea-ceiling-gauge"]')).toBeTruthy();
  });

  // ─── Affichage des montants ───────────────────────────────────────────────────

  describe('affichage', () => {
    it('should display deposited amount and ceiling', async () => {
      await setup({ totalDeposited: 75_000, ceiling: 150_000 });
      const value = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-value"]');
      expect(value.textContent).toContain(eur(75_000));
      expect(value.textContent).toContain(eur(150_000));
    });

    it('should display the remaining amount before the ceiling', async () => {
      await setup({ totalDeposited: 100_000, ceiling: 150_000 });
      const remaining = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-remaining"]');
      expect(remaining.textContent).toContain(eur(50_000));
    });

    it('should show zero remaining when deposits exceed the ceiling', async () => {
      await setup({ totalDeposited: 160_000, ceiling: 150_000 });
      const remaining = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-remaining"]');
      expect(remaining.textContent).toContain('0');
      expect(remaining.textContent).not.toContain('-');
    });
  });

  // ─── Barre de progression ─────────────────────────────────────────────────────

  describe('barre de progression', () => {
    it('should set the fill width proportionally to the percentage', async () => {
      await setup({ totalDeposited: 75_000, ceiling: 150_000 });
      const fill = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-fill"]');
      expect(fill.style.width).toBe('50%');
    });

    it('should clamp the fill width at 100% when deposits exceed the ceiling', async () => {
      await setup({ totalDeposited: 200_000, ceiling: 150_000 });
      const fill = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-fill"]');
      expect(fill.style.width).toBe('100%');
    });

    it('should expose an accessible progressbar role with current value', async () => {
      await setup({ totalDeposited: 75_000, ceiling: 150_000 });
      const track = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-track"]');
      expect(track.getAttribute('role')).toBe('progressbar');
      expect(track.getAttribute('aria-valuenow')).toBe('50');
      expect(track.getAttribute('aria-valuemin')).toBe('0');
      expect(track.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  // ─── Seuils d'alerte ──────────────────────────────────────────────────────────

  describe('seuils d\'alerte', () => {
    it('should use the ok color below 75%', async () => {
      await setup({ totalDeposited: 50_000, ceiling: 150_000 });
      const fill = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-fill"]');
      expect(fill.classList.contains('pea-gauge__fill--warning')).toBe(false);
      expect(fill.classList.contains('pea-gauge__fill--danger')).toBe(false);
    });

    it('should apply the warning class between 75% and 90%', async () => {
      await setup({ totalDeposited: 120_000, ceiling: 150_000 });
      const fill = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-fill"]');
      expect(fill.classList.contains('pea-gauge__fill--warning')).toBe(true);
      expect(fill.classList.contains('pea-gauge__fill--danger')).toBe(false);
    });

    it('should apply the danger class at or above 90%', async () => {
      await setup({ totalDeposited: 140_000, ceiling: 150_000 });
      const fill = fixture.nativeElement.querySelector('[data-testid="pea-ceiling-fill"]');
      expect(fill.classList.contains('pea-gauge__fill--danger')).toBe(true);
    });
  });

  // ─── Tooltip pédagogique ─────────────────────────────────────────────────────

  describe('tooltip', () => {
    it('should embed an info tooltip explaining the ceiling rule', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger).toBeTruthy();
    });
  });
});
