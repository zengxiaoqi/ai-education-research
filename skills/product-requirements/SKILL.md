---
name: product-requirements
description: Generate an implementation-ready PRD from rough ideas. Use when user says /product-requirements, asks to define MVP scope, user stories, acceptance criteria, priorities, risks, or delivery milestones.
---

# Product Requirements (PRD)

Convert idea -> executable product spec.

## Required Inputs

- Product one-liner
- Target user segment
- Top pain point
- Core value proposition
- MVP deadline (or sprint window)
- Constraints (team size, budget, compliance, tech)

## Workflow

1. Clarify scope boundaries (`in` / `out`)
2. Define measurable goals (max 3)
3. Write key user stories
4. Prioritize requirements (P0/P1/P2)
5. Add non-functional requirements
6. Add acceptance criteria for P0/P1
7. Add risks, dependencies, milestones

## Output Template

### 1) Product Overview
- Problem statement:
- Target users:
- Product value:

### 2) Goals & Metrics
- Goal 1 + metric:
- Goal 2 + metric:
- Goal 3 + metric:

### 3) Scope
- In scope:
- Out of scope:

### 4) Functional Requirements
- P0 (must):
- P1 (should):
- P2 (nice):

### 5) Non-functional Requirements
- Performance:
- Security:
- Reliability:
- Accessibility:
- SEO:

### 6) Acceptance Criteria
For each P0/P1 feature:
- Given ...
- When ...
- Then ...

### 7) Risks & Dependencies
- Risk:
- Impact:
- Mitigation:

### 8) Milestones
- M1:
- M2:
- M3:

## Quality Checklist

- Every P0 has testable acceptance criteria
- No vague wording without numbers
- Scope is explicitly bounded
- Milestones align with priority and constraints

## Example Trigger Prompt

`/product-requirements: 做一个 AI 教育产品，目标是 K12 家长，2 周做 MVP。输出可开发 PRD。`
