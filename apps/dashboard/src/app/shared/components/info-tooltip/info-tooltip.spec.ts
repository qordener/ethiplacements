import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoTooltip } from './info-tooltip';

describe('InfoTooltip', () => {
  let fixture: ComponentFixture<InfoTooltip>;
  let component: InfoTooltip;

  async function setup(overrides: { text?: string; label?: string } = {}) {
    await TestBed.configureTestingModule({
      imports: [InfoTooltip],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoTooltip);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('text', overrides.text ?? 'Le CUMP est le prix moyen pondéré de vos achats.');
    if (overrides.label !== undefined) {
      fixture.componentRef.setInput('label', overrides.label);
    }
    fixture.detectChanges();
  }

  // ─── État initial ─────────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('should render the trigger icon', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger).toBeTruthy();
    });

    it('should hide tooltip by default', async () => {
      await setup();
      const tooltip = fixture.nativeElement.querySelector('[data-testid="info-tooltip"]');
      expect(tooltip).toBeFalsy();
    });

    it('should expose isOpen() as false by default', async () => {
      await setup();
      expect(component.isOpen()).toBe(false);
    });
  });

  // ─── Toggle au clic ───────────────────────────────────────────────────────────

  describe('toggle au clic', () => {
    it('should show tooltip after first click', async () => {
      await setup();
      fixture.nativeElement.querySelector('[data-testid="info-trigger"]').click();
      fixture.detectChanges();

      const tooltip = fixture.nativeElement.querySelector('[data-testid="info-tooltip"]');
      expect(tooltip).toBeTruthy();
    });

    it('should hide tooltip after second click', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');

      trigger.click();
      fixture.detectChanges();
      trigger.click();
      fixture.detectChanges();

      const tooltip = fixture.nativeElement.querySelector('[data-testid="info-tooltip"]');
      expect(tooltip).toBeFalsy();
    });

    it('should update isOpen() to true after first click', async () => {
      await setup();
      fixture.nativeElement.querySelector('[data-testid="info-trigger"]').click();
      fixture.detectChanges();

      expect(component.isOpen()).toBe(true);
    });

    it('should update isOpen() back to false after second click', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');

      trigger.click();
      fixture.detectChanges();
      trigger.click();
      fixture.detectChanges();

      expect(component.isOpen()).toBe(false);
    });
  });

  // ─── Contenu du tooltip ───────────────────────────────────────────────────────

  describe('contenu', () => {
    it('should display the text inside tooltip when open', async () => {
      await setup({ text: 'Explication pédagogique ESG' });
      fixture.nativeElement.querySelector('[data-testid="info-trigger"]').click();
      fixture.detectChanges();

      const tooltip = fixture.nativeElement.querySelector('[data-testid="info-tooltip"]');
      expect(tooltip.textContent).toContain('Explication pédagogique ESG');
    });

    it('should have role="tooltip" on the tooltip panel', async () => {
      await setup();
      fixture.nativeElement.querySelector('[data-testid="info-trigger"]').click();
      fixture.detectChanges();

      const tooltip = fixture.nativeElement.querySelector('[data-testid="info-tooltip"]');
      expect(tooltip.getAttribute('role')).toBe('tooltip');
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have aria-label on trigger containing default label', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger.getAttribute('aria-label')).toContain('En savoir plus');
    });

    it('should use custom label in aria-label when provided', async () => {
      await setup({ label: 'Comprendre le score ESG' });
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger.getAttribute('aria-label')).toContain('Comprendre le score ESG');
    });

    it('should have aria-expanded="false" on trigger when closed', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have aria-expanded="true" on trigger when open', async () => {
      await setup();
      fixture.nativeElement.querySelector('[data-testid="info-trigger"]').click();
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should toggle on Enter key', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector('[data-testid="info-trigger"]');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(component.isOpen()).toBe(true);
    });

    it('should close on Escape key when open', async () => {
      await setup();
      fixture.nativeElement.querySelector('[data-testid="info-trigger"]').click();
      fixture.detectChanges();

      fixture.nativeElement.querySelector('[data-testid="info-trigger"]')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(component.isOpen()).toBe(false);
    });
  });

  // ─── Label par défaut ─────────────────────────────────────────────────────────

  describe('label par défaut', () => {
    it('should use "En savoir plus" as default label when not provided', async () => {
      await setup();
      expect(component.label()).toBe('En savoir plus');
    });

    it('should use custom label when provided', async () => {
      await setup({ label: 'Définition du CUMP' });
      expect(component.label()).toBe('Définition du CUMP');
    });
  });
});
