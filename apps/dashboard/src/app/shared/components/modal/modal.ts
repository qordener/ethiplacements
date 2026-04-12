import { Component, input, output, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

let modalIdCounter = 0;

@Component({
  selector: 'epi-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div
        data-testid="modal-backdrop"
        class="modal-backdrop"
        (click)="onBackdropClick($event)"
      >
        <div
          data-testid="modal-dialog"
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h2 [id]="titleId" data-testid="modal-title" class="modal-title">
              {{ title() }}
            </h2>
            <button
              data-testid="modal-close-btn"
              class="modal-close"
              type="button"
              aria-label="Fermer"
              (click)="closeRequest.emit()"
            >✕</button>
          </div>

          <div class="modal-body">
            <ng-content />
          </div>

          <div class="modal-footer">
            <ng-content select="[slot=footer]" />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(26, 26, 46, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal, 200);
      padding: var(--space-4, 16px);
    }

    .modal-dialog {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-5, 20px) var(--space-6, 24px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #e8e8f0);
    }

    .modal-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #1a1a2e);
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted, #4a4a6a);
      font-size: var(--text-lg, 1.125rem);
      padding: var(--space-1, 4px);
      border-radius: var(--radius-sm, 4px);
      line-height: 1;
      transition: background var(--transition-fast, 0.1s ease);
    }

    .modal-close:hover {
      background: var(--color-surface-alt, #f0f0f8);
    }

    .modal-body {
      padding: var(--space-6, 24px);
      flex: 1;
    }

    .modal-footer {
      padding: var(--space-4, 16px) var(--space-6, 24px);
      border-top: 1px solid var(--color-border, #e8e8f0);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 12px);
    }

    .modal-footer:empty {
      display: none;
    }
  `],
})
export class Modal implements OnInit, OnDestroy {
  open  = input.required<boolean>();
  title = input.required<string>();
  closeRequest = output<void>();

  readonly titleId = `modal-title-${++modalIdCounter}`;

  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('keydown', this.onKeydown);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('keydown', this.onKeydown);
    }
  }

  onBackdropClick(event: MouseEvent) {
    this.closeRequest.emit();
  }

  private readonly onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open()) {
      this.closeRequest.emit();
    }
  };
}
