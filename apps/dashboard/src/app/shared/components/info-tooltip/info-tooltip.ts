import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="info-tooltip-wrapper">
      <button
        type="button"
        class="info-trigger"
        data-testid="info-trigger"
        [attr.aria-label]="label()"
        [attr.aria-expanded]="isOpen().toString()"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        (keydown.escape)="close()"
      >ⓘ</button>

      @if (isOpen()) {
        <span
          class="info-tooltip-panel"
          data-testid="info-tooltip"
          role="tooltip"
        >{{ text() }}</span>
      }
    </span>
  `,
  styles: [`
    .info-tooltip-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .info-trigger {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-neutral-600, #4A4A6A);
      font-size: var(--text-sm, 0.875rem);
      padding: 0 var(--space-1, 4px);
      line-height: 1;
    }
    .info-trigger:hover, .info-trigger:focus {
      color: var(--color-primary, #2D6A4F);
      outline: 2px solid var(--color-primary-light, #52B788);
      border-radius: var(--radius-sm, 4px);
    }
    .info-tooltip-panel {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-neutral-900, #1A1A2E);
      color: #fff;
      font-size: var(--text-xs, 0.75rem);
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border-radius: var(--radius-md, 8px);
      white-space: normal;
      width: 220px;
      box-shadow: var(--shadow-md);
      z-index: 10;
      line-height: 1.5;
    }
  `],
})
export class InfoTooltip {
  text = input.required<string>();
  label = input<string>('En savoir plus');

  isOpen = signal(false);

  toggle() {
    this.isOpen.update(v => !v);
  }

  close() {
    this.isOpen.set(false);
  }
}
