import { test, expect } from '@playwright/test';
import {
  PORTFOLIO_P1,
  PORTFOLIO_P2,
  SUMMARY_P1,
  SUMMARY_P2,
  DETAIL_P1_EMPTY,
  DETAIL_P1_WITH_HOLDING,
  SUMMARY_P1_EMPTY,
  HOLDING_H1,
} from './fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function mockEmptyDashboard(page: import('@playwright/test').Page) {
  await page.route('/api/portfolios', route => route.fulfill({ json: [] }));
}

async function mockDashboardWithPortfolios(page: import('@playwright/test').Page) {
  await page.route('/api/portfolios', route =>
    route.fulfill({ json: [PORTFOLIO_P1, PORTFOLIO_P2] })
  );
  await page.route('/api/portfolios/p1/summary', route =>
    route.fulfill({ json: SUMMARY_P1 })
  );
  await page.route('/api/portfolios/p2/summary', route =>
    route.fulfill({ json: SUMMARY_P2 })
  );
}

async function mockDetailEmpty(page: import('@playwright/test').Page) {
  await page.route('/api/portfolios/p1', route =>
    route.fulfill({ json: DETAIL_P1_EMPTY })
  );
  await page.route('/api/portfolios/p1/summary', route =>
    route.fulfill({ json: SUMMARY_P1_EMPTY })
  );
}

async function mockDetailWithHolding(page: import('@playwright/test').Page) {
  await page.route('/api/portfolios/p1', route =>
    route.fulfill({ json: DETAIL_P1_WITH_HOLDING })
  );
  await page.route('/api/portfolios/p1/summary', route =>
    route.fulfill({ json: SUMMARY_P1 })
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('redirige / vers /dashboard', async ({ page }) => {
    await mockEmptyDashboard(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('affiche le header AppShell', async ({ page }) => {
    await mockEmptyDashboard(page);
    await page.goto('/dashboard');
    await expect(page.locator('header')).toBeVisible();
  });

  test('affiche l\'état vide quand aucun portefeuille', async ({ page }) => {
    await mockEmptyDashboard(page);
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-empty"]')).toContainText('Aucun portefeuille');
  });

  test('affiche les cartes portefeuille quand des données existent', async ({ page }) => {
    await mockDashboardWithPortfolios(page);
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="portfolio-name"]').first()).toContainText('PEA Éthique');
  });

  test('affiche la barre de filtres ESG', async ({ page }) => {
    await mockDashboardWithPortfolios(page);
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="esg-filter-bar"]')).toBeVisible();
  });
});

// ─── Filtres ESG ─────────────────────────────────────────────────────────────

test.describe('Filtres ESG', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardWithPortfolios(page);
    await page.goto('/dashboard');
  });

  test('filtre "Élevé" n\'affiche que les portefeuilles avec score ≥ 70', async ({ page }) => {
    await page.click('[data-testid="filter-high"]');
    // P1 esgScore=75 (high), P2 esgScore=22 (low) → seul P1 visible
    await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="portfolio-name"]').first()).toContainText('PEA Éthique');
  });

  test('filtre "Faible" n\'affiche que les portefeuilles avec score < 40', async ({ page }) => {
    await page.click('[data-testid="filter-low"]');
    await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="portfolio-name"]').first()).toContainText('Compte Spéculatif');
  });

  test('filtre "Tous" restaure tous les portefeuilles', async ({ page }) => {
    await page.click('[data-testid="filter-high"]');
    await page.click('[data-testid="filter-all"]');
    await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(2);
  });

  test('le bouton actif a aria-pressed="true"', async ({ page }) => {
    await page.click('[data-testid="filter-high"]');
    await expect(page.locator('[data-testid="filter-high"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid="filter-all"]')).toHaveAttribute('aria-pressed', 'false');
  });
});

// ─── Golden Path : Création de portefeuille ──────────────────────────────────

