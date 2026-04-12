import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'epi-form-field',
  standalone: true,
  template: `
    <div
      data-testid="field-wrapper"
      class="form-field"
      [class.form-field--error]="!!error()"
    >
      <label [for]="for()" class="form-field__label">
        {{ label() }}
        @if (required()) {
          <span data-testid="required-indicator" class="form-field__required" aria-hidden="true"> *</span>
        }
      </label>

      <ng-content />

      @if (error()) {
        <p data-testid="field-error" class="form-field__error" role="alert">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p data-testid="field-hint" class="form-field__hint">
          {{ hint() }}
        </p>
      }
    </div>
  `,
  styles: [`
    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    .form-field__label {
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text, #1a1a2e);
    }

    .form-field__required {
      color: var(--color-danger, #dc2626);
    }

    .form-field__error {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-danger, #dc2626);
      margin: 0;
    }

    .form-field__hint {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-subtle, #6a6a8a);
      margin: 0;
    }
  `],
})
export class FormField {
  label    = input.required<string>();
  for      = input.required<string>();
  required = input<boolean>(false);
  error    = input<string | null>(null);
  hint     = input<string | null>(null);
}
