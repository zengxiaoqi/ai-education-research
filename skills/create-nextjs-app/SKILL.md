---
name: create-nextjs-app
description: Bootstrap a production-ready Next.js application quickly. Use when user says /create-nextjs-app, asks to initialize Next.js, scaffold frontend, or set up TypeScript + Tailwind + linting baseline.
---

# Create Next.js App Skill

Create a clean baseline for a new product.

## Preferred stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint + Prettier

## Setup checklist

1. Initialize project with modern defaults.
2. Ensure these folders exist:
   - `app/`
   - `components/`
   - `lib/`
   - `types/`
3. Add:
   - `.env.example`
   - `README.md` quickstart
   - basic error/loading states
4. Add scripts in `package.json`:
   - `dev`, `build`, `start`, `lint`
5. Add CI baseline (lint + build).
6. Initialize git and create first commit.

## Suggested baseline architecture

- `app/(marketing)` for landing/public pages
- `app/(app)` for authenticated area
- `components/ui` for reusable primitives
- `lib/api` for API clients
- `lib/validators` for schema validation

## Done definition

- `npm run lint` passes
- `npm run build` passes
- app boots locally
- first commit created
