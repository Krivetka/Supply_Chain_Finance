import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import type { InvoiceId } from '@scf/shared/kernel';
import {
  InvoiceStatus,
  type Invoice,
  type RequestFinancingResult,
} from '@scf/invoicing/domain';
import { INVOICE_FIXTURES } from './fixtures';
import { mapInvoice } from './invoices.mapper';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  list(): Observable<readonly Invoice[]> {
    const invoices = INVOICE_FIXTURES.map(mapInvoice);
    return of(invoices).pipe(delay(150));
  }

  requestFinancing(id: InvoiceId): Observable<RequestFinancingResult> {
    const raw = INVOICE_FIXTURES.find((inv) => inv.id === (id as string));
    if (!raw) {
      return of<RequestFinancingResult>({
        __typename: 'FinancingError',
        code: 'UNKNOWN',
        message: `Invoice ${id as string} not found`,
      }).pipe(delay(200));
    }
    if (raw.status !== InvoiceStatus.Approved) {
      return of<RequestFinancingResult>({
        __typename: 'FinancingError',
        code: 'INVOICE_NOT_APPROVED',
        message: `Invoice ${raw.id} is in status ${raw.status}`,
      }).pipe(delay(200));
    }
    return of<RequestFinancingResult>({
      __typename: 'FinancingRequested',
      invoiceId: raw.id,
    }).pipe(delay(300));
  }
}
