---
name: prototype-prompt
description: Produce implementation-friendly design specifications and prototype prompts. Use when user says /prototype-prompt or asks for IA, user flow, UI states, component rules, responsive behavior, and visual constraints.
---

# Prototype Prompt

Generate design specs that reduce UI rework and speed frontend implementation.

## Required Inputs

- Product objective
- User persona
- Top 3 user tasks
- Platform (web/mobile)
- Brand/style constraints

## Output Template

### 1) Information Architecture
- Page tree
- Navigation model
- Entry points

### 2) Core Flows
- Happy path
- Error/edge paths
- Permission/empty paths

### 3) Screen Specs
For each screen:
- Goal
- Key components
- Primary action
- Validation rules

### 4) Component Rules
- Buttons (size, states)
- Forms (labels, validation, helper text)
- Lists/cards/tables
- Feedback components (toast/modal/inline)

### 5) State Matrix
- Loading
- Empty
- Success
- Error
- Disabled

### 6) Responsive Rules
- Breakpoints
- Layout behavior
- Priority of content collapse

### 7) Visual Tokens
- Colors
- Typography
- Spacing scale
- Radius/shadow

### 8) Accessibility
- Keyboard navigation
- Contrast
- Focus ring
- ARIA/labels

## Quality Checklist

- Includes both happy + abnormal flows
- Defines all key UI states
- Has concrete constraints, not vague styling words
- Directly usable by frontend engineers

## Example Trigger Prompt

`/prototype-prompt: 基于 PRD 生成 Web 端设计规范，包含状态矩阵和响应式规则。`
