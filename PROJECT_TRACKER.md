# Project Tracker

## 2026-08-28

**Morning plan:** Read `app-build-recommendations.md` and `PROJECT_PLAYBOOK.md` from the
Projects folder; scaffold Hesabu's backend following the Agrilink/Soko conventions
(Flask app factory, SQLAlchemy 2, Marshmallow, group-scoped RBAC). Priority: get the M-PESA
parser — the actual hard/differentiating problem — working and tested first.

**Evening log:** Backend scaffolded end-to-end: models (User, Group, GroupMember,
Contribution, Statement), auth, group/member/contribution/statement routes + services,
`mpesa_parser.py` with line-based regex parsing + phone normalization, arrears computed
on the fly from a group's contribution schedule. Full pytest suite (40 tests: parser + every
route file) green, `ruff check`/`ruff format --check` clean. Caught and fixed a real bug
before it hit production: the auto-created treasurer `GroupMember` fell back to a
`user-<uuid>` placeholder phone that overflowed `VARCHAR(20)` on Postgres (SQLite silently
tolerated it) — made `phone` nullable instead of faking a value. Ran the Alembic
autogenerate + upgrade against a real Dockerized Postgres (remapped to host port 5433 since
5432 is already taken by a native Postgres service on this machine) and did a full curl-driven
smoke test: register → login → create group → list members → import a raw M-PESA text blob
(one line matched by phone, one nonsense "Confirmed"-containing line correctly flagged as
unparsed) → arrears → generate statement. All worked first try. `git init`'d and staged
(not committed — reviewed, no secrets). Added the manual-review endpoint (`PATCH
.../contributions/<id>/resolve`) for unmatched contributions, plus a fourth
`match_confidence` value (`resolved`) to distinguish a human-confirmed match from an
automatic phone match — 3 more tests, still green.

User then asked for the frontend too (originally deferred to Kombai since `.kombai/` was
sitting in the repo — empty, no canvases, so nothing to lose by building by hand instead).
Scaffolded `client/` with Vite + React 19 + TS + Tailwind — note Tailwind installed as v4,
which needed the `@tailwindcss/vite` plugin + CSS-first `@theme` config instead of the v3
`tailwind.config.js`/postcss setup I started with. Built auth (login/register), Dashboard
(group list/create), and GroupDetail with tabs for Contributions (manual entry, M-PESA text
import, inline resolve-unmatched), Arrears, Statements (generate + view), Members. Auth token
in `localStorage`, sent as Bearer header — sidesteps cross-origin cookie/CSRF complexity for
local dev across :5173/:5050. `npm run build` and `npm run lint` (oxlint) both clean.

Verified in an actual browser, not just build/lint: sandbox has no network path to download
Playwright's own Chromium (silently stalled at 16KB for minutes), but `/usr/bin/google-chrome-stable`
was already installed system-wide, so drove that headlessly via `playwright-core` instead of
giving up on visual verification. Full golden path — register → create group → add member →
paste M-PESA SMS → auto-match → arrears flips to "Paid up" → generate statement → view
summary — worked with zero console errors and zero failed requests. One false alarm along the
way: first import attempt showed "0 imported, 1 duplicate" because the test script reused the
exact fake M-PESA code from `seed.py`, which the same dev Postgres already had — correct
duplicate-detection behavior, not a bug, just sloppy test data on my part. Fixed the test
script, not the app. Re-seeded the dev DB afterward to wash out test-run clutter, and cleaned
up the throwaway driver script + `playwright-core`/`playwright` deps (not for the repo).

**Next:** `git add` the new `client/` files + commit (still not committed — only ever on
explicit request), OpenAPI spec, frontend tests (Vitest — currently zero, backend-only
coverage), decide on toast notifications / better loading states.
