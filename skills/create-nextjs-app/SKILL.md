---
name: create-nextjs-app
description: Bootstrap a production-ready Next.js app quickly. Use when user says /create-nextjs-app or asks to scaffold Next.js with TypeScript, Tailwind, linting, base architecture, and CI checks.
---

# Create Next.js App

Create a reliable baseline for rapid product development.

## Default Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint + Prettier

## Setup Steps

1. Initialize project with modern defaults
2. Ensure baseline structure:
   - `app/`
   - `components/`
   - `lib/`
   - `types/`
3. Add baseline files:
   - `.env.example`
   - `README.md`
   - `app/error.tsx`
   - `app/loading.tsx`
4. Configure package scripts:
   - `dev`, `build`, `start`, `lint`
5. Add CI workflow (lint + build)
6. Initialize git and create first commit

## Suggested Architecture

- `app/(marketing)` public pages
- `app/(app)` auth app pages
- `components/ui` reusable primitives
- `lib/api` external/internal API calls
- `lib/validators` schema validation

## Quality Checklist

- `npm run lint` passes
- `npm run build` passes
- App boots locally
- `.env.example` is complete
- First commit created with clear message

## Example Trigger Prompt

`/create-nextjs-app: 创建一个 SaaS 模板，包含 app router、tailwind、eslint、ci。`
