# Hesabu

Close-the-books tooling for chamas (informal savings/investment groups). Hesabu ingests a
group's M-PESA contribution records and turns them into a clean, dispute-proof ledger — so the
treasurer's monthly reconciliation stops being a manual nightmare of matching SMS messages to
names in a notebook.

## Live demo

| | URL |
|---|---|
| **App** (Vercel) | https://hesabu-sigma.vercel.app |
| **API** (Render) | https://hesabu-api.onrender.com |
| API health check | https://hesabu-api.onrender.com/api/health |

> Both run on free tiers, so the API **cold-starts after inactivity** — the first request can
> take ~50s while the instance spins up. Give the login screen a moment on first load.

Demo login (from `server/seed.py`): `treasurer@hesabu.local` / `treasurer123`

## The problem

Chamas move billions of shillings in aggregate but still run on WhatsApp threads and paper
notebooks. Saving isn't the pain point — reconciling who paid what, tracking arrears, and
closing the books every month is. Existing chama apps focus on collecting contributions;
reconciliation is the part nobody has solved.

## What it does (MVP)

- Treasurers create a **group**, set the expected contribution amount/frequency, and add
  **members** (tracked by name + phone, with or without their own login).
- Paste in raw M-PESA confirmation SMS text (one per line) and Hesabu's **parser** extracts the
  transaction code, amount, sender name/phone, and timestamp — then matches each line to a
  group member by phone number.
- Unrecognized or unmatched lines are flagged for manual review instead of silently dropped.
- The **ledger** shows who paid, how much, when, and via what M-PESA code — plus who's in
  **arrears** against the group's contribution schedule.
- Generate an immutable **statement** snapshot (period totals, per-member breakdown, arrears)
  that the treasurer can share with the group.

## Beyond MVP

See [ROADMAP.md](ROADMAP.md) — merry-go-round/payout scheduling, loan tracking, a WhatsApp
bot front-end, freemium billing per group.

## Stack

**Backend:** Flask (app factory + blueprints) · SQLAlchemy 2 · Alembic · PostgreSQL ·
Marshmallow · flask-jwt-extended · pytest. See [CLAUDE.md](CLAUDE.md) for architecture and
conventions.

**Frontend:** Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router · TanStack Query.
See [client/README.md](client/README.md).

## Getting started

Backend:

```bash
cp .env.example .env
docker compose up -d               # Postgres on :5433 (host already runs one on :5432)
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. alembic -c server/migrations/alembic.ini upgrade head
PYTHONPATH=. python server/seed.py # optional demo data
flask --app server.wsgi run --port 5050
```

Runs at `http://localhost:5050`. Health check: `GET /api/health`.

Frontend (in a second terminal):

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## Tests

```bash
pytest server/tests/ -v
ruff check server/

cd client && npm run build && npm run lint
```

## API overview

All routes are prefixed `/api/v1`.

| Domain | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Groups | `POST /groups`, `GET /groups`, `GET /groups/<id>`, `PATCH /groups/<id>` |
| Members | `POST /groups/<id>/members`, `GET /groups/<id>/members`, `PATCH .../<member_id>`, `DELETE .../<member_id>` |
| Contributions | `POST /groups/<id>/contributions`, `GET /groups/<id>/contributions`, `POST /groups/<id>/contributions/import`, `PATCH .../<contribution_id>/resolve`, `GET /groups/<id>/arrears` |
| Statements | `POST /groups/<id>/statements`, `GET /groups/<id>/statements`, `GET .../<statement_id>` |

Money is always stored and moved as **integer minor units (cents)** — never floats.

## Deployment

| Piece | Where | Config |
|---|---|---|
| API | Render web service `hesabu-api` | [`render.yaml`](render.yaml) |
| Database | Neon (external Postgres) | `DATABASE_URL` env var on Render |
| Frontend | Vercel project `hesabu`, root dir `client/` | [`client/vercel.json`](client/vercel.json) |

Both sides auto-deploy on push to `main`.

Two things that will bite you if you re-deploy this elsewhere:

- **The Vercel domain is `hesabu-sigma.vercel.app`, not `hesabu.vercel.app`** — the latter
  belongs to an unrelated project. `CORS_ORIGINS` on Render must match the real domain exactly
  (no trailing slash) or every browser request fails preflight.
- **`VITE_API_URL` is inlined at build time**, not read at runtime. Changing it on Vercel has
  no effect until you trigger a fresh build.

The database is on Neon rather than Render because Render permits only one active free
Postgres per account, and `soko-db` already holds that slot.
