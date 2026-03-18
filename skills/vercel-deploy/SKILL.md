---
name: vercel-deploy
description: Deploy web apps to Vercel with a safe preflight checklist. Use when user says /vercel-deploy, asks for one-click launch, production deployment, env setup, domain binding, or post-release checks.
---

# Vercel Deploy Skill

Ship safely and verify immediately after release.

## Pre-deploy checks

- Build passes locally
- Required env vars are documented and set
- Error handling pages exist
- Basic metadata/SEO configured

## Deployment workflow

1. Connect repository to Vercel.
2. Configure framework preset and build settings.
3. Add environment variables for Preview/Production.
4. Deploy preview and smoke-test.
5. Promote to production.

## Post-deploy checklist (first 24h)

- Verify key routes and auth flow
- Check logs for runtime errors
- Track performance (LCP/TTFB)
- Confirm domain + HTTPS certificate
- Confirm analytics/events flowing

## Rollback rule

If P0 flow breaks, rollback immediately and open hotfix branch.

## Output format when assisting

- Deployment status
- URL(s): preview + production
- Missing env vars (if any)
- Risk notes and next actions
