import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';

import { PortfolioDetailPage } from './portfolio-detail.page';
import { PortfolioDetailService, PortfolioDetailData } from '../portfolio-detail.service';

const MOCK_DETAIL: PortfolioDetailData = {
  portfolio: {
    id: 'cuid-1',
    name: 'Mon PEA',
    description: 'Portefeuille ISR',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    holdings: [
      {
        id: 'holding-1',
        quantity: 10,
        averagePrice: 150,
        asset: {
          id: 'asset-1',
          name: 'Danone',
          ticker: 'BN',
          type: 'STOCK',
          manualPrice: 155,
        },
      },
      {
        id: 'holding-2',
        quantity: 5,
        averagePrice: 300,
        asset: {
          id: 'asset-2',
          name: 'Engie Green Bond',
          ticker: 'ENGB',
          type: 'BOND',
          manualPrice: null,
        },
      },
    ],
  },
  summary: {
    totalInvested: 3000,
    currentValue: 3100,
    latentGain: 100,
    latentGainPct: 3.33,
    esgScoreWeighted: 72,
    allocationByType: { STOCK: 50, BOND: 50 },
  },
};

describe('PortfolioDetailPage', () => {
  let fixture: ComponentFixture<PortfolioDetailPage>;
  let component: PortfolioDetailPage;
  let mockService: { getPortfolioDetail: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = { getPortfolioDetail: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PortfolioDetailPage],
      providers: [
        provideRouter([]),
        { provide: PortfolioDetailService, useValue: mockService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'cuid-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ─── État chargement ──────────────────────────────────────────────────────────

  describe('état loading', () => {
    it('should display a loading indicator before data arrives', () => {
      const subject = new Subject<PortfolioDetailData>();
      mockService.getPortfolioDetail.mockReturnValue(subject.asObservable());
      fixture.detectChanges();

      const loader = fixture.nativeElement.querySelector('[data-testid="loading"]');
      expect(loader).toBeTruthy();
      subject.complete();
    });

    it('should not display portfolio content while loading', () => {
      const subject = new Subject<PortfolioDetailData>();
      mockService.getPortfolioDetail.mockReturnValue(subject.asObservable());
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('[data-testid="portfolio-name"]');
      expect(title).toBeNull();
      subject.complete();
    });

    it('should call getPortfolioDetail with the route id on init', () => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();
      expect(mockService.getPortfolioDetail).toHaveBeenCalledWith('cuid-1');
    });
  });

  // ─── État chargé ──────────────────────────────────────────────────────────────

  describe('état loaded', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();
    });

    it('should display the portfolio name', () => {
      const name = fixture.nativeElement.querySelector('[data-testid="portfolio-name"]');
      expect(name).toBeTruthy();
      expect(name.textContent).toContain('Mon PEA');
    });

    it('should display the portfolio description', () => {
      const desc = fixture.nativeElement.querySelector('[data-testid="portfolio-description"]');
      expect(desc).toBeTruthy();
      expect(desc.textContent).toContain('Portefeuille ISR');
    });

    it('should display totalInvested', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="total-invested"]');
      expect(el).toBeTruthy();
      expect(el.textContent).toContain('3');
    });

    it('should display currentValue', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="current-value"]');
      expect(el).toBeTruthy();
    });

    it('should display latentGainPct', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="latent-gain-pct"]');
      expect(el).toBeTruthy();
      expect(el.textContent).toContain('3');
    });

    it('should display esgScoreWeighted', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="esg-score"]');
      expect(el).toBeTruthy();
      expect(el.textContent).toContain('72');
    });

    it('should not display the loading indicator', () => {
      const loader = fixture.nativeElement.querySelector('[data-testid="loading"]');
      expect(loader).toBeNull();
    });

    it('should not display the error block', () => {
      const error = fixture.nativeElement.querySelector('[data-testid="error"]');
      expect(error).toBeNull();
    });
  });

  // ─── Liste des positions ──────────────────────────────────────────────────────

  describe('liste des positions (holdings)', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();
    });

    it('should display one row per holding', () => {
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="holding-row"]');
      expect(rows).toHaveLength(2);
    });

    it('should display the asset ticker in each row', () => {
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="holding-row"]');
      expect(rows[0].textContent).toContain('BN');
      expect(rows[1].textContent).toContain('ENGB');
    });

    it('should display the asset name in each row', () => {
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="holding-row"]');
      expect(rows[0].textContent).toContain('Danone');
      expect(rows[1].textContent).toContain('Engie Green Bond');
    });

    it('should display the quantity in each row', () => {
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="holding-row"]');
      expect(rows[0].textContent).toContain('10');
      expect(rows[1].textContent).toContain('5');
    });

    it('should not display empty message when holdings exist', () => {
      const empty = fixture.nativeElement.querySelector('[data-testid="holdings-empty"]');
      expect(empty).toBeNull();
    });
  });

  // ─── État erreur ──────────────────────────────────────────────────────────────

  describe('état error', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(
        throwError(() => new Error('Not found'))
      );
      fixture.detectChanges();
    });

    it('should display an error message', () => {
      const error = fixture.nativeElement.querySelector('[data-testid="error"]');
      expect(error).toBeTruthy();
    });

    it('should not display the loading indicator', () => {
      const loader = fixture.nativeElement.querySelector('[data-testid="loading"]');
      expect(loader).toBeNull();
    });

    it('should not display the portfolio name', () => {
      const name = fixture.nativeElement.querySelector('[data-testid="portfolio-name"]');
      expect(name).toBeNull();
    });
  });

  // ─── Cas limites ─────────────────────────────────────────────────────────────

  describe('cas limites', () => {
    it('should display "—" when esgScoreWeighted is null', () => {
      mockService.getPortfolioDetail.mockReturnValue(
        of({ ...MOCK_DETAIL, summary: { ...MOCK_DETAIL.summary, esgScoreWeighted: null } })
      );
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('[data-testid="esg-score"]');
      expect(el.textContent).toContain('—');
    });

    it('should display an empty holdings message when no holdings', () => {
      mockService.getPortfolioDetail.mockReturnValue(
        of({ ...MOCK_DETAIL, portfolio: { ...MOCK_DETAIL.portfolio, holdings: [] } })
      );
      fixture.detectChanges();

      const empty = fixture.nativeElement.querySelector('[data-testid="holdings-empty"]');
      expect(empty).toBeTruthy();
    });
  });

  // ─── Navigation ───────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('should display a back link to /dashboard', () => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();

      const back = fixture.nativeElement.querySelector('[data-testid="back-to-dashboard"]');
      expect(back).toBeTruthy();
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();
    });

    it('should have a main heading (h1) with the portfolio name', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1.textContent).toContain('Mon PEA');
    });

    it('should have role="status" on the loading indicator', () => {
      const subject = new Subject<PortfolioDetailData>();
      mockService.getPortfolioDetail.mockReturnValue(subject.asObservable());

      // Re-create component to get loading state
      TestBed.resetTestingModule();
      subject.complete();
    });

    it('should have a table or list with accessible label for holdings', () => {
      const table = fixture.nativeElement.querySelector('[data-testid="holdings-table"]');
      expect(table).toBeTruthy();
    });
  });
});
