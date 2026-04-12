import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { vi } from 'vitest';
import { Modal } from './modal';

@Component({
  standalone: true,
  imports: [Modal],
  template: `
    <epi-modal
      [open]="open"
      [title]="title"
      (closeRequest)="onClose()"
    >
      <p data-testid="modal-body-content">Contenu du modal</p>
      <div slot="footer">
        <button data-testid="confirm-btn">Confirmer</button>
      </div>
    </epi-modal>
  `,
})
class HostComponent {
  open = false;
  title = 'Titre du modal';
  onClose = vi.fn();
}

describe('Modal', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Ouverture / fermeture ────────────────────────────────────────────────────

  describe('ouverture / fermeture', () => {
    it('should not display modal content when open is false', () => {
      const dialog = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(dialog).toBeNull();
    });

    it('should display modal content when open is true', () => {
      host.open = true;
      fixture.detectChanges();
      const dialog = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should display the title when open', () => {
      host.open = true;
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('[data-testid="modal-title"]');
      expect(title.textContent).toContain('Titre du modal');
    });

    it('should render slotted body content when open', () => {
      host.open = true;
      fixture.detectChanges();
      const body = fixture.nativeElement.querySelector('[data-testid="modal-body-content"]');
      expect(body).toBeTruthy();
    });
  });

  // ─── Fermeture ────────────────────────────────────────────────────────────────

  describe('déclencheurs de fermeture', () => {
    beforeEach(() => {
      host.open = true;
      fixture.detectChanges();
    });

    it('should emit closeRequest when clicking the close button', () => {
      const closeBtn = fixture.nativeElement.querySelector('[data-testid="modal-close-btn"]');
      closeBtn.click();
      fixture.detectChanges();
      expect(host.onClose).toHaveBeenCalledTimes(1);
    });

    it('should emit closeRequest when clicking the backdrop', () => {
      const backdrop = fixture.nativeElement.querySelector('[data-testid="modal-backdrop"]');
      backdrop.click();
      fixture.detectChanges();
      expect(host.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not emit closeRequest when clicking inside the dialog', () => {
      const dialog = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      dialog.click();
      fixture.detectChanges();
      expect(host.onClose).not.toHaveBeenCalled();
    });

    it('should emit closeRequest when pressing Escape', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      fixture.detectChanges();
      expect(host.onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    beforeEach(() => {
      host.open = true;
      fixture.detectChanges();
    });

    it('should have role="dialog" on the modal dialog element', () => {
      const dialog = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(dialog.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true"', () => {
      const dialog = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby pointing to the title', () => {
      const dialog = fixture.nativeElement.querySelector('[data-testid="modal-dialog"]');
      const title = fixture.nativeElement.querySelector('[data-testid="modal-title"]');
      expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    });

    it('should have a close button with aria-label', () => {
      const closeBtn = fixture.nativeElement.querySelector('[data-testid="modal-close-btn"]');
      expect(closeBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('should display backdrop when open', () => {
      const backdrop = fixture.nativeElement.querySelector('[data-testid="modal-backdrop"]');
      expect(backdrop).toBeTruthy();
    });
  });
});
