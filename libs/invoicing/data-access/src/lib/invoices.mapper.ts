import {
  currency,
  dateTime,
  invoiceId,
  money,
  supplierId,
  type DateTime,
  type Money,
} from '@scf/shared/kernel';
import {
  InvoiceStatus,
  type FinancingOffer,
  type Invoice,
} from '@scf/invoicing/domain';
import type { RawFinancingOffer, RawInvoice } from './raw-invoice';

function mapOffer(raw: RawFinancingOffer): FinancingOffer {
  if (raw.discountRate < 0 || raw.discountRate > 1) {
    throw new Error(`discountRate must be within [0, 1], got ${raw.discountRate}`);
  }
  return {
    discountRate: raw.discountRate,
    netAmount: money(raw.netAmount),
    expiresAt: dateTime(raw.expiresAt),
  };
}

export function mapInvoice(raw: RawInvoice): Invoice {
  const base = {
    id: invoiceId(raw.id),
    invoiceNumber: raw.invoiceNumber,
    supplierId: supplierId(raw.supplierId),
    supplierName: raw.supplierName,
    buyerName: raw.buyerName,
    amount: money(raw.amount) as Money,
    currency: currency(raw.currency),
    dueDate: dateTime(raw.dueDate) as DateTime,
  };

  switch (raw.status) {
    case InvoiceStatus.Draft:
      return { ...base, status: InvoiceStatus.Draft };
    case InvoiceStatus.Approved:
      if (!raw.financingOffer) {
        throw new Error(`Approved invoice ${raw.id} is missing a financing offer`);
      }
      return {
        ...base,
        status: InvoiceStatus.Approved,
        financingOffer: mapOffer(raw.financingOffer),
      };
    case InvoiceStatus.FinancingRequested:
      if (!raw.financingOffer) {
        throw new Error(`FinancingRequested invoice ${raw.id} is missing a financing offer`);
      }
      return {
        ...base,
        status: InvoiceStatus.FinancingRequested,
        financingOffer: mapOffer(raw.financingOffer),
      };
    case InvoiceStatus.Financed:
      return { ...base, status: InvoiceStatus.Financed };
    case InvoiceStatus.Paid:
      return { ...base, status: InvoiceStatus.Paid };
    case InvoiceStatus.Rejected:
      return { ...base, status: InvoiceStatus.Rejected };
    default:
      throw new Error(`Unknown invoice status: ${raw.status}`);
  }
}
