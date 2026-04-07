# Errors

## [ERR-20260321-001] bash_printf_dash_header

**Logged**: 2026-03-21T15:25:00+08:00
**Priority**: low
**Status**: pending
**Area**: infra

### Summary
Shell command failed because `printf '--- FILES ---\n'` was parsed as an option-like argument.

### Error
```text
/bin/bash: line 1: printf: --: invalid option
printf: usage: printf [-v var] format [arguments]
```

### Context
- Command/operation attempted: exec health check command in ai-education-research/apps/web
- Trigger: format string started with `---`
- Safer pattern: `printf '%s\n' '--- FILES ---'`

### Suggested Fix
Use `%s\n` format strings when printing literals that begin with `-`.

### Metadata
- Reproducible: yes
- Related Files: n/a

---

## [ERR-20260321-002] subagent_streamto_runtime_mismatch

**Logged**: 2026-03-21T16:32:00+08:00
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
Subagent dispatch failed repeatedly because `sessions_spawn` was called with `runtime=subagent` while still carrying `streamTo`, which is only valid for `runtime=acp`.

### Error
```text
streamTo is only supported for runtime=acp; got runtime=subagent
```

### Context
- Command/operation attempted: spawn product/ui/engineering/qa workers for ai-education-research MVP orchestration
- Required safe template: `runtime=subagent, mode=run, cleanup=keep, thread=false`
- Additional hard rule: omit `streamTo` entirely; do not mix ACP-only fields into subagent payloads
- Failure mode: orchestration retries wasted turns before switching back to direct execution

### Suggested Fix
For every `runtime=subagent` spawn, omit `streamTo` entirely. Prefer a reusable minimal parameter template and avoid mixed ACP/subagent payloads.

### Metadata
- Reproducible: yes
- Related Files: /home/zxq/.openclaw/workspace/ORCHESTRATION.md, /home/zxq/.openclaw/workspace/tasks/2026-03-21-ai-education-research-mvp.md

---
