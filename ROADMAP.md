# Roadmap

## Sprint 1 — Backend core (this build)
- [x] Repo scaffold: docs, CI, docker-compose, Flask app factory
- [x] Models: User, Group, GroupMember, Contribution, Statement
- [x] Auth: register/login/logout/me, JWT cookies, rate limiting
- [x] Group-scoped RBAC (treasurer vs member), no global roles
- [x] Groups + Members CRUD
- [x] M-PESA parser (`mpesa_parser.py`) — pure function, line-based, unit tested
- [x] Contribution import endpoint (parse → match by phone → persist with confidence)
- [x] Arrears computation against a group's contribution schedule
- [x] Statement generation (immutable JSON snapshot per period)
- [x] pytest coverage on every route file + the parser (40 tests, all green)
- [x] Alembic initial migration applied against real Postgres (`docker compose up`, port 5433 —
  the host already runs a native Postgres on 5432)
- [x] End-to-end smoke test against real Postgres: register → login → group → members →
  M-PESA text import (matched + unparsed) → arrears → statement generation

## Sprint 2 — Hardening & polish
- [x] Manual-review endpoint for unmatched contributions (`PATCH .../contributions/<id>/resolve`)
- [ ] Structured logging + Sentry
- [ ] OpenAPI spec / Swagger UI
- [ ] Coverage gate in CI (`--cov-fail-under`)
- [ ] Deploy: render.yaml (backend) — decide hosting once there's a first real group

## Sprint 3 — Beyond MVP (from the original concept)
- [ ] Merry-go-round / rotation scheduling and payout tracking
- [ ] Loan tracking (member loans, interest, repayment schedules)
- [ ] WhatsApp Business API front-end so the treasurer never leaves WhatsApp
- [ ] Direct M-PESA statement PDF/CSV upload (beyond pasted SMS text)
- [ ] Freemium billing per group

## Frontend
- [x] Vite + React 19 + TypeScript + Tailwind v4 client in `client/` (hand-built, not via
  Kombai — `.kombai/` was empty; see [client/README.md](client/README.md))
- [x] Auth (login/register), Dashboard (create/list groups), GroupDetail with tabs for
  Members, Contributions (manual add, M-PESA text import, inline resolve-unmatched),
  Arrears, Statements (generate + view summary)
- [x] `npm run build` (tsc + vite) and `npm run lint` (oxlint) both clean
- [x] Driven end-to-end in a real headless Chrome (Playwright driver against system
  `google-chrome-stable`, since the sandbox couldn't download Playwright's own browser):
  register → create group → add member → paste M-PESA text → confirm auto-match →
  arrears flips to "Paid up" → generate statement → view summary. Zero console errors,
  zero failed requests, screenshots checked by hand for correct rendering.
- [ ] Frontend tests (Vitest + Testing Library) — none yet, backend-only test coverage so far
- [ ] Loading/empty states are minimal; no toast notifications on mutation success
- [ ] If Kombai gets used for this project later, treat `client/` as the API-integration
  layer to wire a Kombai-designed UI into, not something to throw away

## Frontend conventions

Small hand-rolled UI primitives (`client/src/components/ui/`) instead of a component library
— no shadcn/radix, unlike Soko's Kombai-generated `soko-ui/`. TanStack Query hooks are one
file per backend domain (`useGroups.ts`, `useMembers.ts`, etc.), mirroring the backend's one
service/one schema/one route file per domain. Auth token lives in `localStorage` and is sent
as a Bearer header (not cookies) — simpler for local dev across the two ports (5173/5050)
with no CORS-credentials/CSRF-cookie complexity.

## Notes / decisions

- Arrears are **computed**, not a persisted table — a group's `contribution_amount_cents` +
  `contribution_frequency` on `Group` is the schedule; `contribution_service.compute_arrears`
  diffs it against actual `Contribution` rows per member. Avoids a sync-drift class of bugs a
  persisted `Arrear` table would invite.
- `GroupMember` is separate from `User` — most chama members won't have logged in yet when the
  treasurer first imports a statement; they're tracked by name + phone and linked to a `User`
  later if they create an account.
