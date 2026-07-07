# Architecture Notes

## 1. Why split into `data-access` / `util` / `feature` / `ui`?

The split enforces the Dependency Inversion Principle at the library level: `domain` depends on nothing, `data-access` depends only on `domain`, `ui` depends on `domain` types, `feature` orchestrates all three. Two payoffs:

- **Reversibility.** Swapping GraphQL for REST touches `data-access` only. `domain`, `ui`, and the eligibility logic stay untouched.
- **Testability.** `ui` = pure `@Input`/`@Output` — no HTTP-mocking test scaffolding. `domain` = pure functions.

**A concrete bug the "ui imports no services" rule prevents.** A dumb `FinanceButtonComponent` (in `ui`) is tempted to `inject(AuthStore)` and compute `canFinance = auth.permissions().includes('supplier:financing')` inline. Four things break the moment this ships:

- Every unit test and every Storybook story now needs the full `AuthStore` provider tree (HTTP client included). Snapshot tests fail on backend-less environments; Storybook white-screens.
- A contract change on `AuthStore` cascades to every UI file that touched it — a data-access-layer edit becomes a forty-file diff.
- Reuse dies: the button is hard-wired to `supplier:financing` and can't be dropped into a `treasury-list` feature with different rules.
- The permission decision is buried inside a leaf component — you can't audit "who can finance" by reading the container.

Correct shape: `FinanceButtonComponent` accepts `input.required<boolean>()`, the smart container in `feature-list` reads permissions from `AuthStore` and passes the flag down. Tests are trivial, Storybook works, reuse is free.

## 2. Global store vs SignalStore vs local signal — rule of thumb

Two criteria decide, not "how much data":

- **Scope of readers.** One component, no cross-view survival → `signal()` inside the component. One feature (multiple components, one route tree) → SignalStore in that feature's `data-access`. Multiple features / cross-cutting concern (auth, feature flags, notifications) → a dedicated SignalStore or a global store.
- **Lifetime.** Lives with the component (open/close a dropdown, isEditing) → local signal. Lives with the feature (list state that survives route re-entry) → feature SignalStore. Lives with the session (current user, permissions) → cross-cutting store.

**Placement in this feature:**
- Invoices, filter/search state, request-financing status → `invoicing/data-access` SignalStore. Domain-scoped, multiple components read, one owner writes.
- Current user + permissions → `auth/data-access` SignalStore. Cross-cutting but doesn't justify a full global-store apparatus for a single feature.
- Local UI state (dropdown open, hover, form-editing) → `signal()` in the component. No store at all.

**Where teams usually get it wrong:**

- **Everything into global NgRx "just in case".** List of invoices becomes `dispatch(load())` + `select(selectFilteredInvoices)` + effects + reducers + actions per keystroke. Tests turn into TestBed with MockStore. Race conditions between effects. NgRx earns its keep on genuinely cross-cutting state with heavy side-effects — for "the list on one screen" it's over-engineered by an order of magnitude.
- **Cross-cutting state in a local signal.** Current user held as `signal()` inside `header.component`. Works with one consumer, then a sidebar needs it — `@Input` chains, `@Output logout`, ad-hoc event buses. By the third consumer it should have been a store from day one. Rule: if the state is read across two different branches of the component tree, it doesn't belong in one leaf.
- **One giant SignalStore for the whole app.** Auth + invoices + notifications + UI prefs all in `AppSignalStore` — forty fields, twenty methods, terrifying to change. Rule: one store, one bounded context.
- **Derived state computed in the component, not the store.** `filteredInvoices` calculated in a template getter or a component-level RxJS pipe. Each consumer computes its own version → drift. Belongs as `computed()` inside the SignalStore — one source of truth.

## 3. What changes in this code with Zone.js gone? What breaks during a zoneless migration of a legacy app?

**What changes.** Zone.js patches every async browser API (`setTimeout`, `Promise`, `addEventListener`, `fetch`, `XHR`, observers, `requestAnimationFrame`) and triggers change detection after each of them completes. With `provideZonelessChangeDetection()`, the patching is gone: Angular only re-renders when a signal changes, `markForCheck()` fires, or `ApplicationRef.tick()` is called explicitly. The payoff is ~100 KB off the bundle, less runtime overhead, cleaner interop with third-party libraries, and the requirement that state mutations become intentional — no more accidental CD from a stray `setTimeout` deep in a vendor library.

