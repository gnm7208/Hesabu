# Hesabu

Close-the-books tooling for chamas (informal savings/investment groups). Hesabu ingests a
group's M-PESA contribution records and turns them into a clean, dispute-proof ledger — so the
treasurer's monthly reconciliation stops being a manual nightmare of matching SMS messages to
names in a notebook.

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
