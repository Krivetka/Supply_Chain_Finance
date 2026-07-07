import { dateTime } from '@scf/shared/kernel';
import { canRequestFinancing } from '@scf/invoicing/domain';
import { mapInvoice, type RawInvoice } from '@scf/invoicing/data-access';

const NOW = dateTime('2026-07-07T00:00:00Z');

const FRESH_OFFER = {
  discountRate: 0.02,
  netAmount: 98_000,
  expiresAt: '2026-08-01T00:00:00Z',
};

const EXPIRED_OFFER = {
  discountRate: 0.02,
  netAmount: 98_000,
  expiresAt: '2026-01-01T00:00:00Z',
};

function rawApproved(overrides: Partial<RawInvoice> = {}): RawInvoice {
  return {
    id: 'test-1',
    invoiceNumber: 'TEST-001',
    supplierId: 'supplier-acme',
    supplierName: 'ACME',
    buyerName: 'Buyer Ltd',
    amount: 100_000,
    currency: 'USD',
    dueDate: '2026-12-01T00:00:00Z',
    status: 'APPROVED',
    financingOffer: FRESH_OFFER,
    ...overrides,
  };
}

describe('canRequestFinancing', () => {
  const owner = mapInvoice(rawApproved()).supplierId;
  const withPermission = { supplierId: owner, permissions: ['supplier:financing'] };
  const withoutPermission = { supplierId: owner, permissions: [] };

  it('returns EligibleInvoice when all four conditions hold', () => {
    const invoice = mapInvoice(rawApproved());
    const result = canRequestFinancing(invoice, withPermission, NOW);
    expect(result).not.toBeNull();
  });

  it('returns null when the invoice is not APPROVED', () => {
    const invoice = mapInvoice(rawApproved({ status: 'DRAFT', financingOffer: null }));
    const result = canRequestFinancing(invoice, withPermission, NOW);
    expect(result).toBeNull();
  });

  it('returns null when the current user does not own the invoice', () => {
    const invoice = mapInvoice(rawApproved({ supplierId: 'supplier-other' }));
    const result = canRequestFinancing(invoice, withPermission, NOW);
    expect(result).toBeNull();
  });

  it('returns null when the user lacks supplier:financing permission', () => {
    const invoice = mapInvoice(rawApproved());
    const result = canRequestFinancing(invoice, withoutPermission, NOW);
    expect(result).toBeNull();
  });

  it('returns null when the financing offer has expired', () => {
    const invoice = mapInvoice(rawApproved({ financingOffer: EXPIRED_OFFER }));
    const result = canRequestFinancing(invoice, withPermission, NOW);
    expect(result).toBeNull();
  });
});
