import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a
      data-testid="skip-to-content"
      class="skip-link"
      href="#main-content"
    >Aller au contenu principal</a>

    <header data-testid="app-header" class="app-header">
      <div class="app-header__brand">
        <span class="app-header__name">ethiplacements</span>
        <span data-testid="app-tagline" class="app-header__tagline">
          Placements éthiques, en toute transparence
        </span>
      </div>

      <nav aria-label="Navigation principale" class="app-nav">
        <a
          data-testid="nav-dashboard"
          routerLink="/dashboard"
          routerLinkActive="nav-link--active"
          class="nav-link"
        >Tableau de bord</a>
      </nav>
    </header>

    <main id="main-content" class="app-main">
      <router-outlet />
    </main>
  `,
  styles: [`
    /* ── Skip link ─────────────────────────────────────────────────────────── */
    .skip-link {
      position: absolute;
      top: -100%;
      left: var(--space-2, 8px);
      z-index: 100;
      background: var(--color-primary, #2D6A4F);
      color: #fff;
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      text-decoration: none;
    }
    .skip-link:focus {
      top: var(--space-2, 8px);
    }

    /* ── Header ────────────────────────────────────────────────────────────── */
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3, 12px) var(--space-6, 24px);
      background: var(--color-neutral-900, #1A1A2E);
      color: #fff;
      box-shadow: var(--shadow-sm);
    }

    .app-header__brand {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .app-header__name {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-primary-light, #52B788);
    }

    .app-header__tagline {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-neutral-400, #9898B0);
    }

    /* ── Nav ───────────────────────────────────────────────────────────────── */
    .app-nav {
      display: flex;
      gap: var(--space-2, 8px);
    }

    .nav-link {
      color: var(--color-neutral-300, #C5C5D8);
      text-decoration: none;
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      padding: var(--space-1, 4px) var(--space-3, 12px);
      border-radius: var(--radius-sm, 4px);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .nav-link:hover,
    .nav-link:focus {
      background: rgba(255,255,255,0.08);
      color: #fff;
      outline: 2px solid var(--color-primary-light, #52B788);
      outline-offset: 2px;
    }
    .nav-link--active {
      color: var(--color-primary-light, #52B788);
      background: rgba(82, 183, 136, 0.1);
    }

    /* ── Main ──────────────────────────────────────────────────────────────── */
    .app-main {
      min-height: calc(100vh - 64px);
      background: var(--color-neutral-50, #F4F6F8);
    }
  `],
})
export class App {}
