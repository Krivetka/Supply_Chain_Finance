import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EligibleInvoice } from '@scf/invoicing/domain';

@Component({
  selector: 'scf-finance-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [disabled]="disabled()" (click)="onClick()">
      @if (loading()) {
        Requesting…
      } @else {
        Finance
      }
    </button>
  `,
})
export class FinanceButtonComponent {
  readonly eligible = input<EligibleInvoice | null>(null);
  readonly loading = input<boolean>(false);

  readonly request = output<EligibleInvoice>();

  protected readonly disabled = computed(
    () => this.eligible() === null || this.loading(),
  );

  onClick(): void {
    const invoice = this.eligible();
    if (invoice === null) {
      return;
    }
    this.request.emit(invoice);
  }
}
