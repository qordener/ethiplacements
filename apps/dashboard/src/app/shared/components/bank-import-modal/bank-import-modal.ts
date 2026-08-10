import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Modal } from '../modal/modal';
import { FormField } from '../form-field/form-field';
import { BankImportService, BankImportResult } from '../../../features/portfolio/bank-import.service';

@Component({
  selector: 'epi-bank-import-modal',
  standalone: true,
  imports: [DecimalPipe, Modal, FormField],
  template: `
    <epi-modal
      [open]="modalOpen()"
      title="Importer un relevé OFX"
      (closeRequest)="close()"
    >
      <p class="import-hint">
        Relevé de compte-titres/PEA uniquement (format .ofx). Le fichier n'est jamais conservé —
        seules les opérations que vous confirmez sont enregistrées.
      </p>

      <epi-form-field label="Fichier .ofx" for="bank-import-file" [required]="true">
        <input
          id="bank-import-file"
          data-testid="bank-import-file-input"
          type="file"
          accept=".ofx"
          class="form-input"
          (change)="onFileSelected($event)"
        />
      </epi-form-field>

      @if (submitting()) {
        <p data-testid="bank-import-loading" role="status">Analyse du fichier…</p>
      }

      @if (error()) {
        <p data-testid="bank-import-error" class="import-error" role="alert">{{ error() }}</p>
      }

      @if (result(); as r) {
        <div class="import-preview">
          @if (r.transactions.length === 0 && r.deposits.length === 0) {
            <p data-testid="bank-import-empty">Aucune opération de compte-titres trouvée dans ce fichier.</p>
          } @else {
            <table class="import-preview__table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Actif</th>
                  <th scope="col" class="import-preview__num">Montant</th>
                  <th scope="col">Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (row of r.transactions; track row.fitId) {
                  <tr data-testid="bank-import-transaction-row">
                    <td>{{ row.date }}</td>
                    <td>{{ row.kind }}</td>
                    <td>{{ row.securityTicker ?? row.securityName }}</td>
                    <td class="import-preview__num">{{ row.amount | number:'1.2-2' }} €</td>
                    <td data-testid="bank-import-row-status">
                      @if (row.imported) {
                        ✓ importé
                      } @else if (row.error) {
                        ⚠ {{ row.error }}
                      } @else if (row.skippedReason) {
                        {{ row.skippedReason }}
                      } @else {
                        prêt
                      }
                    </td>
                  </tr>
                }
                @for (row of r.deposits; track row.fitId) {
                  <tr data-testid="bank-import-deposit-row">
                    <td>{{ row.date }}</td>
                    <td>VERSEMENT</td>
                    <td>{{ row.label }}</td>
                    <td class="import-preview__num">{{ row.amount | number:'1.2-2' }} €</td>
                    <td data-testid="bank-import-row-status">
                      @if (row.imported) {
                        ✓ importé
                      } @else if (row.error) {
                        ⚠ {{ row.error }}
                      } @else {
                        prêt
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            <p class="import-hint">{{ readyCount() }} opération(s) prête(s) à être importée(s) sur {{ totalCount() }}.</p>
          }
        </div>
      }

      <div slot="footer">
        <button type="button" class="btn btn--secondary" (click)="close()">Fermer</button>
        @if (result() && !confirmed() && readyCount() > 0) {
          <button
            data-testid="bank-import-confirm-btn"
            type="button"
            class="btn btn--primary"
            [disabled]="submitting()"
            (click)="confirmImport()"
          >
            {{ submitting() ? 'Import…' : 'Confirmer l\\'import' }}
          </button>
        }
      </div>
    </epi-modal>
  `,
  styles: [`
    .import-hint {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-subtle, #6a6a8a);
      margin: var(--space-2, 8px) 0;
    }

    .import-error {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-danger, #dc2626);
      margin: var(--space-2, 8px) 0;
    }

    .import-preview {
      margin-top: var(--space-3, 12px);
      max-height: 320px;
      overflow-y: auto;
    }

    .import-preview__table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm, 0.875rem);
    }

    .import-preview__table th {
      text-align: left;
      padding: var(--space-2, 8px);
      font-weight: 600;
      color: var(--color-text-muted, #4a4a6a);
      border-bottom: 2px solid var(--color-border, #e8e8f0);
      position: sticky;
      top: 0;
      background: var(--color-surface, #fff);
    }

    .import-preview__table td {
      padding: var(--space-2, 8px);
      border-bottom: 1px solid var(--color-surface-alt, #f0f0f8);
    }

    .import-preview__num {
      text-align: right;
    }

    .btn {
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background .15s ease, opacity .15s ease;
    }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn--secondary {
      background: var(--color-surface-alt, #f0f0f8);
      color: var(--color-text, #1a1a2e);
    }
    .btn--primary {
      background: var(--color-primary, #2d6a4f);
      color: #fff;
    }
    .btn--primary:hover:not(:disabled) { background: var(--color-primary-dark, #1b4332); }
  `],
})
export class BankImportModal {
  private readonly bankImportService = inject(BankImportService);

  portfolioId = input.required<string>();
  imported = output<void>();

  modalOpen  = signal(false);
  submitting = signal(false);
  result     = signal<BankImportResult | null>(null);
  error      = signal<string | null>(null);
  confirmed  = signal(false);
  private file: File | null = null;

  totalCount = computed(() => {
    const r = this.result();
    return r ? r.transactions.length + r.deposits.length : 0;
  });

  readyCount = computed(() => {
    const r = this.result();
    if (!r) return 0;
    const readyTx = r.transactions.filter((row) => !row.imported && !row.error && !row.skippedReason).length;
    const readyDep = r.deposits.filter((row) => !row.imported && !row.error).length;
    return readyTx + readyDep;
  });

  open() {
    this.modalOpen.set(true);
    this.result.set(null);
    this.error.set(null);
    this.confirmed.set(false);
    this.file = null;
  }

  close() {
    this.modalOpen.set(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.file = file;
    this.result.set(null);
    this.error.set(null);
    this.confirmed.set(false);
    this.submitting.set(true);

    this.bankImportService.importOfx(this.portfolioId(), file, false).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.result.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(err.error?.message ?? "Impossible d'analyser ce fichier OFX.");
      },
    });
  }

  confirmImport() {
    if (!this.file) return;

    this.submitting.set(true);
    this.error.set(null);

    this.bankImportService.importOfx(this.portfolioId(), this.file, true).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.result.set(result);
        this.confirmed.set(true);
        this.imported.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(err.error?.message ?? "L'import a échoué.");
      },
    });
  }
}
