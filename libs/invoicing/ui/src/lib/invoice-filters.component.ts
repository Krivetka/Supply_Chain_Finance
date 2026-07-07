import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InvoiceStatus } from '@scf/invoicing/domain';

const STATUS_VALUES: readonly InvoiceStatus[] = Object.values(InvoiceStatus);

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (STATUS_VALUES as readonly string[]).includes(value);
}

@Component({
  selector: 'scf-invoice-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="invoice-filters">
      <label>
        Status
        <select [value]="status() ?? ''" (change)="onStatusChange($event)">
          <option value="">All</option>
          @for (option of statuses; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
      </label>
      <label>
        Search
        <input
          type="text"
          placeholder="invoice number or buyer"
          [value]="search()"
          (input)="onSearchChange($event)"
        />
      </label>
    </div>
  `,
})
export class InvoiceFiltersComponent {
  readonly status = input<InvoiceStatus | null>(null);
  readonly search = input<string>('');

  readonly statusChange = output<InvoiceStatus | null>();
  readonly searchChange = output<string>();

  protected readonly statuses = STATUS_VALUES;

  onStatusChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const value = target.value;
    if (value === '') {
      this.statusChange.emit(null);
      return;
    }
    if (isInvoiceStatus(value)) {
      this.statusChange.emit(value);
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.searchChange.emit(target.value);
  }
}
