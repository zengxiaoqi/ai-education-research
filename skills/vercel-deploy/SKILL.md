---
name: vercel-deploy
description: Deploy to Vercel with preflight checks and post-release verification. Use when user says /vercel-deploy or asks for production launch, environment setup, domain binding, rollout checks, and rollback guidance.
---

# Vercel Deploy

Deploy safely and verify quickly.

## Preflight Checklist

- Build succeeds locally
- Required env vars are defined
- Error/loading/fallback pages exist
- Basic metadata/SEO configured

## Deployment Workflow

1. Connect repository to Vercel
2. Set framework preset + build settings
3. Configure env vars (Preview + Production)
4. Deploy preview and smoke test
5. Promote to production

## Post-deploy (first 24h)

- Validate P0 user paths
- Check runtime logs/errors
- Verify LCP/TTFB baseline
- Verify domain + TLS
- Verify analytics/events

## Rollback Rule

If any P0 flow is broken, rollback immediately and open hotfix branch.

## Assistant Output Format

- Deployment status
- Preview URL
- Production URL
- Missing env vars
- Risks + next actions

## Example Trigger Prompt

`/vercel-deploy: 部署当前 Next.js 项目到生产，先做预检再给发布结果。`
