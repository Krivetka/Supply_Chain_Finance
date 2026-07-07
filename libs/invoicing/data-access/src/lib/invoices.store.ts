import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, pipe, switchMap, tap } from 'rxjs';
import { assertNever, type InvoiceId } from '@scf/shared/kernel';
import {
  EMPTY_FILTER,
  InvoiceStatus,
  matchesFilter,
  type EligibleInvoice,
  type FinancingErrorCode,
  type Invoice,
  type InvoiceFilter,
} from '@scf/invoicing/domain';
import { InvoicesService } from './invoices.service';

interface InvoicesState {
  readonly invoices: readonly Invoice[];
  readonly filter: InvoiceFilter;
  readonly loading: boolean;
  readonly requestingId: InvoiceId | null;
  readonly lastError: FinancingErrorCode | null;
}

const initialState: InvoicesState = {
  invoices: [],
  filter: EMPTY_FILTER,
  loading: false,
  requestingId: null,
  lastError: null,
};

export const InvoicesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    filteredInvoices: computed(() => {
      const filter = store.filter();
      return store.invoices().filter((invoice) => matchesFilter(invoice, filter));
    }),
  })),
  withMethods((store) => {
    const service = inject(InvoicesService);

    return {
      setFilter(patch: Partial<InvoiceFilter>): void {
        patchState(store, (state) => ({
          filter: { ...state.filter, ...patch },
        }));
      },

      clearError(): void {
        patchState(store, { lastError: null });
      },

      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            service.list().pipe(
              tap((invoices) =>
                patchState(store, { invoices, loading: false }),
              ),
              catchError(() => {
                patchState(store, { loading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      requestFinancing: rxMethod<EligibleInvoice>(
        pipe(
          tap((invoice) =>
            patchState(store, { requestingId: invoice.id, lastError: null }),
          ),
          switchMap((invoice) =>
            service.requestFinancing(invoice.id).pipe(
              tap((result) => {
                switch (result.__typename) {
                  case 'FinancingRequested': {
                    patchState(store, (state) => ({
                      invoices: state.invoices.map((current) => {
                        if (current.id !== (result.invoiceId as unknown as InvoiceId)) {
                          return current;
                        }
                        if (current.status !== InvoiceStatus.Approved) {
                          return current;
                        }
                        return { ...current, status: InvoiceStatus.FinancingRequested };
                      }),
                      requestingId: null,
                    }));
                    break;
                  }
                  case 'FinancingError': {
                    patchState(store, {
                      lastError: result.code,
                      requestingId: null,
                    });
                    break;
                  }
                  default:
                    assertNever(result);
                }
              }),
              catchError(() => {
                patchState(store, { lastError: 'UNKNOWN', requestingId: null });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    };
  }),
);
