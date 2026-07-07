import { isPast, type DateTime, type SupplierId } from '@scf/shared/kernel';
import { InvoiceStatus, type ApprovedInvoice, type Invoice } from './invoice.types';

declare const eligibleBrand: unique symbol;

export type EligibleInvoice = ApprovedInvoice & {
  readonly [eligibleBrand]: 'EligibleInvoice';
};

export const FINANCING_PERMISSION = 'supplier:financing' as const;

export interface EligibilityActor {
  readonly supplierId: SupplierId;
  readonly permissions: readonly string[];
}

export function canRequestFinancing(
  invoice: Invoice,
  actor: EligibilityActor,
  now: DateTime,
): EligibleInvoice | null {
  if (invoice.status !== InvoiceStatus.Approved) return null;
  if (invoice.supplierId !== actor.supplierId) return null;
  if (!actor.permissions.includes(FINANCING_PERMISSION)) return null;
  if (isPast(invoice.financingOffer.expiresAt, now)) return null;
  return invoice as EligibleInvoice;
}
