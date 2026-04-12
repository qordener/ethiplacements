import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioCard } from './portfolio-card';

describe('PortfolioCard', () => {
  let fixture: ComponentFixture<PortfolioCard>;
  let component: PortfolioCard;

  async function setup(overrides: {
    id?: string;
    name?: string;
    description?: string | null;
    totalValue?: number;
    changePercent?: number;
    esgScore?: number | null;
  } = {}) {
    await TestBed.configureTestingModule({
      imports: [PortfolioCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioCard);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('id', overrides.id ?? 'cuid-1');
    fixture.componentRef.setInput('name', overrides.name ?? 'Mon Portefeuille');
    fixture.componentRef.setInput('description', overrides.description !== undefined ? overrides.description : 'Un portefeuille éthique');
    fixture.componentRef.setInput('totalValue', overrides.totalValue ?? 10000);
    fixture.componentRef.setInput('changePercent', overrides.changePercent ?? 0);
    fixture.componentRef.setInput('esgScore', overrides.esgScore !== undefined ? overrides.esgScore : null);
    fixture.detectChanges();
  }

  // ─── Nom ─────────────────────────────────────────────────────────────────────

  describe('nom', () => {
    it('should display the portfolio name', async () => {
      await setup({ name: 'PEA Éthique' });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-name"]');
      expect(el.textContent.trim()).toBe('PEA Éthique');
    });
  });

  // ─── Valeur totale ───────────────────────────────────────────────────────────

  describe('valeur totale', () => {
    it('should format value with euro sign', async () => {
      await setup({ totalValue: 12345.67 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-value"]');
      expect(el.textContent).toContain('€');
    });

    it('should display integer value correctly', async () => {
      await setup({ totalValue: 1000 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-value"]');
      expect(el.textContent).toContain('1');
      expect(el.textContent).toContain('000');
    });

    it('should display zero value', async () => {
      await setup({ totalValue: 0 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-value"]');
      expect(el.textContent).toContain('0');
    });
  });

  // ─── Variation % ─────────────────────────────────────────────────────────────

  describe('variation en %', () => {
    it('should display positive change with + sign', async () => {
      await setup({ changePercent: 2.34 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-change"]');
      expect(el.textContent).toContain('+');
    });

    it('should display negative change with - sign', async () => {
      await setup({ changePercent: -1.20 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-change"]');
      expect(el.textContent).toContain('-');
    });

    it('should apply positive color class when change > 0', async () => {
      await setup({ changePercent: 2.34 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-change"]');
      expect(el.classList).toContain('change-positive');
    });

    it('should apply negative color class when change < 0', async () => {
      await setup({ changePercent: -1.20 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-change"]');
      expect(el.classList).toContain('change-negative');
    });

    it('should apply neutral class when change is 0', async () => {
      await setup({ changePercent: 0 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-change"]');
      expect(el.classList).toContain('change-neutral');
    });

    it('should display percent symbol', async () => {
      await setup({ changePercent: 1.5 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-change"]');
      expect(el.textContent).toContain('%');
    });
  });

  // ─── Score ESG ───────────────────────────────────────────────────────────────

  describe('score ESG', () => {
    it('should show esg section when esgScore is provided', async () => {
      await setup({ esgScore: 74 });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-esg"]');
      expect(el).toBeTruthy();
    });

    it('should hide esg section when esgScore is null', async () => {
      await setup({ esgScore: null });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-esg"]');
      expect(el).toBeFalsy();
    });

    it('should render ScoreBadge inside esg section', async () => {
      await setup({ esgScore: 74 });
      const badge = fixture.nativeElement.querySelector('[data-testid="portfolio-esg"] [data-testid="score-badge"]');
      expect(badge).toBeTruthy();
    });

    it('should display the numeric score in the ScoreBadge', async () => {
      await setup({ esgScore: 74 });
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.textContent).toContain('74');
    });

    it('should apply high-tier style for score >= 70', async () => {
      await setup({ esgScore: 75 });
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList).toContain('score-badge--high');
    });

    it('should apply medium-tier style for score between 40 and 69', async () => {
      await setup({ esgScore: 55 });
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList).toContain('score-badge--medium');
    });

    it('should apply low-tier style for score below 40', async () => {
      await setup({ esgScore: 30 });
      const badge = fixture.nativeElement.querySelector('[data-testid="score-badge"]');
      expect(badge.classList).toContain('score-badge--low');
    });
  });

  // ─── Description ─────────────────────────────────────────────────────────────

  describe('description', () => {
    it('should display description when provided', async () => {
      await setup({ description: 'Mon portefeuille vert' });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-description"]');
      expect(el.textContent.trim()).toBe('Mon portefeuille vert');
    });

    it('should display fallback text when description is null', async () => {
      await setup({ description: null });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-description"]');
      expect(el.textContent.trim()).toBe('Aucune description');
    });

    it('should display fallback text when description is empty string', async () => {
      await setup({ description: '' });
      const el = fixture.nativeElement.querySelector('[data-testid="portfolio-description"]');
      expect(el.textContent.trim()).toBe('Aucune description');
    });
  });

  // ─── Événement click ─────────────────────────────────────────────────────────

  describe('événement cardClick', () => {
    it('should emit cardClick with portfolio id when card is clicked', async () => {
      await setup({ id: 'cuid-42' });
      const emitted: string[] = [];
      component.cardClick.subscribe((id: string) => emitted.push(id));

      const card = fixture.nativeElement.querySelector('[data-testid="portfolio-card"]');
      card.click();

      expect(emitted).toEqual(['cuid-42']);
    });

    it('should emit cardClick with correct id for different portfolio', async () => {
      await setup({ id: 'cuid-7' });
      const emitted: string[] = [];
      component.cardClick.subscribe((id: string) => emitted.push(id));

      fixture.nativeElement.querySelector('[data-testid="portfolio-card"]').click();
      expect(emitted[0]).toBe('cuid-7');
    });
  });

  // ─── Computed signals ────────────────────────────────────────────────────────

  describe('computed signals', () => {
    it('should compute changeClass "change-positive" for positive value', async () => {
      await setup({ changePercent: 3.5 });
      expect(component.changeClass()).toBe('change-positive');
    });

    it('should compute changeClass "change-negative" for negative value', async () => {
      await setup({ changePercent: -2.1 });
      expect(component.changeClass()).toBe('change-negative');
    });

    it('should compute changeClass "change-neutral" for zero', async () => {
      await setup({ changePercent: 0 });
      expect(component.changeClass()).toBe('change-neutral');
    });

    it('should compute formattedChange with + prefix for positive value', async () => {
      await setup({ changePercent: 2.34 });
      expect(component.formattedChange()).toContain('+');
    });

    it('should compute hasDescription false when description is null', async () => {
      await setup({ description: null });
      expect(component.hasDescription()).toBe(false);
    });

    it('should compute hasDescription true when description is provided', async () => {
      await setup({ description: 'test' });
      expect(component.hasDescription()).toBe(true);
    });
  });

  // ─── Accessibilité ───────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have role="button" or be a button/link on the card', async () => {
      await setup();
      const card = fixture.nativeElement.querySelector('[data-testid="portfolio-card"]');
      const role = card.getAttribute('role');
      const tag = card.tagName.toLowerCase();
      expect(role === 'button' || tag === 'button' || tag === 'a').toBe(true);
    });

    it('should have aria-label including portfolio name', async () => {
      await setup({ name: 'PEA Éthique' });
      const card = fixture.nativeElement.querySelector('[data-testid="portfolio-card"]');
      expect(card.getAttribute('aria-label')).toContain('PEA Éthique');
    });
  });
});
