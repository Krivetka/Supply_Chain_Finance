import type { Routes } from '@angular/router';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./invoice-list.container').then((m) => m.InvoiceListContainer),
  },
];
