# Code Review

Two blocker-grade security bugs; everything else is correctness or modernisation. I'd merge the blockers as an isolated hotfix and chain the rest — severity is ranked on fintech business impact, not on complexity.

---

## Blockers (do not merge without fixing)

### B1 — JWT in the URL query string
```ts
this.http.get('https://api.scf.example/invoices?token=' + token)
```
Tokens in URLs leak to every layer that touches an HTTP line: reverse-proxy access logs, browser history, `Referer` on cross-origin subresource requests, third-party analytics, shared browser tabs, screenshot tools. For a bearer JWT that grants access to invoices worth real money, this is an absolute leak. Move the token to an `Authorization: Bearer …` header. The long-term correct home is an `HttpInterceptor` reading from a session store, but a header on the call site removes the leak today.

### B2 — `[innerHTML]` on server-controlled data
```html
<span [innerHTML]="inv.supplierName"></span>
```
`[innerHTML]` tells Angular's sanitizer "trust me". `supplierName` is a plain-text field with no formatting requirements. If a supplier profile is ever attacker-controlled (compromised onboarding, weak validation on the seller portal, admin injection), the payload runs with the SPA's origin and can exfiltrate the same JWT we're trying to protect in B1. Replace with `{{ inv.supplierName }}` — single-character change, removes the XSS sink.

### B3 — Loading state gets wedged on error
```ts
this.http.get(...).subscribe(res => { this.invoices = res.data; this.loading = false; });
```
No error branch. On a 500, `loading` stays `true` forever and the user sees "Loading…" until they hard-refresh. In fintech that generates support tickets because users can't tell "still loading" from "your payment silently failed". Fix: convert to `try/catch` with `firstValueFrom` or handle the error observable explicitly, and always flip `loading` to `false` in a finalize step.

---

## Major (fix in follow-ups, not merge blockers on their own)

- **M1 — `invoices: any[]`.** No typed model. Every downstream refactor is guesswork. Introduce a `InvoiceListItem` type wired to the codegen output.
- **M2 — Financing gate is status-only.** The task spec requires `supplier:financing` permission in addition to `status === 'APPROVED'`. Right now anyone can click "Finance" on any approved invoice they can see. The schema already defines `enum InvoiceStatus { DRAFT, APPROVED, … }`, so this fixes cheaply in three levels of ambition:
  1. Replace the magic string `'APPROVED'` with `InvoiceStatus.APPROVED` — kills the typo class and the `==` comparison in one move.
  2. Extract a pure predicate `canRequestFinancing(invoice, permissions): boolean` and drive both the button state and the mutation call from it.
  3. Encode the rule in the type system — e.g. narrow to an `EligibleInvoice` branded from the predicate, so `requestFinancing()` cannot even be *called* with an ineligible invoice.
- **M3 — Unused `Store` dependency.** Dead injection, misleads readers into thinking there's NgRx wiring. Remove until it's actually used.
- **M4 — Hardcoded absolute URL, inconsistent with the second call.** `https://api.scf.example/invoices` vs `/api/finance` — the two calls disagree on the API base URL. Extract to `environment.apiBaseUrl` and use it everywhere.
- **M5 — No unsubscribe.** If the user navigates away during the request, the setter fires on a destroyed view. `takeUntilDestroyed()` or convert to a resource-style pattern.
- **M6 — `*ngIf` / `*ngFor`.** New control flow (`@if` / `@for`) is required in the new-code standard, and `@for` forces `track`, which is missing here entirely.
- **M7 — Not standalone, no OnPush.** New components should be `standalone: true` with `ChangeDetectionStrategy.OnPush` (and zoneless-ready).
- **M8 — `alert('Financed!')`.** Blocks the event loop, unstyleable, not screen-reader friendly, awkward to assert on in tests. Use an in-app notification.
- **M9 — Union result of `requestFinancing` is discarded.** The schema returns `RequestFinancingResult = FinancingRequested | FinancingError`. This code treats every 200 as success and silently swallows `FinancingError` codes (`INVOICE_NOT_APPROVED`, `OFFER_EXPIRED`, `FORBIDDEN`, `UNKNOWN`). Handle exhaustively — a compiler error is what should catch a new error code, not a production silent-fail.
- **M10 — `amount` rendered raw.** `Money` is minor units (`150000` == `1500.00`). Rendering the raw integer is wrong; the "$1500.00" invoice will show up as "$150,000" to the supplier. Format via a currency pipe once we have the currency field wired.
- **M11 — Fetching in the component.** Data-access belongs behind a service / SignalStore per the DDD split. Moving it also fixes M1, M5, and M9 at the same time.

---

## Minor / cleanup

- **m1** — Prefer `inject(HttpClient)` over constructor injection; constructor is empty of logic anyway.
- **m2** — When the fetch moves to a service, mark it `providedIn: 'root'`.
- **m3** — Add a `trackBy` (moot once we're on `@for` with `track inv.id`).

---

## PR order I'd propose

1. **PR-1 (Hotfix)** — B1 + B2 together. Two-line change, minimum blast radius, merge as a hotfix. The patch is shown inline below.
2. **PR-2** — B3 (error branch + finalize) plus M8 (kill `alert`). One story: "the component no longer lies about its state."
3. **PR-3** — M11 + M1 + M5 (extract fetch to a service, add typed model, drop `Store` per M3). This is the real refactor.
4. **PR-4** — M6 + M7 (standalone, OnPush, `@if`/`@for` with `track`) + m1/m2/m3. Modernisation pass.
5. **PR-5** — M2 + M9 + M10 (eligibility predicate + permission gate + union handling + Money formatting). The "make illegal states unrepresentable" pass, which pairs naturally with landing the SignalStore.

I would not bundle 1 and 3 — the hotfix has to be reviewable and revertable on its own.

---

## The two-fix patch, in code

The two worst issues are **B1** (JWT in URL) and **B2** (`[innerHTML]` XSS). Both are localised, both fintech-critical, both fix in a handful of lines — a hotfix without a wider refactor.

### Fix B1 — token moved to `Authorization` header

```diff
- const token = localStorage.getItem('jwt');
- this.http
-   .get('https://api.scf.example/invoices?token=' + token)
+ const token = localStorage.getItem('jwt');
+ const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
+ this.http
+   .get('https://api.scf.example/invoices', { headers })
    .subscribe((res: any) => {
      this.invoices = res.data;
      this.loading = false;
    });
```
Impact: leak closed on this endpoint. Follow-up (PR-3+): move token retrieval and header injection into an `HttpInterceptor` backed by an in-memory session store, then the component doesn't touch `localStorage` at all — which is the answer to "where should the token live" in `SECURITY.md`.

### Fix B2 — `[innerHTML]` → interpolation

```diff
-      <span [innerHTML]="inv.supplierName"></span>
+      <span>{{ inv.supplierName }}</span>
```
Impact: XSS sink removed. Angular's default interpolation escapes, which is exactly what a plain-text `supplierName` needs. If we ever get a *legitimate* need to render HTML in a supplier field (we won't), it goes through `DomSanitizer.sanitize(SecurityContext.HTML, …)` explicitly, not `[innerHTML]` with raw server data.

