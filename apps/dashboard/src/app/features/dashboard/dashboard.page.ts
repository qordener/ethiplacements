import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService, PortfolioCardData } from './dashboard.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PortfolioCard } from '../../shared/components/portfolio-card/portfolio-card';

type PageState = 'loading' | 'loaded' | 'empty' | 'error';
type EsgFilter = 'all' | 'high' | 'medium' | 'low' | 'na';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PortfolioCard, RouterLink, ReactiveFormsModule],
  template: `
    @switch (state()) {
      @case ('loading') {
        <div data-testid="dashboard-loading" class="dashboard-loading" aria-live="polite" aria-busy="true">
          <span class="sr-only">Chargement des portefeuilles…</span>
          <div class="spinner"></div>
        </div>
      }
      @case ('error') {
        <div data-testid="dashboard-error" class="dashboard-error" role="alert">
          <p>Le chargement des portefeuilles est impossible. Vérifiez que l'API est démarrée.</p>
        </div>
      }
      @case ('empty') {
        <div data-testid="dashboard-empty" class="dashboard-empty" role="status">
          <p>Aucun portefeuille pour l'instant.</p>
          <a
            data-testid="cta-create-portfolio"
            routerLink="/portfolio/new"
            class="dashboard-empty__cta"
          >Créer mon premier portefeuille</a>
        </div>
      }
      @case ('loaded') {
        @if (editModalOpen()) {
          <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
            <div data-testid="edit-portfolio-modal" class="modal" [formGroup]="editForm">
              <h2 id="edit-modal-title" class="modal__title">Modifier le portefeuille</h2>
              <div class="modal-form-field">
                <label for="edit-portfolio-name" class="modal-form-label">Nom *</label>
                <input
                  id="edit-portfolio-name"
                  data-testid="edit-input-name"
                  type="text"
                  class="modal-form-input"
                  formControlName="name"
                />
              </div>
              <div class="modal-form-field">
                <label for="edit-portfolio-description" class="modal-form-label">Description <span class="modal-form-optional">(optionnel)</span></label>
                <textarea
                  id="edit-portfolio-description"
                  data-testid="edit-input-description"
                  class="modal-form-input"
                  formControlName="description"
                  rows="3"
                ></textarea>
              </div>
              <div class="modal__actions">
                <button class="btn btn--ghost" (click)="closeEditModal()" [disabled]="editSubmitting()">Annuler</button>
                <button
                  data-testid="edit-btn-save"
                  class="btn btn--primary"
                  (click)="confirmEdit()"
                  [disabled]="editForm.invalid || editSubmitting()"
                >
                  @if (editSubmitting()) { Enregistrement… } @else { Enregistrer }
                </button>
              </div>
            </div>
          </div>
        }

        @if (deleteModalOpen()) {
          <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div data-testid="delete-portfolio-modal" class="modal">
              <h2 id="delete-modal-title" class="modal__title">Supprimer ce portefeuille ?</h2>
              <p class="modal__body">
                Vous allez supprimer <strong>{{ deleteTargetName() }}</strong>. Cette action est irréversible.
              </p>
              <div class="modal__actions">
                <button class="btn btn--ghost" (click)="closeDeleteModal()" [disabled]="deleteSubmitting()">Annuler</button>
                <button class="btn btn--danger" (click)="confirmDelete()" [disabled]="deleteSubmitting()">
                  @if (deleteSubmitting()) { Suppression… } @else { Supprimer }
                </button>
              </div>
            </div>
          </div>
        }

        <div data-testid="esg-filter-bar" class="esg-filter-bar" role="group" aria-label="Filtrer par score ESG">
          @for (f of filters; track f.value) {
            <button
              [attr.data-testid]="'filter-' + f.value"
              [attr.aria-pressed]="esgFilter() === f.value ? 'true' : 'false'"
              [class.esg-filter-bar__btn--active]="esgFilter() === f.value"
              class="esg-filter-bar__btn"
              (click)="setFilter(f.value)"
            >{{ f.label }}</button>
          }
        </div>
        @if (filteredPortfolios().length === 0) {
          <p data-testid="filter-no-results" class="filter-no-results">
            Aucun portefeuille ne correspond à ce filtre.
          </p>
        }
        <div class="dashboard-grid">
          @for (portfolio of filteredPortfolios(); track portfolio.id) {
            <app-portfolio-card
              [id]="portfolio.id"
              [name]="portfolio.name"
              [description]="portfolio.description"
              [totalValue]="portfolio.totalValue"
              [changePercent]="portfolio.changePercent"
              [esgScore]="portfolio.esgScore"
              (cardClick)="onCardClick($event)"
              (editClick)="openEditModal(portfolio)"
              (deleteClick)="openDeleteModal($event, portfolio.name)"
            />
          }
        </div>
      }
    }
  `,
  styles: [`
    .dashboard-loading {
      display: flex;
      justify-content: center;
      padding: var(--space-8, 32px);
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-neutral-200, #E2E4E9);
      border-top-color: var(--color-primary, #2D6A4F);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .dashboard-error,
    .dashboard-empty {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-neutral-600, #4A4A6A);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4, 16px);
    }

    .dashboard-empty__cta {
      display: inline-block;
      background: var(--color-primary, #2D6A4F);
      color: #fff;
      text-decoration: none;
      padding: var(--space-2, 8px) var(--space-5, 20px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      transition: background 0.15s ease;
    }
    .dashboard-empty__cta:hover {
      background: var(--color-primary-dark, #1B4332);
    }
    .dashboard-error {
      color: var(--color-danger, #E76F51);
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal {
      background: #fff;
      border-radius: var(--radius-md, 8px);
      padding: var(--space-6, 24px);
      max-width: 400px;
      width: 90%;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 16px);
    }
    .modal__title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-neutral-900, #1A1A2E);
      margin: 0;
    }
    .modal__body {
      color: var(--color-neutral-700, #3A3A5A);
      font-size: var(--text-sm, 0.875rem);
      margin: 0;
    }
    .modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background 0.15s ease, opacity 0.15s ease;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--ghost {
      background: transparent;
      color: var(--color-neutral-600, #4A4A6A);
      border: 1px solid var(--color-neutral-300, #C5C5D8);
    }
    .btn--ghost:hover:not(:disabled) { background: var(--color-neutral-100, #F8F9FA); }
    .btn--danger {
      background: var(--color-danger, #E76F51);
      color: #fff;
    }
    .btn--danger:hover:not(:disabled) { background: #c9553a; }
    .btn--primary {
      background: var(--color-primary, #2D6A4F);
      color: #fff;
    }
    .btn--primary:hover:not(:disabled) { background: var(--color-primary-dark, #1B4332); }

    .modal-form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }
    .modal-form-label {
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-neutral-700, #3A3A5A);
    }
    .modal-form-optional {
      font-weight: 400;
      color: var(--color-neutral-500, #6A6A8A);
    }
    .modal-form-input {
      border: 1px solid var(--color-neutral-300, #C5C5D8);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-size: var(--text-base, 1rem);
      color: var(--color-neutral-900, #1A1A2E);
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .modal-form-input:focus {
      border-color: var(--color-primary, #2D6A4F);
      box-shadow: 0 0 0 3px rgba(45,106,79,0.15);
    }
    textarea.modal-form-input { resize: vertical; min-height: 72px; }

    .esg-filter-bar {
      display: flex;
      gap: var(--space-2, 8px);
      padding: var(--space-4, 16px) var(--space-4, 16px) 0;
      flex-wrap: wrap;
    }
    .esg-filter-bar__btn {
      padding: var(--space-1, 4px) var(--space-3, 12px);
      border: 1px solid var(--color-neutral-300, #D1D5DB);
      border-radius: var(--radius-full, 9999px);
      background: transparent;
      font-size: var(--text-sm, 0.875rem);
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
      color: var(--color-neutral-700, #374151);
    }
    .esg-filter-bar__btn:hover {
      background: var(--color-neutral-100, #F3F4F6);
    }
    .esg-filter-bar__btn--active {
      background: var(--color-primary, #2D6A4F);
      color: #fff;
      border-color: var(--color-primary, #2D6A4F);
    }

    .filter-no-results {
      text-align: center;
      padding: var(--space-8, 32px) var(--space-4, 16px);
      color: var(--color-neutral-500, #6A6A8A);
      font-size: var(--text-sm, 0.875rem);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4, 16px);
      padding: var(--space-4, 16px);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly router = inject(Router);

  state = signal<PageState>('loading');
  portfolios = signal<PortfolioCardData[]>([]);
  esgFilter = signal<EsgFilter>('all');

  editModalOpen = signal(false);
  editSubmitting = signal(false);
  editTargetId = signal<string>('');

  editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });

  deleteModalOpen = signal(false);
  deleteSubmitting = signal(false);
  deleteTargetId = signal<string>('');
  deleteTargetName = signal<string>('');

  filteredPortfolios = computed(() => {
    const filter = this.esgFilter();
    const all = this.portfolios();
    if (filter === 'all') return all;
    if (filter === 'na') return all.filter(p => p.esgScore == null);
    if (filter === 'high') return all.filter(p => p.esgScore != null && p.esgScore >= 70);
    if (filter === 'medium') return all.filter(p => p.esgScore != null && p.esgScore >= 40 && p.esgScore < 70);
    if (filter === 'low') return all.filter(p => p.esgScore != null && p.esgScore < 40);
    return all;
  });

  readonly filters: { value: EsgFilter; label: string }[] = [
    { value: 'all',    label: 'Tous' },
    { value: 'high',   label: 'Élevé ≥70' },
    { value: 'medium', label: 'Moyen 40–69' },
    { value: 'low',    label: 'Faible <40' },
    { value: 'na',     label: 'Non noté' },
  ];

  setFilter(filter: EsgFilter) {
    this.esgFilter.set(filter);
  }

  openEditModal(portfolio: PortfolioCardData) {
    this.editTargetId.set(portfolio.id);
    this.editForm.setValue({
      name: portfolio.name,
      description: portfolio.description ?? '',
    });
    this.editModalOpen.set(true);
  }

  closeEditModal() {
    this.editModalOpen.set(false);
  }

  confirmEdit() {
    if (this.editForm.invalid) return;
    this.editSubmitting.set(true);
    const description = this.editForm.controls['description'].value.trim() || null;
    this.portfolioService.updatePortfolio(this.editTargetId(), {
      name: this.editForm.controls['name'].value.trim(),
      description,
    }).subscribe({
      next: (updated) => {
        this.portfolios.update(list =>
          list.map(p => p.id === this.editTargetId()
            ? { ...p, name: updated.name, description: updated.description }
            : p
          )
        );
        this.editModalOpen.set(false);
        this.editSubmitting.set(false);
      },
      error: () => {
        this.editSubmitting.set(false);
      },
    });
  }

  openDeleteModal(id: string, name: string) {
    this.deleteTargetId.set(id);
    this.deleteTargetName.set(name);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.deleteModalOpen.set(false);
  }

  confirmDelete() {
    this.deleteSubmitting.set(true);
    this.portfolioService.removePortfolio(this.deleteTargetId()).subscribe({
      next: () => {
        this.portfolios.update(list => list.filter(p => p.id !== this.deleteTargetId()));
        if (this.portfolios().length === 0) this.state.set('empty');
        this.deleteModalOpen.set(false);
        this.deleteSubmitting.set(false);
      },
      error: () => {
        this.deleteSubmitting.set(false);
      },
    });
  }

  ngOnInit() {
    this.dashboardService.getPortfoliosWithSummary().subscribe({
      next: (data) => {
        this.portfolios.set(data);
        this.state.set(data.length === 0 ? 'empty' : 'loaded');
      },
      error: () => {
        this.state.set('error');
      },
    });
  }

  onCardClick(id: string) {
    this.router.navigate(['/portfolio', id]);
  }
}
