import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { DashboardPage } from './dashboard.page';
import { DashboardService, PortfolioCardData } from './dashboard.service';
import { PortfolioService } from '../portfolio/portfolio.service';

const MOCK_PORTFOLIOS: PortfolioCardData[] = [
  { id: 'cuid-1', name: 'PEA Éthique',      description: 'Mon PEA ISR', totalValue: 11200, changePercent: 12,   esgScore: 75  }, // high
  { id: 'cuid-2', name: 'Livret Solidaire',  description: null,          totalValue: 5000,  changePercent: 0,    esgScore: null }, // na
  { id: 'cuid-3', name: 'PEA Moyen',         description: null,          totalValue: 3000,  changePercent: -2,   esgScore: 55  }, // medium
  { id: 'cuid-4', name: 'Compte Spéculatif', description: null,          totalValue: 1500,  changePercent: 5,    esgScore: 25  }, // low
];

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let component: DashboardPage;
  let mockDashboardService: { getPortfoliosWithSummary: ReturnType<typeof vi.fn> };
  let mockPortfolioService: { removePortfolio: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    mockDashboardService = { getPortfoliosWithSummary: vi.fn() };
    mockPortfolioService = { removePortfolio: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('should display a loading indicator before data arrives', () => {
      const subject = new Subject<PortfolioCardData[]>();
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(subject.asObservable());
      fixture.detectChanges(); // ngOnInit appelé, mais le subject n'a pas encore émis
      const el = fixture.nativeElement;
      expect(el.querySelector('[data-testid="dashboard-loading"]')).toBeTruthy();
      subject.complete();
    });

    it('should hide loading indicator after data arrives', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.querySelector('[data-testid="dashboard-loading"]')).toBeNull();
    });
  });

  describe('portfolio list', () => {
    it('should render one PortfolioCard per portfolio', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(4);
    });

    it('should display portfolio names in the cards', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      const names = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-name"]');
      expect(names[0].textContent).toContain('PEA Éthique');
      expect(names[1].textContent).toContain('Livret Solidaire');
    });

    it('should display portfolio values formatted in EUR', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      const values = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-value"]');
      expect(values[0].textContent).toContain('11');
      expect(values[0].textContent).toContain('200');
    });

    it('should display the ESG score badge for a portfolio with esgScore', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      const badges = fixture.nativeElement.querySelectorAll('[data-testid="score-badge"]');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('empty state', () => {
    it('should display empty state when no portfolios', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of([]));
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('[data-testid="dashboard-empty"]');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('Aucun portefeuille');
    });

    it('should not display any portfolio card in empty state', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of([]));
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(0);
    });

    it('should display a CTA link to /portfolio/new in empty state', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of([]));
      fixture.detectChanges();
      const cta = fixture.nativeElement.querySelector('[data-testid="cta-create-portfolio"]');
      expect(cta).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should display error message when service fails', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(
        throwError(() => new Error('API unavailable'))
      );
      fixture.detectChanges();
      const errorEl = fixture.nativeElement.querySelector('[data-testid="dashboard-error"]');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('impossible');
    });

    it('should not display portfolio cards in error state', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(
        throwError(() => new Error('API unavailable'))
      );
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(0);
    });
  });

  describe('navigation', () => {
    it('should navigate to portfolio detail when a card is clicked', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      component.onCardClick('cuid-1');
      expect(navigateSpy).toHaveBeenCalledWith(['/portfolio', 'cuid-1']);
    });
  });

  describe('suppression de portefeuille', () => {
    beforeEach(() => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
    });

    it('should open a confirmation modal when deleteClick is emitted by a card', () => {
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[data-testid="delete-portfolio-modal"]');
      expect(modal).toBeTruthy();
    });

    it('should display the portfolio name in the confirmation modal', () => {
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[data-testid="delete-portfolio-modal"]');
      expect(modal.textContent).toContain('PEA Éthique');
    });

    it('should close the modal without deleting when cancel is clicked', () => {
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      component.closeDeleteModal();
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[data-testid="delete-portfolio-modal"]');
      expect(modal).toBeNull();
      expect(mockPortfolioService.removePortfolio).not.toHaveBeenCalled();
    });

    it('should call removePortfolio with correct id on confirm', () => {
      mockPortfolioService.removePortfolio.mockReturnValue(of(undefined));
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      component.confirmDelete();
      expect(mockPortfolioService.removePortfolio).toHaveBeenCalledWith('cuid-1');
    });

    it('should remove the portfolio from the list after successful deletion', () => {
      mockPortfolioService.removePortfolio.mockReturnValue(of(undefined));
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      component.confirmDelete();
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(3);
    });

    it('should close the modal after successful deletion', () => {
      mockPortfolioService.removePortfolio.mockReturnValue(of(undefined));
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      component.confirmDelete();
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[data-testid="delete-portfolio-modal"]');
      expect(modal).toBeNull();
    });

    it('should show empty state when last portfolio is deleted', () => {
      mockPortfolioService.removePortfolio.mockReturnValue(of(undefined));
      // Réduire à 1 portfolio
      component.portfolios.set([MOCK_PORTFOLIOS[0]]);
      fixture.detectChanges();
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      component.confirmDelete();
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('[data-testid="dashboard-empty"]');
      expect(empty).toBeTruthy();
    });

    it('should not remove portfolio on API error', () => {
      mockPortfolioService.removePortfolio.mockReturnValue(
        throwError(() => new Error('API error'))
      );
      component.openDeleteModal('cuid-1', 'PEA Éthique');
      fixture.detectChanges();
      component.confirmDelete();
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(4);
    });
  });

  describe('filtres ESG', () => {
    beforeEach(() => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
    });

    it('should display the filter bar', () => {
      const bar = fixture.nativeElement.querySelector('[data-testid="esg-filter-bar"]');
      expect(bar).toBeTruthy();
    });

    it('should display all 4 portfolios by default (filter = all)', () => {
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(4);
    });

    it('should show only high-score portfolios when "Élevé" filter is active', () => {
      component.setFilter('high');
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('[data-testid="portfolio-name"]').textContent).toContain('PEA Éthique');
    });

    it('should show only medium-score portfolios when "Moyen" filter is active', () => {
      component.setFilter('medium');
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('[data-testid="portfolio-name"]').textContent).toContain('PEA Moyen');
    });

    it('should show only low-score portfolios when "Faible" filter is active', () => {
      component.setFilter('low');
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('[data-testid="portfolio-name"]').textContent).toContain('Compte Spéculatif');
    });

    it('should show only unrated portfolios when "Non noté" filter is active', () => {
      component.setFilter('na');
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('[data-testid="portfolio-name"]').textContent).toContain('Livret Solidaire');
    });

    it('should restore all portfolios when "Tous" filter is selected', () => {
      component.setFilter('high');
      fixture.detectChanges();
      component.setFilter('all');
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="portfolio-card"]');
      expect(cards).toHaveLength(4);
    });

    it('should mark the active filter button with aria-pressed="true"', () => {
      component.setFilter('high');
      fixture.detectChanges();
      const activeBtn = fixture.nativeElement.querySelector('[data-testid="filter-high"]');
      expect(activeBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('should mark inactive filter buttons with aria-pressed="false"', () => {
      component.setFilter('high');
      fixture.detectChanges();
      const allBtn = fixture.nativeElement.querySelector('[data-testid="filter-all"]');
      expect(allBtn.getAttribute('aria-pressed')).toBe('false');
    });

    it('should show a no-results message when the active filter matches no portfolio', () => {
      // MOCK_PORTFOLIOS n'a aucun portefeuille avec esgScore entre 40 et 69 (cuid-3 = 55... si)
      // On force un jeu sans portefeuille moyen
      component.portfolios.set([MOCK_PORTFOLIOS[0], MOCK_PORTFOLIOS[1]]); // high + na seulement
      component.setFilter('medium');
      fixture.detectChanges();
      const noResult = fixture.nativeElement.querySelector('[data-testid="filter-no-results"]');
      expect(noResult).toBeTruthy();
      expect(noResult.textContent.toLowerCase()).toContain('aucun');
    });

    it('should not show no-results message when filter matches at least one portfolio', () => {
      component.setFilter('high');
      fixture.detectChanges();
      const noResult = fixture.nativeElement.querySelector('[data-testid="filter-no-results"]');
      expect(noResult).toBeNull();
    });

    it('should not show no-results message when filter is "all" with portfolios', () => {
      fixture.detectChanges();
      const noResult = fixture.nativeElement.querySelector('[data-testid="filter-no-results"]');
      expect(noResult).toBeNull();
    });
  });
});
