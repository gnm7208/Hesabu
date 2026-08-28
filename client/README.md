# Hesabu client

Vite + React + TypeScript frontend for Hesabu. See the [repo root README](../README.md) for
the full picture (backend, API, product) — this file only covers the client itself.

## Stack

React 19, TypeScript, Tailwind CSS v4, React Router, TanStack Query, lucide-react icons.
No component library — small hand-rolled primitives in `src/components/ui/`.

## Structure

```text
src/
├── lib/          # api client, TS types mirroring the backend schemas, money helpers
├── context/      # AuthContext (JWT stored in localStorage, sent as Bearer header)
├── hooks/        # TanStack Query hooks, one file per backend domain
├── components/
│   ├── ui/       # Button, Input, Card, Badge — generic primitives
│   └── group/    # MembersPanel, ContributionsPanel, ArrearsPanel, StatementsPanel
└── pages/        # Login, Register, Dashboard, GroupDetail
```

## Commands

```bash
cp .env.example .env    # VITE_API_URL — defaults to the local backend on :5050
npm install
npm run dev              # http://localhost:5173
npm run build             # tsc -b && vite build
npm run lint               # oxlint
```

Requires the backend running (see repo root README) and its `CORS_ORIGINS` to include
`http://localhost:5173`.
