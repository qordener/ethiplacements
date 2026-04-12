import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { PortfolioDetailService, PortfolioDetailData, Holding, EsgScore } from '../portfolio-detail.service';
import { HoldingService } from '../holding.service';
import { AssetService, AssetItem, AssetType, UpdatePricePayload } from '../asset.service';
import { EsgScoreService } from '../esg-score.service';
import { MetricCard } from '../../../shared/components/metric-card/metric-card';
import { ScoreBadge } from '../../../shared/components/score-badge/score-badge';
import { Modal } from '../../../shared/components/modal/modal';
import { FormField } from '../../../shared/components/form-field/form-field';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-portfolio-detail-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule, MetricCard, ScoreBadge, Modal, FormField],
  template: `
    <div class="portfolio-detail">

      <a
        data-testid="back-to-dashboard"
        routerLink="/dashboard"
        class="portfolio-detail__back"
      >← Retour au tableau de bord</a>

      @switch (state()) {

        @case ('loading') {
          <div data-testid="loading" role="status" class="portfolio-detail__loading">
            Chargement…
          </div>
        }

        @case ('error') {
          <div data-testid="error" class="portfolio-detail__error" role="alert">
            Impossible de charger ce portefeuille. Vérifiez que l'API est démarrée.
          </div>
        }

        @case ('loaded') {
          <h1 data-testid="portfolio-name" class="portfolio-detail__title">
            {{ data()!.portfolio.name }}
          </h1>

          @if (data()!.portfolio.description) {
            <p data-testid="portfolio-description" class="portfolio-detail__description">
              {{ data()!.portfolio.description }}
            </p>
          }

          <section class="portfolio-detail__metrics" aria-label="Métriques du portefeuille">
            <epi-metric-card
              data-testid="total-invested"
              label="Investi"
              [value]="(data()!.summary.totalInvested | number:'1.2-2') + ' €'"
            />
            <epi-metric-card
              data-testid="current-value"
              label="Valeur actuelle"
              [value]="(data()!.summary.currentValue | number:'1.2-2') + ' €'"
            />
            <epi-metric-card
              data-testid="latent-gain-pct"
              label="Performance"
              [value]="(data()!.summary.latentGainPct | number:'1.2-2') + ' %'"
              [trend]="data()!.summary.latentGainPct >= 0 ? 'positive' : 'negative'"
            />
            <epi-metric-card
              data-testid="esg-score"
              label="Score ESG"
              [value]="formatEsgScore(data()!.summary.esgScoreWeighted)"
            />
          </section>

          <section class="portfolio-detail__holdings" aria-label="Positions">
            <div class="portfolio-detail__section-header">
              <h2 class="portfolio-detail__section-title">Positions</h2>
              <button
                data-testid="add-holding-btn"
                type="button"
                class="btn btn--primary"
                (click)="openAddHolding()"
              >
                + Ajouter une position
              </button>
            </div>

            @if (data()!.portfolio.holdings.length === 0) {
              <p data-testid="holdings-empty" class="portfolio-detail__holdings-empty">
                Aucune position pour ce portefeuille.
              </p>
            } @else {
              <table data-testid="holdings-table" class="holdings-table">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Ticker</th>
                    <th scope="col">Nom</th>
                    <th scope="col">Type</th>
                    <th scope="col" class="holdings-table__num">Quantité</th>
                    <th scope="col" class="holdings-table__num">Prix actuel</th>
                    <th scope="col" class="holdings-table__num">Score ESG</th>
                  </tr>
                </thead>
                <tbody>
                  @for (holding of data()!.portfolio.holdings; track holding.id) {
                    <tr data-testid="holding-row" class="holdings-table__row">
                      <td class="holdings-table__ticker">{{ holding.asset.ticker }}</td>
                      <td>{{ holding.asset.name }}</td>
                      <td>{{ holding.asset.type }}</td>
                      <td class="holdings-table__num">{{ holding.quantity }}</td>
                      <td class="holdings-table__num holdings-table__price">
                        {{ (holding.asset.manualPrice ?? holding.averagePrice) | number:'1.2-2' }} €
                        <button
                          data-testid="price-btn"
                          type="button"
                          class="btn-esg"
                          [attr.aria-label]="'Mettre à jour le prix de ' + holding.asset.ticker"
                          (click)="openPriceModal(holding)"
                        >✎</button>
                      </td>
                      <td class="holdings-table__actions">
                        <button
                          data-testid="delete-holding-btn"
                          type="button"
                          class="btn-esg btn-esg--danger"
                          [attr.aria-label]="'Supprimer la position ' + holding.asset.ticker"
                          (click)="openDeleteModal(holding)"
                        >🗑</button>
                      </td>
                      <td class="holdings-table__num holdings-table__esg">
                        <epi-score-badge [score]="getLatestEsgScore(holding)" />
                        <button
                          data-testid="esg-score-btn"
                          type="button"
                          class="btn-esg"
                          [attr.aria-label]="'Modifier le score ESG de ' + holding.asset.ticker"
                          (click)="openEsgModal(holding)"
                        >✎</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </section>
        }

      }

    </div>

    <!-- Modal de confirmation de suppression -->
    <epi-modal
      [open]="deleteModalOpen()"
      title="Supprimer la position"
      (closeRequest)="closeDeleteModal()"
    >
      <p class="confirm-text">
        Supprimer <strong>{{ deleteTargetTicker }}</strong> de ce portefeuille ?
        Cette action est irréversible.
      </p>

      <div slot="footer">
        <button
          type="button"
          class="btn btn--secondary"
          (click)="closeDeleteModal()"
          [disabled]="deleteSubmitting()"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn--danger"
          [disabled]="deleteSubmitting()"
          (click)="confirmDelete()"
        >
          {{ deleteSubmitting() ? 'Suppression…' : 'Supprimer' }}
        </button>
      </div>
    </epi-modal>

    <!-- Modal de prix actuel -->
    <epi-modal
      [open]="priceModalOpen()"
      [title]="'Prix actuel — ' + priceTargetTicker"
      (closeRequest)="closePriceModal()"
    >
      <form
        id="price-form"
        [formGroup]="priceForm"
        (ngSubmit)="onSubmitPrice()"
        class="holding-form"
      >
        <epi-form-field label="Prix actuel (€)" for="manual-price" [required]="true">
          <input
            id="manual-price"
            data-testid="input-manual-price"
            type="number"
            class="form-input"
            formControlName="manualPrice"
            min="0"
            step="0.01"
            placeholder="ex : 155.50"
          />
        </epi-form-field>

        <epi-form-field label="Date du cours" for="price-date">
          <input
            id="price-date"
            data-testid="input-price-date"
            type="date"
            class="form-input"
            formControlName="manualPriceDate"
          />
        </epi-form-field>

        @if (priceSubmitError()) {
          <p data-testid="price-submit-error" class="holding-form__error" role="alert">
            {{ priceSubmitError() }}
          </p>
        }
      </form>

      <div slot="footer">
        <button
          type="button"
          class="btn btn--secondary"
          (click)="closePriceModal()"
          [disabled]="priceSubmitting()"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="price-form"
          class="btn btn--primary"
          [disabled]="priceSubmitting() || priceForm.invalid"
        >
          {{ priceSubmitting() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </epi-modal>

    <!-- Modal de score ESG -->
    <epi-modal
      [open]="esgModalOpen()"
      [title]="'Score ESG — ' + esgTargetTicker"
      (closeRequest)="closeEsgModal()"
    >
      <form
        id="esg-score-form"
        [formGroup]="esgForm"
        (ngSubmit)="onSubmitEsgScore()"
        class="holding-form"
      >
        <epi-form-field label="Score (0 – 100)" for="esg-score-value" [required]="true">
          <input
            id="esg-score-value"
            data-testid="input-esg-score"
            type="range"
            class="form-range"
            formControlName="score"
            min="0"
            max="100"
            step="1"
          />
          <span class="form-range__display">{{ esgForm.value.score }}</span>
        </epi-form-field>

        <epi-form-field label="Source / Fournisseur" for="esg-provider" [required]="true">
          <input
            id="esg-provider"
            data-testid="input-esg-provider"
            type="text"
            class="form-input"
            formControlName="provider"
            placeholder="manual, MSCI, Sustainalytics…"
          />
        </epi-form-field>

        <epi-form-field label="Date" for="esg-date">
          <input
            id="esg-date"
            data-testid="input-esg-date"
            type="date"
            class="form-input"
            formControlName="date"
          />
        </epi-form-field>

        @if (esgSubmitError()) {
          <p data-testid="esg-submit-error" class="holding-form__error" role="alert">
            {{ esgSubmitError() }}
          </p>
        }
      </form>

      <div slot="footer">
        <button
          type="button"
          class="btn btn--secondary"
          (click)="closeEsgModal()"
          [disabled]="esgSubmitting()"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="esg-score-form"
          class="btn btn--primary"
          [disabled]="esgSubmitting() || esgForm.invalid"
        >
          {{ esgSubmitting() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </epi-modal>

    <!-- Modal d'ajout de position -->
    <epi-modal
      [open]="modalOpen()"
      title="Ajouter une position"
      (closeRequest)="closeModal()"
    >
      <form
        id="add-holding-form"
        [formGroup]="holdingForm"
        (ngSubmit)="onSubmitHolding()"
        class="holding-form"
      >
        <epi-form-field
          label="Ticker"
          for="holding-ticker"
          [required]="true"
          [error]="tickerError()"
        >
          <input
            id="holding-ticker"
            data-testid="input-ticker"
            type="text"
            class="form-input"
            formControlName="ticker"
            placeholder="ex : CW8, AAPL"
            autocomplete="off"
          />
        </epi-form-field>

        <epi-form-field
          label="Nom de l'actif"
          for="holding-name"
          [required]="true"
          [error]="assetNameError()"
        >
          <input
            id="holding-name"
            data-testid="input-asset-name"
            type="text"
            class="form-input"
            formControlName="assetName"
            placeholder="ex : Amundi MSCI World SRI"
          />
        </epi-form-field>

        <epi-form-field label="Type d'actif" for="holding-type" [required]="true">
          <select
            id="holding-type"
            data-testid="input-asset-type"
            class="form-select"
            formControlName="assetType"
          >
            @for (type of assetTypes; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
        </epi-form-field>

        <epi-form-field
          label="Quantité"
          for="holding-quantity"
          [required]="true"
          [error]="quantityError()"
        >
          <input
            id="holding-quantity"
            data-testid="input-quantity"
            type="number"
            class="form-input"
            formControlName="quantity"
            min="0.0001"
            step="any"
            placeholder="ex : 10"
          />
        </epi-form-field>

        <epi-form-field
          label="Prix moyen d'achat (€)"
          for="holding-price"
          [required]="true"
          [error]="priceError()"
        >
          <input
            id="holding-price"
            data-testid="input-avg-price"
            type="number"
            class="form-input"
            formControlName="averagePrice"
            min="0.01"
            step="any"
            placeholder="ex : 150.00"
          />
        </epi-form-field>

        @if (submitError()) {
          <p data-testid="submit-error" class="holding-form__error" role="alert">
            {{ submitError() }}
          </p>
        }
      </form>

      <div slot="footer">
        <button
          type="button"
          class="btn btn--secondary"
          (click)="closeModal()"
          [disabled]="submitting()"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="add-holding-form"
          class="btn btn--primary"
          [disabled]="submitting() || holdingForm.invalid"
        >
          {{ submitting() ? 'En cours…' : 'Ajouter' }}
        </button>
      </div>
    </epi-modal>
  `,
  styles: [`
    .portfolio-detail {
      max-width: 900px;
      margin: var(--space-8, 32px) auto;
      padding: 0 var(--space-4, 16px);
    }

    .portfolio-detail__back {
      display: inline-block;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-primary, #2D6A4F);
      text-decoration: none;
      margin-bottom: var(--space-6, 24px);
    }

    .portfolio-detail__back:hover {
      text-decoration: underline;
    }

    .portfolio-detail__title {
      font-size: var(--text-2xl, 1.5rem);
      font-weight: 700;
      color: var(--color-text, #1A1A2E);
      margin-bottom: var(--space-2, 8px);
    }

    .portfolio-detail__description {
      font-size: var(--text-base, 1rem);
      color: var(--color-text-muted, #4A4A6A);
      margin-bottom: var(--space-6, 24px);
    }

    .portfolio-detail__loading,
    .portfolio-detail__error {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-text-muted, #4A4A6A);
    }

    .portfolio-detail__error {
      color: var(--color-loss, #dc2626);
    }

    .portfolio-detail__metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-4, 16px);
      margin-bottom: var(--space-8, 32px);
    }

    .portfolio-detail__section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4, 16px);
    }

    .portfolio-detail__section-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-text, #1A1A2E);
      margin: 0;
    }

    .portfolio-detail__holdings-empty {
      color: var(--color-text-subtle, #6A6A8A);
      font-style: italic;
    }

    .holdings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm, 0.875rem);
    }

    .holdings-table th {
      text-align: left;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-weight: 600;
      color: var(--color-text-muted, #4A4A6A);
      border-bottom: 2px solid var(--color-border, #E8E8F0);
    }

    .holdings-table td {
      padding: var(--space-3, 12px);
      border-bottom: 1px solid var(--color-surface-alt, #F0F0F8);
      color: var(--color-text, #1A1A2E);
    }

    .holdings-table__row:hover td {
      background: var(--color-surface-alt, #F0F0F8);
    }

    .holdings-table__ticker {
      font-weight: 600;
      font-family: var(--font-mono, monospace);
    }

    .holdings-table__num {
      text-align: right;
    }

    /* Buttons */
    .btn {
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      border: 1px solid transparent;
      transition: background var(--transition-fast, 0.1s ease);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn--primary {
      background: var(--color-primary, #2D6A4F);
      color: #fff;
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #1B4332);
    }

    .btn--secondary {
      background: var(--color-surface, #fff);
      color: var(--color-text, #1A1A2E);
      border-color: var(--color-border, #E8E8F0);
    }

    .btn--secondary:hover:not(:disabled) {
      background: var(--color-surface-alt, #F0F0F8);
    }

    /* Form inside modal */
    .holding-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 16px);
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border: 1px solid var(--color-border, #E8E8F0);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text, #1A1A2E);
      background: var(--color-surface, #fff);
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-select:focus {
      outline: var(--focus-ring);
      border-color: var(--color-primary, #2D6A4F);
    }

    .holding-form__error {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-loss, #dc2626);
      margin: 0;
    }

    .form-range {
      width: 100%;
      accent-color: var(--color-primary, #2D6A4F);
    }

    .form-range__display {
      display: inline-block;
      min-width: 2.5rem;
      text-align: center;
      font-weight: var(--font-weight-bold, 700);
      font-family: var(--font-mono, monospace);
      color: var(--color-primary, #2D6A4F);
    }

    .holdings-table__esg {
      white-space: nowrap;
    }

    .btn-esg {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted, #4A4A6A);
      font-size: var(--text-sm, 0.875rem);
      padding: 0 var(--space-1, 4px);
      opacity: 0.5;
      transition: opacity var(--transition-fast, 0.1s ease);
    }

    .btn-esg:hover {
      opacity: 1;
      color: var(--color-primary, #2D6A4F);
    }

    .btn-esg--danger:hover {
      color: var(--color-loss, #dc2626);
    }

    .btn--danger {
      background: var(--color-loss, #dc2626);
      color: #fff;
      border: none;
    }

    .btn--danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .holdings-table__actions {
      width: 2rem;
      text-align: center;
    }

    .confirm-text {
      color: var(--color-text, #1A1A2E);
      line-height: 1.6;
      margin: 0;
    }
  `],
})
export class PortfolioDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly portfolioDetailService = inject(PortfolioDetailService);
  private readonly holdingService = inject(HoldingService);
  private readonly assetService = inject(AssetService);
  private readonly esgScoreService = inject(EsgScoreService);

  readonly assetTypes: AssetType[] = ['STOCK', 'ETF', 'BOND', 'CRYPTO', 'OTHER'];

  state      = signal<PageState>('loading');
  data       = signal<PortfolioDetailData | null>(null);
  modalOpen  = signal(false);
  assets     = signal<AssetItem[]>([]);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  holdingForm = new FormGroup({
    ticker:       new FormControl('',   [Validators.required]),
    assetName:    new FormControl('',   [Validators.required]),
    assetType:    new FormControl<AssetType>('STOCK', [Validators.required]),
    quantity:     new FormControl<number | null>(null, [Validators.required, Validators.min(0.0001)]),
    averagePrice: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });

  // ─── Suppression ────────────────────────────────────────────────────────────
  deleteModalOpen   = signal(false);
  deleteSubmitting  = signal(false);
  private deleteTargetId     = '';
  deleteTargetTicker = '';

  openDeleteModal(holding: Holding) {
    this.deleteTargetId     = holding.id;
    this.deleteTargetTicker = holding.asset.ticker;
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.deleteModalOpen.set(false);
  }

  confirmDelete() {
    this.deleteSubmitting.set(true);
    this.holdingService.remove(this.deleteTargetId).subscribe({
      next: () => {
        this.deleteSubmitting.set(false);
        this.deleteModalOpen.set(false);
        this.loadData();
      },
      error: () => {
        this.deleteSubmitting.set(false);
      },
    });
  }

  // ─── Prix actuel ────────────────────────────────────────────────────────────
  priceModalOpen   = signal(false);
  priceSubmitting  = signal(false);
  priceSubmitError = signal<string | null>(null);
  priceTargetAssetId = '';
  priceTargetTicker  = '';

  priceForm = new FormGroup({
    manualPrice:     new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    manualPriceDate: new FormControl(new Date().toISOString().slice(0, 10)),
  });

  // ─── ESG Score ──────────────────────────────────────────────────────────────
  esgModalOpen   = signal(false);
  esgSubmitting  = signal(false);
  esgSubmitError = signal<string | null>(null);
  esgTargetAssetId = '';
  esgTargetTicker  = '';

  esgForm = new FormGroup({
    score:    new FormControl<number>(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    provider: new FormControl('manual',  [Validators.required]),
    date:     new FormControl(new Date().toISOString().slice(0, 10)),
  });

  tickerError    = signal<string | null>(null);
  assetNameError = signal<string | null>(null);
  quantityError  = signal<string | null>(null);
  priceError     = signal<string | null>(null);

  private portfolioId = '';

  ngOnInit() {
    this.portfolioId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  openAddHolding() {
    this.modalOpen.set(true);
    this.submitError.set(null);
    this.holdingForm.reset({ assetType: 'STOCK' });
    this.assetService.findAll().subscribe({
      next: (assets) => this.assets.set(assets),
      error: () => this.assets.set([]),
    });
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onSubmitHolding() {
    if (this.holdingForm.invalid) return;

    const { ticker, assetName, assetType, quantity, averagePrice } = this.holdingForm.value;
    const existingAsset = this.assets().find(
      (a) => a.ticker.toUpperCase() === ticker!.toUpperCase()
    );

    this.submitting.set(true);
    this.submitError.set(null);

    const assetId$ = existingAsset
      ? [existingAsset.id]
      : null;

    if (existingAsset) {
      this.holdingService
        .create(this.portfolioId, {
          assetId: existingAsset.id,
          quantity: quantity!,
          averagePrice: averagePrice!,
        })
        .subscribe({
          next: () => this.onHoldingCreated(),
          error: (err) => this.onSubmitError(err),
        });
    } else {
      this.assetService
        .create({ ticker: ticker!, name: assetName!, type: assetType! })
        .pipe(
          switchMap((newAsset) =>
            this.holdingService.create(this.portfolioId, {
              assetId: newAsset.id,
              quantity: quantity!,
              averagePrice: averagePrice!,
            })
          )
        )
        .subscribe({
          next: () => this.onHoldingCreated(),
          error: (err) => this.onSubmitError(err),
        });
    }
  }

  formatEsgScore(score: number | null): string {
    if (score === null) return '—';
    return Math.round(score).toString();
  }

  openPriceModal(holding: Holding) {
    this.priceTargetAssetId = holding.asset.id;
    this.priceTargetTicker  = holding.asset.ticker;
    this.priceForm.reset({
      manualPrice:     holding.asset.manualPrice ?? holding.averagePrice,
      manualPriceDate: new Date().toISOString().slice(0, 10),
    });
    this.priceSubmitError.set(null);
    this.priceModalOpen.set(true);
  }

  closePriceModal() {
    this.priceModalOpen.set(false);
  }

  onSubmitPrice() {
    if (this.priceForm.invalid) return;

    const { manualPrice, manualPriceDate } = this.priceForm.value;
    const payload: UpdatePricePayload = {
      manualPrice: manualPrice!,
      ...(manualPriceDate ? { manualPriceDate } : {}),
    };

    this.priceSubmitting.set(true);
    this.priceSubmitError.set(null);

    this.assetService.updatePrice(this.priceTargetAssetId, payload).subscribe({
      next: () => {
        this.priceSubmitting.set(false);
        this.priceModalOpen.set(false);
        this.loadData();
      },
      error: () => {
        this.priceSubmitting.set(false);
        this.priceSubmitError.set('Erreur lors de la mise à jour du prix.');
      },
    });
  }

  openEsgModal(holding: Holding) {
    this.esgTargetAssetId = holding.asset.id;
    this.esgTargetTicker  = holding.asset.ticker;
    const currentScore    = this.getLatestEsgScore(holding);
    this.esgForm.reset({
      score:    currentScore ?? 0,
      provider: 'manual',
      date:     new Date().toISOString().slice(0, 10),
    });
    this.esgSubmitError.set(null);
    this.esgModalOpen.set(true);
  }

  closeEsgModal() {
    this.esgModalOpen.set(false);
  }

  onSubmitEsgScore() {
    if (this.esgForm.invalid) return;

    const { score, provider, date } = this.esgForm.value;
    this.esgSubmitting.set(true);
    this.esgSubmitError.set(null);

    const payload = { score: score!, provider: provider!, ...(date ? { date } : {}) };

    this.esgScoreService.create(this.esgTargetAssetId, payload).subscribe({
      next: () => {
        this.esgSubmitting.set(false);
        this.esgModalOpen.set(false);
        this.loadData();
      },
      error: () => {
        this.esgSubmitting.set(false);
        this.esgSubmitError.set('Une erreur est survenue lors de l\'enregistrement.');
      },
    });
  }

  getLatestEsgScore(holding: Holding): number | null {
    const scores = holding.asset.esgScores;
    if (!scores || scores.length === 0) return null;
    return scores.reduce((a: EsgScore, b: EsgScore) =>
      new Date(a.date) >= new Date(b.date) ? a : b
    ).score;
  }

  private loadData() {
    this.state.set('loading');
    this.portfolioDetailService.getPortfolioDetail(this.portfolioId).subscribe({
      next: (detail) => {
        this.data.set(detail);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  private onHoldingCreated() {
    this.submitting.set(false);
    this.modalOpen.set(false);
    this.holdingForm.reset({ assetType: 'STOCK' });
    this.loadData();
  }

  private onSubmitError(err: any) {
    this.submitting.set(false);
    if (err?.status === 409) {
      this.submitError.set('Cet actif est déjà dans le portefeuille.');
    } else {
      this.submitError.set('Une erreur est survenue. Veuillez réessayer.');
    }
  }
}
