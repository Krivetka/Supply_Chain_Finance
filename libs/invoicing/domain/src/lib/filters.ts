import type { Invoice, InvoiceStatus } from './invoice.types';

export interface InvoiceFilter {
  status: InvoiceStatus | null;
  search: string;
}

export const EMPTY_FILTER: InvoiceFilter = {
  status: null,
  search: '',
};

export function matchesFilter(invoice: Invoice, filter: InvoiceFilter): boolean {
  if (filter.status !== null && invoice.status !== filter.status) {
    return false;
  }
  const query = filter.search.trim().toLowerCase();
  if (query === '') {
    return true;
  }
  return (
    invoice.invoiceNumber.toLowerCase().includes(query) ||
    invoice.buyerName.toLowerCase().includes(query)
  );
}
