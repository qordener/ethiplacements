import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App (AppShell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ─── Header ──────────────────────────────────────────────────────────────────

  describe('header', () => {
    it('should display the app name "ethiplacements"', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('[data-testid="app-header"]');
      expect(header).toBeTruthy();
      expect(header.textContent).toContain('ethiplacements');
    });

    it('should display a tagline in the header', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const tagline = fixture.nativeElement.querySelector('[data-testid="app-tagline"]');
      expect(tagline).toBeTruthy();
      expect(tagline.textContent.trim().length).toBeGreaterThan(0);
    });

    it('should have a <header> element with role banner', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('header');
      expect(header).toBeTruthy();
    });
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('should have a <nav> element with aria-label', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav).toBeTruthy();
      expect(nav.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have a link to the dashboard', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const navLink = fixture.nativeElement.querySelector('[data-testid="nav-dashboard"]');
      expect(navLink).toBeTruthy();
    });

    it('should display "Tableau de bord" as the dashboard nav label', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const navLink = fixture.nativeElement.querySelector('[data-testid="nav-dashboard"]');
      expect(navLink.textContent).toContain('Tableau de bord');
    });
  });

  // ─── Router outlet ───────────────────────────────────────────────────────────

  describe('router outlet', () => {
    it('should include a router-outlet for page content', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const outlet = fixture.nativeElement.querySelector('router-outlet');
      expect(outlet).toBeTruthy();
    });
  });

  // ─── Accessibilité ───────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have a <main> element wrapping the page content', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const main = fixture.nativeElement.querySelector('main');
      expect(main).toBeTruthy();
    });

    it('should have a skip-to-content link as the first focusable element', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const skip = fixture.nativeElement.querySelector('[data-testid="skip-to-content"]');
      expect(skip).toBeTruthy();
      expect(skip.getAttribute('href')).toBe('#main-content');
    });
  });
});
