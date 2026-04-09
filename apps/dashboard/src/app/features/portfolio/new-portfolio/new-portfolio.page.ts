import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PortfolioService } from '../portfolio.service';

@Component({
  selector: 'app-new-portfolio-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="new-portfolio">
      <h1 class="new-portfolio__title">Nouveau portefeuille</h1>

      <form class="new-portfolio__form" (ngSubmit)="onSubmit()" [formGroup]="form">

        <div class="form-field">
          <label for="portfolio-name" class="form-label">
            Nom <span aria-hidden="true">*</span>
          </label>
          <input
            id="portfolio-name"
            data-testid="input-name"
            type="text"
            class="form-input"
            formControlName="name"
            aria-required="true"
            [attr.aria-describedby]="showNameError() ? 'error-name' : null"
            placeholder="ex : PEA Éthique"
          />
          @if (showNameError()) {
            <p id="error-name" data-testid="error-name" class="form-error" role="alert">
              Le nom est obligatoire.
            </p>
          }
        </div>

        <div class="form-field">
          <label for="portfolio-description" class="form-label">
            Description <span class="form-label--optional">(optionnel)</span>
          </label>
          <textarea
            id="portfolio-description"
            data-testid="input-description"
            class="form-textarea"
            formControlName="description"
            rows="3"
            placeholder="ex : Mon portefeuille ISR long terme"
          ></textarea>
        </div>

        @if (submitError()) {
          <p data-testid="submit-error" class="form-submit-error" role="alert">
            La création est impossible. Vérifiez que l'API est démarrée.
          </p>
        }

        <div class="form-actions">
          <a
            data-testid="link-cancel"
            routerLink="/dashboard"
            class="btn btn--ghost"
          >Annuler</a>

          <button
            data-testid="btn-submit"
            type="submit"
            class="btn btn--primary"
            [disabled]="form.invalid || submitting()"
          >
            @if (submitting()) {
              <span data-testid="submit-loading" aria-hidden="true" class="btn__spinner"></span>
              <span class="sr-only">Création en cours…</span>
            } @else {
              Créer le portefeuille
            }
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .new-portfolio {
      max-width: 520px;
      margin: var(--space-8, 32px) auto;
      padding: 0 var(--space-4, 16px);
    }

    .new-portfolio__title {
      font-size: var(--text-2xl, 1.5rem);
      font-weight: 700;
      color: var(--color-neutral-900, #1A1A2E);
      margin-bottom: var(--space-6, 24px);
    }

    .new-portfolio__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-5, 20px);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    .form-label {
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-neutral-700, #3A3A5A);
    }

    .form-label--optional {
      font-weight: 400;
      color: var(--color-neutral-500, #6A6A8A);
    }

    .form-input,
    .form-textarea {
      border: 1px solid var(--color-neutral-300, #C5C5D8);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-size: var(--text-base, 1rem);
      color: var(--color-neutral-900, #1A1A2E);
      background: #fff;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      width: 100%;
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
      border-color: var(--color-primary, #2D6A4F);
      box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.15);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-error {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-danger, #E76F51);
    }

    .form-submit-error {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-danger, #E76F51);
      background: rgba(231, 111, 81, 0.08);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-3, 12px);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
      margin-top: var(--space-2, 8px);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-5, 20px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: background 0.15s ease, opacity 0.15s ease;
    }

    .btn--primary {
      background: var(--color-primary, #2D6A4F);
      color: #fff;
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #1B4332);
    }

    .btn--primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn--ghost {
      background: transparent;
      color: var(--color-neutral-600, #4A4A6A);
      border: 1px solid var(--color-neutral-300, #C5C5D8);
    }

    .btn--ghost:hover {
      background: var(--color-neutral-100, #F8F9FA);
    }

    .btn__spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

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
export class NewPortfolioPage {
  private readonly portfolioService = inject(PortfolioService);
  private readonly router = inject(Router);

  submitting = signal(false);
  submitError = signal(false);

  nameControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  descriptionControl = new FormControl('', { nonNullable: true });

  form = new FormGroup({
    name: this.nameControl,
    description: this.descriptionControl,
  });

  showNameError() {
    return this.nameControl.invalid && this.nameControl.touched;
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.submitError.set(false);

    const description = this.descriptionControl.value.trim() || null;

    this.portfolioService.createPortfolio({
      name: this.nameControl.value.trim(),
      description,
    }).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.submitError.set(true),
    });
  }
}
