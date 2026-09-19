# CLAUDE.md — Hesabu Backend

> Guidance for AI assistants working on the Hesabu backend.

## Overview

Hesabu is a chama (savings group) reconciliation backend (Flask + PostgreSQL). Its
reason to exist is the M-PESA statement parser — turning messy forwarded SMS text into a
structured, matched, dispute-proof contribution ledger. Everything else (groups, members,
statements) exists to support that.

## Architecture

- **App factory pattern:** `server/app.py` creates and configures the Flask app.
- **Blueprints:** each domain has its own blueprint in `server/routes/`, mounted at `/api/v1`.
- **Models:** SQLAlchemy 2.x models in `server/models/`, one file per model.
- **Schemas:** Marshmallow schemas in `server/schemas/` for request validation + serialization.
- **Services:** business logic in `server/services/`, one file per domain. Routes stay thin —
  they validate with a schema, call a service, return JSON.
- **Extensions:** db, migrate, jwt, cors, limiter wired in `server/extensions.py`.

## The parser (`server/services/mpesa_parser.py`)

Pure text-in, structured-data-out. `parse_mpesa_text(raw_text)` takes one M-PESA confirmation
SMS per line and returns `(parsed, unparsed)`:
- `parsed`: list of dicts with `code`, `amount_cents`, `sender_name`, `phone` (normalized to
  `2547XXXXXXXX`), `contributed_at`, `raw_text`.
- `unparsed`: raw lines that looked like a confirmation but didn't match, for manual review.

`Contribution.match_confidence` has four values: `auto` (phone matched a member at import
time), `manual` (fully hand-entered by the treasurer, never went through the parser),
`unmatched` (parsed fine, no member has that phone), `resolved` (a treasurer manually linked
an `unmatched` row to a member via `PATCH .../contributions/<id>/resolve`).

Deliberately has **no knowledge of groups or members** — matching a parsed row to a
`GroupMember` by phone is `contribution_service.py`'s job. Keep that separation: it's what
makes the parser testable in isolation and reusable if the input format changes (till vs
paybill vs P2P all share the same shape with minor wording differences).

## Conventions

- **Money:** always integer minor units (cents). Never float math on money.
- **Auth:** JWT (`sub` = user id) in httpOnly cookies + Bearer header. No global roles — a
  user's role (`treasurer` / `member`) is per-`GroupMember`, checked via
  `utils/auth.treasurer_required` / `group_member_required` against the `group_id` in the URL.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- **Files:** one route file per domain, one test file per route file, one schema file per
  domain. Split a file once it passes ~300 lines.
- **Comments:** explain *why*, not *what* — especially parser regex quirks and ordering
  constraints.

## Commands

```bash
# Setup
cp .env.example .env
docker compose up -d
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. alembic -c server/migrations/alembic.ini upgrade head

# Dev
flask --app server.wsgi run

# Test
pytest server/tests/ -v

# Lint
ruff check server/
ruff format server/

# Migrations
PYTHONPATH=. alembic -c server/migrations/alembic.ini revision --autogenerate -m "message"
PYTHONPATH=. alembic -c server/migrations/alembic.ini upgrade head

# Seed demo data
PYTHONPATH=. python server/seed.py
```

## Database

- PostgreSQL 16 via Docker Compose locally (`docker-compose.yml`).
- Migrations in `server/migrations/`.

## API Versioning

All routes prefixed `/api/v1/`.

## Security

- Rate limits: register 3/min, login 5/min, contribution import 10/min (bulk text paste).
- CORS origins from env.
- JWT in httpOnly cookies (+ Bearer header for API clients).
- Every mutating group/member/contribution/statement route checks group-scoped RBAC —
  never trust `group_id` in the URL alone.
- Financial data: no client ever sends a contribution's final matched state — matching
  confidence is always computed server-side from `GroupMember` records.

## App packaging (PWA / app stores)

- The PWA layer is three files in `client/public/` — `manifest.webmanifest`, `sw.js`, and the icon set (`favicon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) — plus `client/src/lib/register-sw.ts`, which registers the worker only when `import.meta.env.PROD` is true.
- **Bump `CACHE_NAME` in `sw.js`** whenever you change a file listed in `APP_SHELL`; the activate handler deletes older caches. Hashed Vite assets don't need this.
- `sw.js` never caches `/api/*` and ignores cross-origin requests. Keep it that way: stale API data is worse than an offline message.
- `client/public/.well-known/assetlinks.json` must contain the SHA-256 of the key in `~/.android-signing/hesabu.keystore` and the package id `com.gnm7208.hesabu`. If the key ever changes, regenerate this file or the Android app falls back to a browser tab with a URL bar.
- `client/public/privacy.html` is the store-facing privacy policy; keep it truthful when new data is collected.
- The Android (TWA) project is generated by Bubblewrap from `../store-packaging/hesabu/twa-manifest.json`; rebuild with `bubblewrap update && bubblewrap build` there after a manifest/icon change, and bump `appVersionCode` for every store upload.
