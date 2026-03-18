---
name: prototype-prompt
description: Produce a clear design-spec prompt for prototyping UI/UX. Use when user says /prototype-prompt, asks for design specifications, wireframe prompts, component rules, states, or interaction guidelines.
---

# Prototype Prompt Skill

Generate a design-oriented prompt that can be fed into UI design/prototyping tools or designers.

## Inputs to collect

- Product goal
- Target user
- Main tasks (top 3)
- Platform (web/mobile)
- Visual style keywords
- Brand constraints (if any)

## Output sections

1. **Information Architecture**
   - pages, hierarchy, navigation
2. **Core user flows**
   - happy path + edge/error paths
3. **Page-level requirements**
   - each screen’s objective and key elements
4. **Component spec**
   - buttons, forms, tables/cards, feedback components
5. **State design**
   - loading, empty, success, error, permission denied
6. **Responsive rules**
   - breakpoints and layout behavior
7. **Visual tokens**
   - spacing, colors, typography, radius, shadows
8. **Accessibility checklist**
   - keyboard nav, contrast, labels, focus states

## Deliverable style

- Prefer bullet lists over prose.
- Include concrete constraints (e.g. “button height 40/44 px”).
- Keep it implementation-friendly for frontend developers.
