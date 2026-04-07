import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { DashboardPage } from './dashboard.page';
import { DashboardService, PortfolioCardData } from './dashboard.service';

const MOCK_PORTFOLIOS: PortfolioCardData[] = [
  { id: 'cuid-1', name: 'PEA Éthique', description: 'Mon PEA ISR', totalValue: 11200, changePercent: 12, esgScore: 72 },
  { id: 'cuid-2', name: 'Livret Solidaire', description: null, totalValue: 5000, changePercent: 0, esgScore: null },
];

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let component: DashboardPage;
  let mockDashboardService: { getPortfoliosWithSummary: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDashboardService = { getPortfoliosWithSummary: vi.fn() };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

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
      expect(cards).toHaveLength(2);
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

    it('should display the ESG gauge for a portfolio with esgScore', () => {
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      const gauges = fixture.nativeElement.querySelectorAll('[data-testid="esg-gauge"]');
      expect(gauges.length).toBeGreaterThanOrEqual(1);
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
      mockDashboardService.getPortfoliosWithSummary.mockReturnValue(of(MOCK_PORTFOLIOS));
      fixture.detectChanges();
      component.onCardClick('cuid-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/portfolio', 'cuid-1']);
    });
  });
});
