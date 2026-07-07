import type {
  Currency,
  DateTime,
  InvoiceId,
  Money,
  SupplierId,
} from '@scf/shared/kernel';
import type { FinancingOffer } from './financing.types';

export const InvoiceStatus = {
  Draft: 'DRAFT',
  Approved: 'APPROVED',
  FinancingRequested: 'FINANCING_REQUESTED',
  Financed: 'FINANCED',
  Paid: 'PAID',
  Rejected: 'REJECTED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

interface InvoiceBase {
  id: InvoiceId;
  invoiceNumber: string;
  supplierId: SupplierId;
  supplierName: string;
  buyerName: string;
  amount: Money;
  currency: Currency;
  dueDate: DateTime;
}

export interface DraftInvoice extends InvoiceBase {
  status: typeof InvoiceStatus.Draft;
}

export interface ApprovedInvoice extends InvoiceBase {
  status: typeof InvoiceStatus.Approved;
  financingOffer: FinancingOffer;
}

export interface FinancingRequestedInvoice extends InvoiceBase {
  status: typeof InvoiceStatus.FinancingRequested;
  financingOffer: FinancingOffer;
}

export interface FinancedInvoice extends InvoiceBase {
  status: typeof InvoiceStatus.Financed;
}

export interface PaidInvoice extends InvoiceBase {
  status: typeof InvoiceStatus.Paid;
}

export interface RejectedInvoice extends InvoiceBase {
  status: typeof InvoiceStatus.Rejected;
}

export type Invoice =
  | DraftInvoice
  | ApprovedInvoice
  | FinancingRequestedInvoice
  | FinancedInvoice
  | PaidInvoice
  | RejectedInvoice;
