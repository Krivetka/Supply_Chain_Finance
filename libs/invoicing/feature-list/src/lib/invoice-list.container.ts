import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { dateTime, type DateTime } from '@scf/shared/kernel';
import {
  canRequestFinancing,
  InvoiceStatus,
  type EligibleInvoice,
  type Invoice,
} from '@scf/invoicing/domain';
import { InvoicesStore } from '@scf/invoicing/data-access';
import {
  FinanceButtonComponent,
  InvoiceFiltersComponent,
  InvoiceRowComponent,
} from '@scf/invoicing/ui';
import { AuthStore } from '@scf/auth/data-access';

@Component({
  selector: 'scf-invoice-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InvoiceRowComponent, InvoiceFiltersComponent, FinanceButtonComponent],
  template: `
    <section class="invoice-list">
      <header>
        <h1>Invoices</h1>
        @if (auth.currentUser(); as user) {
          <span>Signed in as {{ user.displayName }}</span>
        }
      </header>

      <scf-invoice-filters
        [status]="store.filter().status"
        [search]="store.filter().search"
        (statusChange)="onStatusChange($event)"
        (searchChange)="onSearchChange($event)"
      />

      @if (store.lastError(); as err) {
        <div class="error" role="alert">
          Financing failed: {{ err }}
          <button type="button" (click)="onDismissError()">Dismiss</button>
        </div>
      }

      @if (store.loading()) {
        <p>Loading invoices…</p>
      } @else if (store.filteredInvoices().length === 0) {
        <p>No invoices match the filter.</p>
      } @else {
        <ul>
          @for (invoice of store.filteredInvoices(); track invoice.id) {
            <li>
              <scf-invoice-row [invoice]="invoice">
                <scf-finance-button
                  [eligible]="eligibilityFor(invoice)"
                  [loading]="store.requestingId() === invoice.id"
                  (request)="onRequest($event)"
                />
              </scf-invoice-row>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class InvoiceListContainer implements OnInit {
  protected readonly store = inject(InvoicesStore);
  protected readonly auth = inject(AuthStore);

  private readonly now = signal<DateTime>(dateTime(new Date().toISOString()));

  ngOnInit(): void {
    this.store.load();
  }

  protected eligibilityFor(invoice: Invoice): EligibleInvoice | null {
    const supplierId = this.auth.supplierId();
    if (supplierId === null) {
      return null;
    }
    return canRequestFinancing(
      invoice,
      {
        supplierId,
        permissions: this.auth.permissions(),
      },
      this.now(),
    );
  }

  protected onRequest(invoice: EligibleInvoice): void {
    this.store.requestFinancing(invoice);
  }

  protected onStatusChange(status: InvoiceStatus | null): void {
    this.store.setFilter({ status });
  }

  protected onSearchChange(search: string): void {
    this.store.setFilter({ search });
  }

  protected onDismissError(): void {
    this.store.clearError();
  }
}