This feature is designed signal-first with `OnPush` on every component, so removing Zone is a one-line change in `app.config.ts` (`provideZoneChangeDetection()` → `provideZonelessChangeDetection()`) plus dropping `zone.js` from polyfills. Nothing in the business code moves.

**What breaks in a typical legacy app.** Everywhere state is mutated inside an async callback that Zone used to notice:

- `setTimeout` / `setInterval` callbacks that flip state (`this.showToast = false`) — state updates, view doesn't.
- `Promise.then()` and `async/await` in components with direct field assignment (`this.data = await this.svc.load()`).
- `HttpClient.subscribe(res => this.foo = res)` — classic legacy pattern with no signal wrapper.
- Third-party callbacks: Chart.js `onClick`, Google Maps events, DataDog RUM, older `ngx-*` packages that assume Zone patching.
- Native browser callbacks: `FileReader.onload`, `IntersectionObserver`, `MutationObserver`, `ResizeObserver`, `WebSocket.onmessage`.
- `ChangeDetectionStrategy.Default` combined with in-place mutation (`this.items.push(x)`) — no new reference, no signal, no update.

**How to find those spots.**

- **Static grep:** `\.subscribe\(`, `setTimeout|setInterval`, `\.then\(`, `addEventListener`, `ChangeDetectionStrategy\.Default` — each match is a candidate to audit.
- **ESLint:** ban `ChangeDetectionStrategy.Default` in new files; forbid direct field assignment inside `subscribe()` callbacks via `no-restricted-syntax`.
- **Runtime canary:** flip `provideZonelessChangeDetection()` on in a staging environment and run the e2e suite. Anything that "sticks" — spinner never disappears, form doesn't disable, list stays stale — is a spot that relied on Zone.
- **Angular DevTools Profiler:** shows CD ticks. A user action followed by silence in the profiler = missing tick = suspect.
- **Incremental strategy for large legacy:** migrate feature-by-feature to signals + `OnPush` while Zone is still on (behaviour identical), then flip the provider once the last hotspot is converted. Temporary bridge if unblocking a release: `inject(ApplicationRef).tick()` at known bad callbacks — not a fix, but keeps the deploy moving while the real change lands.

## 4. A new `payments` domain needs supplier identity and invoice data — how to share without cycles or a god-library?

**Shared kernel for value objects; each domain owns its aggregates.** A thin `libs/shared/kernel` library (`type:util`) holds only universal, stable value objects that don't belong to any single domain:

```ts
// libs/shared/kernel/src/index.ts
export type { Money } from './money';
export type { Currency } from './currency';
export type { SupplierId } from './supplier-id';
export type { InvoiceId } from './invoice-id';
export type { DateTime } from './date-time';
```

No business logic, no HTTP client, no services — types and pure helpers only (`Money.add`, `Money.format`). Both `invoicing` and `payments` depend on `shared/kernel`, never on each other. Cycles become impossible by construction, because the arrows only ever point *into* the kernel.

**What stays out of the kernel.** Full aggregates — `Invoice` with its `FinancingOffer`, `Payment` with its clearing details — live inside their owning domain. If `payments` needs a slice of invoice data at runtime, it comes from the backend as data (a `PaymentContext` response), not by importing invoicing types. The rule: the kernel is for things that don't evolve. `Money` in minor units won't change; `InvoiceStatus` might grow a `PARTIALLY_FINANCED` value tomorrow — so it stays in `invoicing`.

**Anti-pattern: the god-library.** A `libs/shared` (or `libs/common`) that accumulates types from every domain, plus the HTTP client, plus auth, plus notifications, plus a UI kit. Within a year every feature depends on it, every PR rebuilds everything, and no one can tell which parts are still used. Prevented with Nx boundary tags: `scope:shared` depends only on `scope:shared`, `scope:invoicing` cannot import `scope:payments`, and inside `shared/*` there are narrow libraries (`shared/kernel`, `shared/http`, `shared/ui-kit`), not one catch-all.

**Ownership rule for cycles.** One entity, one owner: `Invoice` in `invoicing`, `Payment` in `payments`, `SupplierId` in `shared/kernel`. If a two-way dependency ever seems required, that is a signal the model is split wrong — usually the fix is a third domain (`settlements`, `financial-events`) that both sides can depend on, rather than making the existing two point at each other.
