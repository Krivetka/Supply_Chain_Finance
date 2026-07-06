# Supply Chain Finance — Senior Angular Take-Home

Take-home submission. Original task: `Senior-Angular-Take-Home.docx` in the repo root.

## Status

| Part | File(s) | Status |
|------|---------|--------|
| Part 1 — Feature code (Nx libs, SignalStore, feature) | `libs/` | Pending (separate stage) |
| Part 2 — Architecture notes | `ARCHITECTURE.md` | Skeleton |
| Part 3 — Review & refactor | `REVIEW.md`, `legacy/`, `refactor/` | Skeleton |
| Part 4 — Security | `SECURITY.md` | Skeleton |

## Reading order

The task author suggests this order in the Submitting section as the most informative for a reviewer:

1. **`REVIEW.md`** — Part 3, legacy component review + two fixes in `refactor/`.
2. **`ARCHITECTURE.md`** — Part 2, architectural rationale.
3. **`libs/`** — Part 1, thin vertical slice of the feature *(to be added)*.
4. **`SECURITY.md`** — Part 4, short answers.

## Repository layout

```
.
├── README.md                        # this file
├── ARCHITECTURE.md                  # Part 2
├── REVIEW.md                        # Part 3
├── SECURITY.md                      # Part 4
├── Senior-Angular-Take-Home.docx    # original task
├── legacy/
│   └── invoice-list.component.ts    # verbatim copy from the task, "before" reference
└── refactor/
    └── invoice-list.component.ts    # fix for the two worst issues (reference-quality)
```

## How to run

Part 1 (Angular workspace) is not set up yet, so there are no `npm install` / `ng serve` commands.
Files in `refactor/` are reference-quality: they should *read* as valid Angular code but are not runnable as-is. Once the Part 1 workspace exists, these files can be dropped in and executed.

## Boundary setup (preview for Part 1)

Planned DDD layout:

```
libs/
  invoicing/
    domain/         type:util          — types, VOs, pure logic (imports nothing)
    data-access/    type:data-access   — Apollo, SignalStore, mappers (may import domain)
    feature-list/   type:feature       — smart containers (may import data-access, ui, domain)
    ui/             type:ui            — dumb components (only domain)
  auth/
    data-access/    type:data-access   — current user + permissions
```

`@nx/enforce-module-boundaries` rules:
- `type:ui` → `type:util` only
- `type:feature` → `data-access`, `ui`, `util`
- `type:data-access` → `util`
- `type:util` → nothing

## State ownership decision

- **Invoices, filters, request status** → `invoicing/data-access` SignalStore. Domain-local state, snapshot of server state, lives next to Apollo.
- **Current user + permissions** → `auth/data-access` (separate SignalStore). Cross-cutting, but not global NgRx — overkill for a single feature. Rationale in `ARCHITECTURE.md`.
- **Local UI state (dropdown open, etc.)** → `signal()` in the component.
