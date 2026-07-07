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
├── tsconfig.json
├── jest.config.ts
└── package.json
```

Every library exposes its public API through `src/index.ts` — nothing else may be imported from outside.

## Boundary rules (planned tags)

- `type:ui` → may import `type:util` only
- `type:feature` → may import `type:data-access`, `type:ui`, `type:util`
- `type:data-access` → may import `type:util`
- `type:util` → imports nothing
- `scope:invoicing` and `scope:auth` may import `scope:shared`, never each other directly

`shared/kernel` is `type:util`, `scope:shared`. `invoicing/*` and `auth/data-access` carry their own scope tags. Enforced via `@nx/enforce-module-boundaries` (or the equivalent ESLint rule set) in a real workspace; here the rules are documented and honoured by convention.

## How to run

