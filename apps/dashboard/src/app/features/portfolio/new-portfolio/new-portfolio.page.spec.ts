import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { vi } from 'vitest';

@Component({ standalone: true, template: '' })
class StubComponent {}

import { NewPortfolioPage } from './new-portfolio.page';
import { PortfolioService } from '../portfolio.service';

const MOCK_CREATED = {
  id: 'cuid-new',
  name: 'Mon PEA',
  description: null,
  createdAt: '',
  updatedAt: '',
};

describe('NewPortfolioPage', () => {
  let fixture: ComponentFixture<NewPortfolioPage>;
  let component: NewPortfolioPage;
  let mockPortfolioService: { createPortfolio: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    mockPortfolioService = { createPortfolio: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NewPortfolioPage],
      providers: [
        provideRouter([{ path: 'dashboard', component: StubComponent }]),
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(NewPortfolioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Structure du formulaire ──────────────────────────────────────────────────

  describe('structure du formulaire', () => {
    it('should display a name input', () => {
      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]');
      expect(input).toBeTruthy();
    });

    it('should display a description textarea', () => {
      const textarea = fixture.nativeElement.querySelector('[data-testid="input-description"]');
      expect(textarea).toBeTruthy();
    });

    it('should display a submit button', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="btn-submit"]');
      expect(btn).toBeTruthy();
    });

    it('should display a cancel link back to dashboard', () => {
      const cancel = fixture.nativeElement.querySelector('[data-testid="link-cancel"]');
      expect(cancel).toBeTruthy();
    });
  });

  // ─── Validation ───────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('should disable the submit button when name is empty', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="btn-submit"]');
      expect(btn.disabled).toBe(true);
    });

    it('should enable the submit button when name is filled', async () => {
      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]');
      input.value = 'Mon PEA';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('[data-testid="btn-submit"]');
      expect(btn.disabled).toBe(false);
    });

    it('should show an error message when name is touched and empty', async () => {
      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]');
      input.dispatchEvent(new Event('focus'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('[data-testid="error-name"]');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('obligatoire');
    });

    it('should not show name error when name is valid', () => {
      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]');
      input.value = 'Mon PEA';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('[data-testid="error-name"]');
      expect(error).toBeNull();
    });
  });

  // ─── Soumission — succès ──────────────────────────────────────────────────────

  describe('soumission — succès', () => {
    it('should call createPortfolio with form values on submit', () => {
      mockPortfolioService.createPortfolio.mockReturnValue(of(MOCK_CREATED));
      component.nameControl.setValue('Mon PEA');
      component.descriptionControl.setValue('Description ISR');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();

      expect(mockPortfolioService.createPortfolio).toHaveBeenCalledWith({
        name: 'Mon PEA',
        description: 'Description ISR',
      });
    });

    it('should navigate to /dashboard after successful creation', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockPortfolioService.createPortfolio.mockReturnValue(of(MOCK_CREATED));
      component.nameControl.setValue('Mon PEA');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();

      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should send null description when description is empty', () => {
      mockPortfolioService.createPortfolio.mockReturnValue(of(MOCK_CREATED));
      component.nameControl.setValue('Mon PEA');
      component.descriptionControl.setValue('');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();

      expect(mockPortfolioService.createPortfolio).toHaveBeenCalledWith({
        name: 'Mon PEA',
        description: null,
      });
    });
  });

  // ─── Soumission — état chargement ─────────────────────────────────────────────

  describe('soumission — état chargement', () => {
    it('should disable the submit button while submitting', () => {
      const subject = new Subject<typeof MOCK_CREATED>();
      mockPortfolioService.createPortfolio.mockReturnValue(subject.asObservable());
      component.nameControl.setValue('Mon PEA');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[data-testid="btn-submit"]');
      expect(btn.disabled).toBe(true);
      subject.complete();
    });

    it('should show a loading indicator while submitting', () => {
      const subject = new Subject<typeof MOCK_CREATED>();
      mockPortfolioService.createPortfolio.mockReturnValue(subject.asObservable());
      component.nameControl.setValue('Mon PEA');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();
      fixture.detectChanges();

      const loading = fixture.nativeElement.querySelector('[data-testid="submit-loading"]');
      expect(loading).toBeTruthy();
      subject.complete();
    });
  });

  // ─── Soumission — erreur ──────────────────────────────────────────────────────

  describe('soumission — erreur', () => {
    it('should display an error message when creation fails', () => {
      mockPortfolioService.createPortfolio.mockReturnValue(
        throwError(() => new Error('API error'))
      );
      component.nameControl.setValue('Mon PEA');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('[data-testid="submit-error"]');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('impossible');
    });

    it('should re-enable the submit button after an error', () => {
      mockPortfolioService.createPortfolio.mockReturnValue(
        throwError(() => new Error('API error'))
      );
      component.nameControl.setValue('Mon PEA');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[data-testid="btn-submit"]');
      expect(btn.disabled).toBe(false);
    });

    it('should not navigate on error', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockPortfolioService.createPortfolio.mockReturnValue(
        throwError(() => new Error('API error'))
      );
      component.nameControl.setValue('Mon PEA');
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="btn-submit"]').click();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have a label associated to the name input', () => {
      const label = fixture.nativeElement.querySelector('label[for="portfolio-name"]');
      const input = fixture.nativeElement.querySelector('#portfolio-name');
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
    });

    it('should have aria-required on the name input', () => {
      const input = fixture.nativeElement.querySelector('[data-testid="input-name"]');
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should have a label associated to the description textarea', () => {
      const label = fixture.nativeElement.querySelector('label[for="portfolio-description"]');
      const textarea = fixture.nativeElement.querySelector('#portfolio-description');
      expect(label).toBeTruthy();
      expect(textarea).toBeTruthy();
    });
  });
});
