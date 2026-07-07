import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatMoney } from '@scf/shared/kernel';
import { InvoiceStatus, type Invoice } from '@scf/invoicing/domain';

@Component({
  selector: 'scf-invoice-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="invoice-row">
      <span class="invoice-number">{{ invoice().invoiceNumber }}</span>
      <span class="buyer">{{ invoice().buyerName }}</span>
      <span class="amount">{{ formattedAmount() }}</span>
      <span class="status">{{ invoice().status }}</span>
      @if (offer(); as o) {
        <span class="offer">
          {{ (o.discountRate * 100).toFixed(2) }}% · expires {{ o.expiresAt }}
        </span>
      }
      <ng-content />
    </div>
  `,
})
export class InvoiceRowComponent {
  readonly invoice = input.required<Invoice>();

  protected readonly formattedAmount = computed(() =>
    formatMoney(this.invoice().amount, this.invoice().currency),
  );

  protected readonly offer = computed(() => {
    const inv = this.invoice();
    if (
      inv.status === InvoiceStatus.Approved ||
      inv.status === InvoiceStatus.FinancingRequested
    ) {
      return inv.financingOffer;
    }
    return null;
  });
}
