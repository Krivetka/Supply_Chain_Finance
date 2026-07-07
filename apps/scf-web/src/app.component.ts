import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ACME_SUPPLIER, AuthStore } from '@scf/auth/data-access';

@Component({
  selector: 'scf-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  private readonly auth = inject(AuthStore);

  constructor() {
    this.auth.signInAs(ACME_SUPPLIER);
  }
}
