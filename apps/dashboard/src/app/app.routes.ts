import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'portfolio/new',
    loadComponent: () =>
      import('./features/portfolio/new-portfolio/new-portfolio.page').then(
        (m) => m.NewPortfolioPage
      ),
  },
];
