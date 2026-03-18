---
name: startup-flow
description: Orchestrate end-to-end product delivery from brainstorm to launch. Use when user asks for a full workflow like brain storm -> planning -> /product-requirements -> /prototype-prompt -> /create-nextjs-app -> /vercel-deploy.
---

# Startup Flow (End-to-End)

Use this skill as the command center for the full product lifecycle.

## Phase 0: Brainstorm

Output:
- User
- Pain
- Value
- MVP (3-5 features)
- Out-of-scope
- Success metric

## Phase 1: Plan

Output:
- Milestones (M1/M2/M3)
- Risks
- Dependencies
- Priority map (P0/P1/P2)

## Phase 2: Requirements

Invoke: `/product-requirements`
Deliverable: executable PRD with acceptance criteria.

## Phase 3: Design Spec

Invoke: `/prototype-prompt`
Deliverable: IA + user flows + state matrix + component rules.

## Phase 4: Build

Invoke: `/create-nextjs-app`
Deliverable: running Next.js baseline + CI + first commit.

## Phase 5: Deploy

Invoke: `/vercel-deploy`
Deliverable: preview + production URLs + release checks.

## Final Handoff Template

- Product brief:
- PRD status:
- Design spec status:
- Build status:
- Deployment status:
- Risks remaining:
- Next sprint goals:

## Example Trigger Prompt

`请按 startup-flow 帮我从 0 到上线做完整推进。`
