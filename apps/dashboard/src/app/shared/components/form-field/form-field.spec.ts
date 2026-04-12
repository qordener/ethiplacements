import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormField } from './form-field';

// ─── Composant hôte pour les tests de ng-content ─────────────────────────────

@Component({
  standalone: true,
  imports: [FormField],
  template: `
    <epi-form-field
      [label]="label"
      [for]="forId"
      [required]="required"
      [error]="error"
      [hint]="hint"
    >
      <input id="test-input" data-testid="slotted-input" type="text" />
    </epi-form-field>
  `,
})
class HostComponent {
  label = 'Nom';
  forId = 'test-input';
  required = false;
  error: string | null = null;
  hint: string | null = null;
}

describe('FormField', () => {
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

  it('should create', () => {
    expect(fixture.nativeElement.querySelector('epi-form-field')).toBeTruthy();
  });

  // ─── Label ───────────────────────────────────────────────────────────────────

  describe('label', () => {
    it('should display the label text', () => {
      const label = fixture.nativeElement.querySelector('label');
      expect(label.textContent).toContain('Nom');
    });

    it('should associate label with input via for attribute', () => {
      const label = fixture.nativeElement.querySelector('label');
      expect(label.getAttribute('for')).toBe('test-input');
    });

    it('should display required indicator when required is true', () => {
      host.required = true;
      fixture.detectChanges();
      const indicator = fixture.nativeElement.querySelector('[data-testid="required-indicator"]');
      expect(indicator).toBeTruthy();
    });

    it('should not display required indicator when required is false', () => {
      const indicator = fixture.nativeElement.querySelector('[data-testid="required-indicator"]');
      expect(indicator).toBeNull();
    });
  });

  // ─── Slot contenu ─────────────────────────────────────────────────────────────

  describe('contenu (ng-content)', () => {
    it('should render the slotted input', () => {
      const input = fixture.nativeElement.querySelector('[data-testid="slotted-input"]');
      expect(input).toBeTruthy();
    });
  });

  // ─── Erreur ──────────────────────────────────────────────────────────────────

  describe('erreur', () => {
    it('should not display error message when error is null', () => {
      const error = fixture.nativeElement.querySelector('[data-testid="field-error"]');
      expect(error).toBeNull();
    });

    it('should display error message when error is provided', () => {
      host.error = 'Ce champ est obligatoire.';
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('[data-testid="field-error"]');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('Ce champ est obligatoire.');
    });

    it('should have role="alert" on error message', () => {
      host.error = 'Erreur';
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('[data-testid="field-error"]');
      expect(error.getAttribute('role')).toBe('alert');
    });

    it('should apply error state class when error is present', () => {
      host.error = 'Erreur';
      fixture.detectChanges();
      const field = fixture.nativeElement.querySelector('[data-testid="field-wrapper"]');
      expect(field.classList.contains('form-field--error')).toBe(true);
    });

    it('should not apply error state class when no error', () => {
      const field = fixture.nativeElement.querySelector('[data-testid="field-wrapper"]');
      expect(field.classList.contains('form-field--error')).toBe(false);
    });
  });

  // ─── Hint ────────────────────────────────────────────────────────────────────

  describe('hint', () => {
    it('should not display hint when hint is null', () => {
      const hint = fixture.nativeElement.querySelector('[data-testid="field-hint"]');
      expect(hint).toBeNull();
    });

    it('should display hint text when provided', () => {
      host.hint = 'ex : PEA Éthique';
      fixture.detectChanges();
      const hint = fixture.nativeElement.querySelector('[data-testid="field-hint"]');
      expect(hint).toBeTruthy();
      expect(hint.textContent).toContain('ex : PEA Éthique');
    });

    it('should not show hint when error is also present (error takes priority)', () => {
      host.hint = 'Aide';
      host.error = 'Erreur';
      fixture.detectChanges();
      const hint = fixture.nativeElement.querySelector('[data-testid="field-hint"]');
      expect(hint).toBeNull();
    });
  });
});
