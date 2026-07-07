import type { DateTime, Money } from '@scf/shared/kernel';

export interface FinancingOffer {
  discountRate: number;
  netAmount: Money;
  expiresAt: DateTime;
}

export type FinancingErrorCode =
  | 'INVOICE_NOT_APPROVED'
  | 'OFFER_EXPIRED'
  | 'FORBIDDEN'
  | 'UNKNOWN';

export interface FinancingRequested {
  __typename: 'FinancingRequested';
  invoiceId: string;
}

export interface FinancingError {
  __typename: 'FinancingError';
  code: FinancingErrorCode;
  message: string;
}

export type RequestFinancingResult = FinancingRequested | FinancingError;
