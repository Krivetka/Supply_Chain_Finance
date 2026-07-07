import { TestBed } from '@angular/core/testing';
import { dateTime } from '@scf/shared/kernel';
import {
  canRequestFinancing,
  InvoiceStatus,
  type Invoice,
} from '@scf/invoicing/domain';
import { InvoicesStore } from '@scf/invoicing/data-access';
import { ACME_SUPPLIER, AuthStore } from '@scf/auth/data-access';

const NOW = dateTime('2026-07-07T00:00:00Z');

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickEligible(invoices: readonly Invoice[]): Invoice {
  const found = invoices.find(
    (inv) =>
      inv.status === InvoiceStatus.Approved &&
      inv.supplierId === ACME_SUPPLIER.supplierId &&
      Date.parse(inv.financingOffer.expiresAt) > Date.parse(NOW),
  );
  if (!found) {
    throw new Error('fixture did not contain an eligible ACME invoice');
  }
  return found;
}

describe('InvoicesStore', () => {
  let store: InstanceType<typeof InvoicesStore>;
  let auth: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(InvoicesStore);
    auth = TestBed.inject(AuthStore);
    auth.signInAs(ACME_SUPPLIER);
  });

  it('starts with no invoices and not loading', () => {
    expect(store.invoices()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('populates invoices on load', async () => {
    store.load();
    await wait(300);
    expect(store.invoices().length).toBeGreaterThan(0);
    expect(store.loading()).toBe(false);
  });

  it('filters by status', async () => {
    store.load();
    await wait(300);
    store.setFilter({ status: InvoiceStatus.Approved });
    const filtered = store.filteredInvoices();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((inv) => inv.status === InvoiceStatus.Approved)).toBe(true);
  });

  it('transitions APPROVED to FINANCING_REQUESTED on successful request', async () => {
    store.load();
    await wait(300);

    const approved = pickEligible(store.invoices());
    const eligible = canRequestFinancing(
      approved,
      {
        supplierId: ACME_SUPPLIER.supplierId,
        permissions: ACME_SUPPLIER.permissions,
      },
      NOW,
    );
    if (eligible === null) {
      throw new Error('eligibility precondition failed');
    }

    store.requestFinancing(eligible);
    await wait(500);

    const updated = store.invoices().find((inv) => inv.id === eligible.id);
    expect(updated?.status).toBe(InvoiceStatus.FinancingRequested);
    expect(store.requestingId()).toBeNull();
    expect(store.lastError()).toBeNull();
  });
});
