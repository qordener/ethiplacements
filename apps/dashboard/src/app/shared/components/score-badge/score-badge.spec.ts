import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoreBadge } from './score-badge';

describe('ScoreBadge', () => {
  let fixture: ComponentFixture<ScoreBadge>;

  async function setup(score: number | null, label?: string) {
    await TestBed.configureTestingModule({
      imports: [ScoreBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreBadge);
    fixture.componentRef.setInput('score', score);
    if (label !== undefined) fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup(72);
    expect(fixture.nativeElement.querySelector('[data-testid="score-badge"]')).toBeTruthy();
  });

  // ─── Affichage valeur ─────────────────────────────────────────────────────────

  describe('affichage de la valeur', () => {
    it('should display the score value', async () => {
      await setup(72);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.textContent).toContain('72');
    });

    it('should display "—" when score is null', async () => {
      await setup(null);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.textContent).toContain('—');
    });

    it('should round score to nearest integer', async () => {
      await setup(72.7);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.textContent).toContain('73');
    });
  });

  // ─── Sémantique ESG ───────────────────────────────────────────────────────────

  describe('couleur sémantique ESG', () => {
    it('should apply high class for score >= 70', async () => {
      await setup(70);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--high')).toBe(true);
    });

    it('should apply high class for score of 100', async () => {
      await setup(100);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--high')).toBe(true);
    });

    it('should apply medium class for score between 40 and 69', async () => {
      await setup(55);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--medium')).toBe(true);
    });

    it('should apply medium class for score of 40', async () => {
      await setup(40);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--medium')).toBe(true);
    });

    it('should apply low class for score < 40', async () => {
      await setup(25);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--low')).toBe(true);
    });

    it('should apply low class for score of 0', async () => {
      await setup(0);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--low')).toBe(true);
    });

    it('should apply na class when score is null', async () => {
      await setup(null);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList.contains('score-badge--na')).toBe(true);
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have aria-label with score value', async () => {
      await setup(72);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.getAttribute('aria-label')).toContain('72');
    });

    it('should have aria-label indicating N/A when score is null', async () => {
      await setup(null);
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.getAttribute('aria-label')).toBeTruthy();
    });

    it('should include custom label in aria-label when provided', async () => {
      await setup(72, 'Score ESG');
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.getAttribute('aria-label')).toContain('Score ESG');
    });
  });

  // ─── Label optionnel ─────────────────────────────────────────────────────────

  describe('label optionnel', () => {
    it('should display label text when provided', async () => {
      await setup(72, 'ESG');
      const label = fixture.nativeElement.querySelector('[data-testid="score-label"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('ESG');
    });

    it('should not display label element when label is not provided', async () => {
      await setup(72);
      const label = fixture.nativeElement.querySelector('[data-testid="score-label"]');
      expect(label).toBeNull();
    });
  });
});
