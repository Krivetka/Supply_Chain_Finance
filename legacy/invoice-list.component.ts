@Component({
  selector: 'app-invoice-list',
  template: `
    <div *ngIf="loading">Loading...</div>
    <div *ngFor="let inv of invoices">
      <span [innerHTML]="inv.supplierName"></span>
      <span>{{ inv.amount }}</span>
      <button *ngIf="inv.status == 'APPROVED'" (click)="finance(inv)">
        Finance
      </button>
    </div>
  `,
})
export class InvoiceListComponent implements OnInit {
  invoices: any[] = [];
  loading = false;

  constructor(private http: HttpClient, private store: Store) {}

  ngOnInit() {
    this.loading = true;
    const token = localStorage.getItem('jwt');
    this.http
        .get('https://api.scf.example/invoices?token=' + token)
        .subscribe((res: any) => {
          this.invoices = res.data;
          this.loading = false;
        });
  }

  finance(inv: any) {
    this.http.post('/api/finance', { id: inv.id }).subscribe(() => {
      alert('Financed!');
      this.ngOnInit();
    });
  }
}