test.describe('Création de portefeuille', () => {
  test('le CTA état vide mène à /portfolio/new', async ({ page }) => {
    await mockEmptyDashboard(page);
    await page.goto('/dashboard');
    await page.click('[data-testid="cta-create-portfolio"]');
    await expect(page).toHaveURL(/\/portfolio\/new/);
  });

  test('le bouton Créer est désactivé quand le nom est vide', async ({ page }) => {
    await page.goto('/portfolio/new');
    await expect(page.locator('[data-testid="btn-submit"]')).toBeDisabled();
  });

  test('le bouton Créer s\'active quand le nom est rempli', async ({ page }) => {
    await page.goto('/portfolio/new');
    await page.fill('[data-testid="input-name"]', 'Mon PEA');
    await expect(page.locator('[data-testid="btn-submit"]')).toBeEnabled();
  });

  test('soumettre le formulaire crée le portefeuille et redirige vers /dashboard', async ({ page }) => {
    // Après création, le dashboard rechargera la liste avec le nouveau portefeuille
    await page.route('/api/portfolios', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: PORTFOLIO_P1, status: 201 });
      } else {
        await route.fulfill({ json: [PORTFOLIO_P1] });
      }
    });
    await page.route('/api/portfolios/p1/summary', route =>
      route.fulfill({ json: SUMMARY_P1 })
    );

    await page.goto('/portfolio/new');
    await page.fill('[data-testid="input-name"]', 'PEA Éthique');
    await page.fill('[data-testid="input-description"]', 'Mon portefeuille ISR');
    await page.click('[data-testid="btn-submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="portfolio-name"]').first()).toContainText('PEA Éthique');
  });

  test('Annuler ramène au dashboard', async ({ page }) => {
    await mockEmptyDashboard(page);
    await page.goto('/portfolio/new');
    await page.click('[data-testid="link-cancel"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ─── Golden Path : Page Détail ───────────────────────────────────────────────

test.describe('Page Détail', () => {
  test('naviguer vers un portefeuille affiche son nom et ses métriques', async ({ page }) => {
    await mockDashboardWithPortfolios(page);
    await mockDetailWithHolding(page);

    await page.goto('/dashboard');
    await page.click('[data-testid="portfolio-card"]');

    await expect(page).toHaveURL(/\/portfolio\/p1/);
    await expect(page.locator('[data-testid="portfolio-name"]')).toContainText('PEA Éthique');
    await expect(page.locator('[data-testid="total-invested"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="esg-score"]')).toBeVisible();
  });

  test('affiche le tableau des positions', async ({ page }) => {
    await mockDetailWithHolding(page);
    await page.goto('/portfolio/p1');

    await expect(page.locator('[data-testid="holdings-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="holding-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="holding-row"]').first()).toContainText('BN');
    await expect(page.locator('[data-testid="holding-row"]').first()).toContainText('Danone');
  });

  test('affiche l\'état vide des positions quand aucun holding', async ({ page }) => {
    await mockDetailEmpty(page);
    await page.goto('/portfolio/p1');

    await expect(page.locator('[data-testid="holdings-empty"]')).toBeVisible();
  });

  test('affiche les graphiques de répartition et ESG quand des positions existent', async ({ page }) => {
    await mockDetailWithHolding(page);
    await page.goto('/portfolio/p1');

    await expect(page.locator('[data-testid="allocation-chart-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="esg-chart-section"]')).toBeVisible();
  });

  test('le lien retour ramène au dashboard', async ({ page }) => {
    await mockEmptyDashboard(page);
    await mockDetailEmpty(page);
    await page.goto('/portfolio/p1');
    await page.click('[data-testid="back-to-dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ─── Golden Path : Ajout de position ─────────────────────────────────────────

test.describe('Ajout de position', () => {
  test.beforeEach(async ({ page }) => {
    await mockDetailEmpty(page);
    await page.route('/api/assets', route => route.fulfill({ json: [] }));
  });

  test('ouvrir la modale affiche le formulaire', async ({ page }) => {
    await page.goto('/portfolio/p1');
    await page.click('[data-testid="add-holding-btn"]');
    await expect(page.locator('[data-testid="modal-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-ticker"]')).toBeVisible();
  });

  test('fermer la modale via le bouton × la masque', async ({ page }) => {
    await page.goto('/portfolio/p1');
    await page.click('[data-testid="add-holding-btn"]');
    await page.click('[data-testid="modal-close-btn"]');
    await expect(page.locator('[data-testid="modal-dialog"]')).not.toBeVisible();
  });

  test('soumettre un nouvel actif crée l\'asset puis le holding', async ({ page }) => {
    const newAsset = { id: 'a-new', name: 'Tesla', ticker: 'TSLA', type: 'STOCK', manualPrice: null, esgScores: [] };
    const newHolding = { id: 'h-new', quantity: 5, averagePrice: 200, asset: newAsset };

    await page.route('/api/assets', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: newAsset, status: 201 });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.route('/api/portfolios/p1/holdings', route =>
      route.fulfill({ json: newHolding, status: 201 })
    );
    // Après ajout, rechargement du détail avec le nouveau holding
    await page.route('/api/portfolios/p1', route =>
      route.fulfill({ json: { ...DETAIL_P1_EMPTY, holdings: [newHolding] } })
    );

    await page.goto('/portfolio/p1');
    await page.click('[data-testid="add-holding-btn"]');

    await page.fill('[data-testid="input-ticker"]', 'TSLA');
    await page.fill('[data-testid="input-asset-name"]', 'Tesla');
    await page.selectOption('[data-testid="input-asset-type"]', 'STOCK');
    await page.fill('[data-testid="input-quantity"]', '5');
    await page.fill('[data-testid="input-avg-price"]', '200');

    await page.click('button[form="add-holding-form"]');

    await expect(page.locator('[data-testid="modal-dialog"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="holding-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="holding-row"]').first()).toContainText('TSLA');
  });
});

// ─── Golden Path : Suppression de portefeuille ───────────────────────────────

test.describe('Suppression de portefeuille', () => {
  test('ouvrir la modale de suppression depuis la carte', async ({ page }) => {
    await mockDashboardWithPortfolios(page);
    await page.goto('/dashboard');

    await page.locator('[data-testid="portfolio-card"]').first().locator('[data-testid="btn-delete-portfolio"]').click();
    await expect(page.locator('[data-testid="delete-portfolio-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-portfolio-modal"]')).toContainText('PEA Éthique');
  });

  test('annuler ferme la modale sans supprimer', async ({ page }) => {
    await mockDashboardWithPortfolios(page);
    await page.goto('/dashboard');

    await page.locator('[data-testid="portfolio-card"]').first().locator('[data-testid="btn-delete-portfolio"]').click();
    await page.click('text=Annuler');

    await expect(page.locator('[data-testid="delete-portfolio-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="portfolio-card"]')).toHaveCount(2);
  });
});
