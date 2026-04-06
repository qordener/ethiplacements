import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EsgScoreGauge } from './esg-score-gauge';

describe('EsgScoreGauge', () => {
  let fixture: ComponentFixture<EsgScoreGauge>;
  let component: EsgScoreGauge;

  async function setup(score: number, provider = 'MSCI', updatedAt = '2025-03-01') {
    await TestBed.configureTestingModule({
      imports: [EsgScoreGauge],
    }).compileComponents();

    fixture = TestBed.createComponent(EsgScoreGauge);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('score', score);
    fixture.componentRef.setInput('provider', provider);
    fixture.componentRef.setInput('updatedAt', updatedAt);
    fixture.detectChanges();
  }

  // ─── Label qualitatif ────────────────────────────────────────────────────────

  describe('label qualitatif', () => {
    it('should display "Insuffisant" when score is 0', async () => {
      await setup(0);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Insuffisant');
    });

    it('should display "Insuffisant" when score is 39', async () => {
      await setup(39);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Insuffisant');
    });

    it('should display "Moyen" when score is 40', async () => {
      await setup(40);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Moyen');
    });

    it('should display "Moyen" when score is 59', async () => {
      await setup(59);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Moyen');
    });

    it('should display "Élevé" when score is 60', async () => {
      await setup(60);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Élevé');
    });

    it('should display "Élevé" when score is 79', async () => {
      await setup(79);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Élevé');
    });

    it('should display "Exemplaire" when score is 80', async () => {
      await setup(80);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Exemplaire');
    });

    it('should display "Exemplaire" when score is 100', async () => {
      await setup(100);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.textContent.trim()).toBe('Exemplaire');
    });
  });

  // ─── Score chiffré ───────────────────────────────────────────────────────────

  describe('score chiffré', () => {
    it('should display score as "74/100"', async () => {
      await setup(74);
      const score = fixture.nativeElement.querySelector('[data-testid="esg-score"]');
      expect(score.textContent.trim()).toBe('74/100');
    });

    it('should display score as "0/100" for minimum value', async () => {
      await setup(0);
      const score = fixture.nativeElement.querySelector('[data-testid="esg-score"]');
      expect(score.textContent.trim()).toBe('0/100');
    });
  });

  // ─── Fournisseur ─────────────────────────────────────────────────────────────

  describe('fournisseur', () => {
    it('should display the provider name', async () => {
      await setup(74, 'MSCI');
      const provider = fixture.nativeElement.querySelector('[data-testid="esg-provider"]');
      expect(provider.textContent).toContain('MSCI');
    });

    it('should display a different provider', async () => {
      await setup(55, 'Sustainalytics');
      const provider = fixture.nativeElement.querySelector('[data-testid="esg-provider"]');
      expect(provider.textContent).toContain('Sustainalytics');
    });
  });

  // ─── Classes CSS selon le label ──────────────────────────────────────────────

  describe('classes CSS', () => {
    it('should apply "esg-danger" class when score is in "Insuffisant" range', async () => {
      await setup(25);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.classList).toContain('esg-danger');
    });

    it('should apply "esg-warning" class when score is in "Moyen" range', async () => {
      await setup(50);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.classList).toContain('esg-warning');
    });

    it('should apply "esg-success" class when score is in "Élevé" range', async () => {
      await setup(65);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.classList).toContain('esg-success');
    });

    it('should apply "esg-primary" class when score is in "Exemplaire" range', async () => {
      await setup(90);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.classList).toContain('esg-primary');
    });

    it('should NOT apply other color classes when "esg-success" applies', async () => {
      await setup(65);
      const label = fixture.nativeElement.querySelector('[data-testid="esg-label"]');
      expect(label.classList).not.toContain('esg-danger');
      expect(label.classList).not.toContain('esg-warning');
      expect(label.classList).not.toContain('esg-primary');
    });
  });

  // ─── Accessibilité ───────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have an aria-label on the score gauge container', async () => {
      await setup(74, 'MSCI');
      const container = fixture.nativeElement.querySelector('[data-testid="esg-gauge"]');
      expect(container.getAttribute('aria-label')).toBeTruthy();
    });

    it('should include score value in aria-label', async () => {
      await setup(74, 'MSCI');
      const container = fixture.nativeElement.querySelector('[data-testid="esg-gauge"]');
      expect(container.getAttribute('aria-label')).toContain('74');
    });
  });

  // ─── Computed signals ────────────────────────────────────────────────────────

  describe('computed signals (logique interne)', () => {
    it('should compute label "Élevé" for score 74', async () => {
      await setup(74);
      expect(component.label()).toBe('Élevé');
    });

    it('should compute colorClass "esg-success" for score 74', async () => {
      await setup(74);
      expect(component.colorClass()).toBe('esg-success');
    });

    it('should update label reactively when score input changes', async () => {
      await setup(74);
      expect(component.label()).toBe('Élevé');

      fixture.componentRef.setInput('score', 30);
      fixture.detectChanges();
      expect(component.label()).toBe('Insuffisant');
    });
  });
});
