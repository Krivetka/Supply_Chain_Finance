# Supply Chain Finance — Senior Angular Take-Home


## Repository layout

```
.
├── README.md                        # this file
├── ARCHITECTURE.md                  # Part 2
├── REVIEW.md                        # Part 3
├── SECURITY.md                      # Part 4
├── apps/
│   └── scf-web/                     # thin app shell — bootstrap + routes
├── libs/
│   ├── shared/kernel/               # value objects (Money, IDs, Currency)
│   ├── invoicing/
│   │   ├── domain/                  # types, discriminated union, eligibility
│   │   ├── data-access/             # SignalStore, fixtures, mock service
│   │   ├── ui/                      # dumb components
│   │   └── feature-list/            # smart container
│   └── auth/data-access/            # current user + permissions
├── tests/                           # Jest specs
├── tsconfig.base.json               # path aliases + strict flags
├── tsconfig.json                    # includes libs/ apps/ tests/
├── tsconfig.spec.json               # inherits base, used by ts-jest
├── jest.config.js
├── jest.setup.ts                    # zoneless test env
└── package.json
```

Every library exposes its public API through `src/index.ts` — nothing else may be imported from outside.

## Request-financing UI strategy — pessimistic

The `requestFinancing` action in `InvoicesStore` is **pessimistic**. On click:

1. `requestingId` is set to the invoice ID immediately — the button shows a spinner and becomes disabled. The invoice's `status` is **not** touched.
2. The service call resolves.
3. On `FinancingRequested`: status transitions `APPROVED → FINANCING_REQUESTED` and `requestingId` clears.
4. On `FinancingError`: `lastError` is set, `requestingId` clears, status stays `APPROVED`.
5. On network exception (`catchError`): same as error, with `lastError = 'UNKNOWN'`.

**Why pessimistic:** in fintech you do not show the user "financed" until the server confirms. A speculative optimistic update that has to roll back after a rejection risks the user closing the tab, having taken a financial decision on the wrong state.

**Rollback path:** trivial by construction — the invoice's status never changed speculatively, so there is nothing to undo. The only cleanup on failure is clearing `requestingId` and surfacing `lastError` to the UI (dismissible via `store.clearError()`).

## Tag policy

- `type:ui` → may import `type:util` only
- `type:feature` → may import `type:data-access`, `type:ui`, `type:util`
- `type:data-access` → may import `type:util`
- `type:util` → imports nothing
- `scope:invoicing` and `scope:auth` may import `scope:shared`, never each other directly

`shared/kernel` is `type:util`, `scope:shared`. `invoicing/*` and `auth/data-access` carry their own scope tags. Enforced via `@nx/enforce-module-boundaries` (or the equivalent ESLint rule set) in a real workspace; here the rules are documented and applied by convention through the `tsconfig` path aliases and `index.ts` barrels.

## How to run

Prerequisites: Node.js 20+ (developed on 24.2) and npm 10+.

### First-time setup

```bash
npm install
```

Installs Angular 20, `@ngrx/signals` 20, Jest, ts-jest, and the `jest-preset-angular` preset. Roughly 380 packages, one minute on a warm cache.

### Type-check the whole workspace

```bash
npm run typecheck
```

Runs `tsc --noEmit` against `tsconfig.json`, which walks every file in `libs/`, `apps/`, and `tests/` under strict flags (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitAny`). Exit code 0 means the type-level invariants — including "`requestFinancing` refuses anything that isn't `EligibleInvoice`" and the exhaustive `switch` over `RequestFinancingResult` — all hold.

### Run tests

```bash
npm test
```

Runs the Jest suite once. Two files, nine tests, roughly fifteen seconds cold:

- `tests/eligibility.spec.ts` — five cases on the pure `canRequestFinancing` predicate (happy path + each of the four rejection paths in isolation).
- `tests/invoices.store.spec.ts` — four cases on `InvoicesStore` transitions (initial state, `load`, `setFilter`, and the `APPROVED → FINANCING_REQUESTED` transition after a successful `requestFinancing`).

### Watch mode

```bash
npm run test:watch
```

Interactive Jest with re-run on save. Useful when iterating on `eligibility.ts` or the store.

### No dev server on purpose

There is no `npm start` / `ng serve`. Wiring an Angular CLI workspace (`angular.json`, `@angular-devkit/build-angular`) or a Vite-based bundler is a half-hour of ceremony that this take-home explicitly waives — "we're reading the structure of your code, not running a server". Type-checking and tests cover the correctness surface that a running app would.

