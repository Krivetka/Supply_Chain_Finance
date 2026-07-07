# Security Notes (Part 4)

## 1. Where does the access token live in a fintech SPA?

Not in `localStorage` — any XSS reads it in one line and exfiltrates. 

**In-memory (module signal).** No disk footprint, no CSRF surface (JS-added `Authorization` header can't be forged cross-origin), cleared on tab close. Costs: reload loses the token (needs silent refresh), not shared across tabs without `BroadcastChannel`, active XSS can still monkey-patch `fetch` and read outgoing headers.

**HttpOnly + Secure + SameSite cookie.** JS cannot touch it, survives reload, blocks CSRF on state-changing verbs. Costs: `SameSite=Lax` still allows top-level GETs; XSS can't steal the cookie but *can* act as the user via `credentials: 'include'`; cross-domain API needs correct CORS + tight `Domain` scoping; `Strict` breaks external inbound links.

**Refresh tokens:** never in JS. Short access token in memory, long refresh in HttpOnly + Secure + SameSite=Lax cookie on the API domain. If a refresh sits in JS, one XSS mints access tokens forever and the short access lifetime is meaningless.

**Stance for this app:** hybrid — in-memory access + HttpOnly refresh cookie. The highest-value credential is unreadable to JS, the access-token exposure window is short, and no CSRF-token dance because `Authorization` is JS-added rather than browser-attached.

## 2. Angular escapes interpolation — how does XSS still get in?

**Vector 1 — the sanitizer is disabled in the code.** `[innerHTML]="userData"`, `DomSanitizer.bypassSecurityTrust*()`, or `[href]` with a bypassed `javascript:` URL. `bypassSecurityTrust*` is the sharpest edge — it disables sanitization entirely for that value. **Fix:** lint-ban `bypassSecurityTrust*` globally with a narrow allowlist; when HTML is genuinely needed, use `DomSanitizer.sanitize(SecurityContext.HTML, input)` — it *runs* the sanitizer rather than turning it off. Restrict `[href]`-style bindings to an `http/https/mailto` scheme allowlist.

**Vector 2 — sinks outside Angular's control.** `ElementRef.nativeElement.innerHTML = …`, third-party libraries with `.html()` / `setContent()` methods (editors, chart libs, legacy jQuery), and SSR embedding of JSON in `<script>` blocks without escaping `</script>`. The sanitizer never sees these. **Fix:** lint-ban `nativeElement` access; wrap third-party components in adapters that sanitize on ingress; escape `</` to `<\/` when serialising state into inline `<script>` tags. The safety net for both vectors is a strict, nonce-based CSP with `unsafe-inline` disabled — even a successful injection cannot execute.

## 3. Starting CSP for this app

**Policy sketch** (nonce-based, no `unsafe-inline`):

```
default-src 'self';
script-src  'self' 'nonce-{random}' 'strict-dynamic';
style-src   'self' 'nonce-{random}';
img-src     'self' data: https:;
font-src    'self';
connect-src 'self' https://api.scf.example wss://api.scf.example;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests;
require-trusted-types-for 'script';
trusted-types default angular angular#bundler;
report-to csp-endpoint;
```

The core commitments: no `'unsafe-inline'`, no `'unsafe-eval'`, per-request nonce for the small amount of inline script/style Angular still emits, `strict-dynamic` so the app's module loader keeps working, and `connect-src` narrowed to the actual API host.

**Trusted Types (defence in depth).** `require-trusted-types-for 'script'` tells the browser to reject any raw string assigned to a DOM sink (`innerHTML`, `script.src`, `document.write`, `eval`) — the assignment throws a `TypeError` instead of executing. Values must come out of a named policy declared in `trusted-types`; Angular registers its `angular` and `angular#bundler` policies automatically and covers its own template bindings. Where a regular sanitizer can be silenced by `bypassSecurityTrust*`, Trusted Types can't — the sink itself refuses the string. Cost: any third-party library that writes to `innerHTML` directly (older editors, legacy jQuery, some chart libs) will break the first time it runs. Fix path is the same as CSP rollout — start Report-Only, catch violations in staging, wrap or replace offending sinks, then flip to enforcing.

**What usually breaks:**
- Angular attribute bindings that emit inline `style="…"` — need the nonce (Angular CLI 16+ supports this) or a tightly scoped `unsafe-hashes`.
- Third-party scripts: analytics, error reporting, chat widgets. Each must be added to `script-src` **and** `connect-src` — forgetting the second one gives silent telemetry failure.
- CDN assets (fonts, images, iframes for embeds) — `font-src` / `img-src` / `frame-src` need entries.
- Libraries that use `eval` / `new Function` (some legacy templating/chart libs). Prefer replacing the library over adding `'unsafe-eval'`.
- Angular dev server / HMR needs a relaxed CSP; prod stays strict.

**Rollout without downtime:**
1. Ship `Content-Security-Policy-Report-Only` first. Nothing blocks; violations are reported to a dedup'd endpoint (Sentry / report-uri / our own).
2. Run the main flows on staging under Report-Only; fix or allowlist each reported source. Filter browser-extension noise (`chrome-extension://` and friends) before alerting.
3. Canary the enforcing header behind a feature flag / edge config: 1% → 10% → 50% → 100%, watching report volume and support tickets between steps.
4. Keep Report-Only running *alongside* enforcing in prod, permanently. New third-party dependency added without CSP update → a report shows up an hour before users notice.
5. **Kill switch.** The CSP header is set at the edge (nginx / CDN / API gateway), not in the app. A single config flag (`CSP_MODE=enforce|report-only|off`) flips enforcement in ~30 seconds without a deploy — so an incident triggered by, say, a vendor changing their CDN domain doesn't require a code rollback. `report-only` fallback preserves visibility while the fix ships through the normal pipeline.

## 4. "Frontend permission checks are UX, not a security control"

**Why it's not security.** The frontend runs on the user's machine. Any check inside the SPA can be inspected in DevTools, patched at runtime (breakpoint → flip `false` to `true`), or bypassed entirely by calling the API directly with `curl`/Postman using a copied session. A hidden or disabled "Finance" button changes nothing about who can `POST` to the endpoint. The real gate is the backend, which must independently verify — for every call — that the user has `supplier:financing`, that the invoice is `APPROVED`, and that the supplier ownership matches. If the backend trusts the frontend, one `curl` away from compromise.

**What FE checks are for.** UX only: don't show buttons that will 403, don't route users into flows they can't complete, keep the noise-floor of legitimate 403s down.

**Keeping FE and BE in sync:**
- **Backend returns effective permissions.** Login response includes the user's current permission set; the auth store reads that. FE never reasons about *who* gets a permission, only whether the string is present.
- **Better: capability flags per resource.** Extend the schema so `Invoice` carries a computed `canRequestFinancing: Boolean!`. The backend calculates eligibility once (status + permission + supplier ownership), the FE just renders `@if (invoice.canRequestFinancing) { … }`. No duplicated rule, no drift.
- **Cache invalidation.** Permissions are fetched at login and on session refresh, not once at app start. When an admin revokes a permission mid-session, the next silent-refresh cycle picks it up and the UI updates.

**One-line rule:** the backend is the source of truth about *what the answer is*; the frontend is the source of truth about *what the user sees*. Computation stays on the backend, rendering stays on the frontend.

## 5. Two most relevant OWASP Top 10 items for this SPA

Using the OWASP Top 10 **2025** list

**A01 — Broken Access Control.** The entire business model of this platform is a set of access rules: financing can be requested only by the invoice's supplier, only with `supplier:financing`, only while status is `APPROVED`, and only on their own invoice. That makes A01 the eternal #1 here. Concrete failure modes for our schema: IDOR on `requestFinancing(invoiceId)` (someone mutates an invoice they don't own), vertical escalation (a supplier calls `approveInvoice` — a buyer-only mutation), horizontal escalation (enumerating other suppliers' invoice IDs). The only real gate is the backend independently re-verifying ownership + status + permission on every mutation. 

**A03 — Software Supply Chain Failures.** An Angular app transitively pulls hundreds of npm packages; a single compromised dependency runs inside the bundle with the user's session and can rewrite the token handler, intercept a `requestFinancing` mutation, or exfiltrate the whole DOM. This is not theoretical — from my current day-to-day I see supply-chain issues *almost every week*. For fintech the payoff for an attacker is direct: one malicious `postinstall` in a nested `@types/*` package can rewrite the auth interceptor at build time and every user session leaks. Mitigations: `package-lock.json` committed and CI-enforced, SBOM + SCA scanning (npm audit / Snyk / Socket) as a merge gate, Subresource Integrity on any external `<script src>`, npm provenance / sigstore verification for critical deps, mandatory review of `postinstall` scripts on version bumps, and an allowlist policy for runtime-loaded packages in production.
