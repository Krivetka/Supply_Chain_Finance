import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'invoices',
    loadChildren: () =>
      import('@scf/invoicing/feature-list').then((m) => m.INVOICES_ROUTES),
  },
  {
    path: '',
    redirectTo: 'invoices',
    pathMatch: 'full',
  },
];
