import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';

import { PortfolioDetailPage } from './portfolio-detail.page';
import { PortfolioDetailService, PortfolioDetailData } from '../portfolio-detail.service';
import { HoldingService } from '../holding.service';
import { AssetService } from '../asset.service';
import { EsgScoreService } from '../esg-score.service';

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
          esgScores: [{ id: 'esg-1', score: 75, provider: 'manual', date: '2024-01-01T00:00:00.000Z' }],
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
          esgScores: [],
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
  let mockHoldingService: { create: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let mockAssetService: { findAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; updatePrice: ReturnType<typeof vi.fn> };
  let mockEsgScoreService: { create: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = { getPortfolioDetail: vi.fn() };
    mockHoldingService = { create: vi.fn(), remove: vi.fn() };
    mockAssetService = { findAll: vi.fn(), create: vi.fn(), updatePrice: vi.fn() };
    mockEsgScoreService = { create: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PortfolioDetailPage],
      providers: [
        provideRouter([]),
        { provide: PortfolioDetailService, useValue: mockService },
        { provide: HoldingService, useValue: mockHoldingService },
        { provide: AssetService, useValue: mockAssetService },
        { provide: EsgScoreService, useValue: mockEsgScoreService },
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

  // ─── Suppression d'un holding ────────────────────────────────────────────────

  describe('suppression d\'un holding', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      mockAssetService.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
    });

    it('should display a delete button for each holding row', () => {
      const btns = fixture.nativeElement.querySelectorAll('[data-testid="delete-holding-btn"]');
      expect(btns).toHaveLength(2);
    });

    it('should open a confirmation modal when delete button is clicked', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="delete-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('BN');
    });

    it('should call HoldingService.remove when confirming deletion', () => {
      mockHoldingService.remove = vi.fn().mockReturnValue(of(undefined));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="delete-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      component.confirmDelete();

      expect(mockHoldingService.remove).toHaveBeenCalledWith('holding-1');
    });

    it('should reload data and close modal after successful deletion', () => {
      mockHoldingService.remove = vi.fn().mockReturnValue(of(undefined));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="delete-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      component.confirmDelete();
      fixture.detectChanges();

      expect(mockService.getPortfolioDetail).toHaveBeenCalledTimes(2);
      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeNull();
    });

    it('should not delete when cancelling the confirmation', () => {
      mockHoldingService.remove = vi.fn();

      const btn = fixture.nativeElement.querySelector('[data-testid="delete-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector('[data-testid="modal-close-btn"]');
      closeBtn.click();
      fixture.detectChanges();

      expect(mockHoldingService.remove).not.toHaveBeenCalled();
      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeNull();
    });
  });

  // ─── Mise à jour du prix actuel ──────────────────────────────────────────────

  describe('mise à jour du prix actuel', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      mockAssetService.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
    });

    it('should display a price edit button for each holding row', () => {
      const btns = fixture.nativeElement.querySelectorAll('[data-testid="price-btn"]');
      expect(btns).toHaveLength(2);
    });

    it('should open the price modal when clicking the price button', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="price-btn"]');
      btn.click();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeTruthy();
    });

    it('should pre-fill the price with the current manualPrice when available', () => {
      // holding-1 has manualPrice = 155
      const btn = fixture.nativeElement.querySelector('[data-testid="price-btn"]');
      btn.click();
      fixture.detectChanges();

      expect(component.priceForm.value.manualPrice).toBe(155);
    });

    it('should pre-fill with averagePrice when manualPrice is null', () => {
      // holding-2 has manualPrice = null, averagePrice = 300
      const btns = fixture.nativeElement.querySelectorAll('[data-testid="price-btn"]');
      btns[1].click();
      fixture.detectChanges();

      expect(component.priceForm.value.manualPrice).toBe(300);
    });

    it('should call AssetService.updatePrice on form submit', () => {
      const updatedAsset = { ...MOCK_DETAIL.portfolio.holdings[0].asset, manualPrice: 160 };
      mockAssetService.updatePrice.mockReturnValue(of(updatedAsset));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="price-btn"]');
      btn.click();
      fixture.detectChanges();

      component.priceForm.patchValue({ manualPrice: 160 });
      component.onSubmitPrice();

      expect(mockAssetService.updatePrice).toHaveBeenCalledWith(
        MOCK_DETAIL.portfolio.holdings[0].asset.id,
        expect.objectContaining({ manualPrice: 160 })
      );
    });

    it('should reload data and close modal after successful price update', () => {
      const updatedAsset = { ...MOCK_DETAIL.portfolio.holdings[0].asset, manualPrice: 160 };
      mockAssetService.updatePrice.mockReturnValue(of(updatedAsset));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="price-btn"]');
      btn.click();
      fixture.detectChanges();

      component.priceForm.patchValue({ manualPrice: 160 });
      component.onSubmitPrice();
      fixture.detectChanges();

      expect(mockService.getPortfolioDetail).toHaveBeenCalledTimes(2);
      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeNull();
    });
  });

  // ─── Score ESG manuel ────────────────────────────────────────────────────────

  describe('score ESG manuel', () => {
    const HOLDING_WITH_ESG = MOCK_DETAIL.portfolio.holdings[0]; // asset-1, ticker BN, esgScore 75

    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      mockAssetService.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
    });

    it('should display an ESG score button for each holding row', () => {
      const btns = fixture.nativeElement.querySelectorAll('[data-testid="esg-score-btn"]');
      expect(btns).toHaveLength(2);
    });

    it('should open the ESG modal when clicking the score button', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="esg-score-btn"]');
      btn.click();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeTruthy();
    });

    it('should pre-fill the score field with the current ESG score', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="esg-score-btn"]');
      btn.click();
      fixture.detectChanges();

      expect(component.esgForm.value.score).toBe(75);
    });

    it('should start with score 0 when holding has no ESG score', () => {
      const btns = fixture.nativeElement.querySelectorAll('[data-testid="esg-score-btn"]');
      btns[1].click(); // holding-2 has no esgScores
      fixture.detectChanges();

      expect(component.esgForm.value.score).toBe(0);
    });

    it('should call EsgScoreService.create on form submit', () => {
      const newScore = { id: 'esg-new', assetId: 'asset-1', score: 80, provider: 'manual', date: '2026-04-12T00:00:00.000Z', details: null };
      mockEsgScoreService.create.mockReturnValue(of(newScore));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="esg-score-btn"]');
      btn.click();
      fixture.detectChanges();

      component.esgForm.patchValue({ score: 80 });
      component.onSubmitEsgScore();

      expect(mockEsgScoreService.create).toHaveBeenCalledWith(
        HOLDING_WITH_ESG.asset.id,
        expect.objectContaining({ score: 80, provider: 'manual' })
      );
    });

    it('should reload data and close modal after successful ESG score submission', () => {
      const newScore = { id: 'esg-new', assetId: 'asset-1', score: 80, provider: 'manual', date: '2026-04-12T00:00:00.000Z', details: null };
      mockEsgScoreService.create.mockReturnValue(of(newScore));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="esg-score-btn"]');
      btn.click();
      fixture.detectChanges();

      component.esgForm.patchValue({ score: 80 });
      component.onSubmitEsgScore();
      fixture.detectChanges();

      expect(mockService.getPortfolioDetail).toHaveBeenCalledTimes(2);
      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeNull();
    });
  });

  // ─── Graphique de répartition ────────────────────────────────────────────────

  describe('graphique de répartition', () => {
    it('should display the allocation chart when holdings exist', () => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('[data-testid="allocation-chart-section"]');
      expect(section).toBeTruthy();
    });

    it('should not display the allocation chart when there are no holdings', () => {
      mockService.getPortfolioDetail.mockReturnValue(
        of({ ...MOCK_DETAIL, portfolio: { ...MOCK_DETAIL.portfolio, holdings: [] },
             summary: { ...MOCK_DETAIL.summary, allocationByType: {} } })
      );
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('[data-testid="allocation-chart-section"]');
      expect(section).toBeNull();
    });

    it('should render one donut slice per asset type in allocationByType', () => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      fixture.detectChanges();
      const slices = fixture.nativeElement.querySelectorAll('[data-testid="donut-slice"]');
      const typeCount = Object.keys(MOCK_DETAIL.summary.allocationByType).length;
      expect(slices).toHaveLength(typeCount);
    });
  });

  // ─── Ajout de position ───────────────────────────────────────────────────────

  describe('ajout de position', () => {
    beforeEach(() => {
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));
      mockAssetService.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
    });

    it('should display an "add holding" button in the loaded state', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      expect(btn).toBeTruthy();
    });

    it('should open the modal when the add button is clicked', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeTruthy();
    });

    it('should load assets when the modal opens', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      btn.click();

      expect(mockAssetService.findAll).toHaveBeenCalled();
    });

    it('should close the modal when closeRequest is emitted', () => {
      // open modal
      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      // click close button
      const closeBtn = fixture.nativeElement.querySelector('[data-testid="modal-close-btn"]');
      closeBtn.click();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeNull();
    });

    it('should call HoldingService.create when form is submitted with an existing asset', () => {
      const existingAsset = { id: 'a1', name: 'Danone', ticker: 'BN', type: 'STOCK', manualPrice: 155, esgScores: [] };
      mockAssetService.findAll.mockReturnValue(of([existingAsset]));
      mockHoldingService.create.mockReturnValue(of({ id: 'h-new', portfolioId: 'cuid-1', assetId: 'a1', quantity: 5, averagePrice: 150, asset: existingAsset }));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      component.holdingForm.setValue({
        ticker: 'BN',
        assetName: 'Danone',
        assetType: 'STOCK',
        quantity: 5,
        averagePrice: 150,
      });
      fixture.detectChanges();

      component.onSubmitHolding();

      expect(mockHoldingService.create).toHaveBeenCalledWith('cuid-1', {
        assetId: 'a1',
        quantity: 5,
        averagePrice: 150,
      });
    });

    it('should create a new asset then holding when ticker is not found', () => {
      const newAsset = { id: 'a-new', name: 'Tesla', ticker: 'TSLA', type: 'STOCK', manualPrice: null, esgScores: [] };
      mockAssetService.findAll.mockReturnValue(of([]));
      mockAssetService.create.mockReturnValue(of(newAsset));
      mockHoldingService.create.mockReturnValue(of({ id: 'h-new', portfolioId: 'cuid-1', assetId: 'a-new', quantity: 10, averagePrice: 200, asset: newAsset }));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      component.holdingForm.setValue({
        ticker: 'TSLA',
        assetName: 'Tesla',
        assetType: 'STOCK',
        quantity: 10,
        averagePrice: 200,
      });

      component.onSubmitHolding();

      expect(mockAssetService.create).toHaveBeenCalledWith({
        ticker: 'TSLA',
        name: 'Tesla',
        type: 'STOCK',
      });
    });

    it('should reload portfolio data and close modal after successful submission', () => {
      const existingAsset = { id: 'a1', name: 'Danone', ticker: 'BN', type: 'STOCK', manualPrice: 155, esgScores: [] };
      mockAssetService.findAll.mockReturnValue(of([existingAsset]));
      mockHoldingService.create.mockReturnValue(of({ id: 'h-new', portfolioId: 'cuid-1', assetId: 'a1', quantity: 5, averagePrice: 150, asset: existingAsset }));
      mockService.getPortfolioDetail.mockReturnValue(of(MOCK_DETAIL));

      const btn = fixture.nativeElement.querySelector('[data-testid="add-holding-btn"]');
      btn.click();
      fixture.detectChanges();

      component.holdingForm.setValue({ ticker: 'BN', assetName: 'Danone', assetType: 'STOCK', quantity: 5, averagePrice: 150 });
      component.onSubmitHolding();
      fixture.detectChanges();

      // Portfolio data should be reloaded (getPortfolioDetail called at least twice: init + after submit)
      expect(mockService.getPortfolioDetail).toHaveBeenCalledTimes(2);

      // Modal should be closed
      const modal = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(modal).toBeNull();
    });
  });
});
