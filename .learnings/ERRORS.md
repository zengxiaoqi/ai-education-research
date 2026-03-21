## [ERR-20260319-001] git-push-proxy-env

**Logged**: 2026-03-19T00:33:00+08:00
**Priority**: high
**Status**: pending
**Area**: config

### Summary
`git push` failed with `Unsupported proxy syntax` because proxy env vars in `~/.bashrc` contained escaped quotes.

### Details
User-side shell had:
- `export http_proxy=\"http://${hostip}:${proxyport}\";`
- `export https_proxy=\"http://${hostip}:${proxyport}\";`
This produced malformed values like `172.24.80.1:10808"` and broke Git's proxy parser.

### Suggested Action
Use unquoted/normal assignment in shell rc files:
- `export http_proxy="http://${hostip}:${proxyport}"`
- `export https_proxy="http://${hostip}:${proxyport}"`
- `export all_proxy="socks5://${hostip}:${proxyport}"`
Then `source ~/.bashrc` and verify with `env | grep -i proxy`.

### Metadata
- Source: error
- Related Files: /home/zxq/.bashrc
- Tags: git, github, proxy, wsl, bashrc

---

## [ERR-20260319-001] prisma7-config-change

**Logged**: 2026-03-19T11:00:00+08:00
**Priority**: high
**Status**: pending
**Area**: backend

### Summary
Prisma 7 no longer accepts datasource url in schema.prisma; requires prisma.config.ts/direct adapter config.

### Error
```
Error: Prisma schema validation - (get-config wasm)
The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts`
```

### Context
- Command attempted: `npx prisma generate`
- Project: ai-education-research/apps/web
- Initial scaffold used legacy Prisma schema pattern with `url = env("DATABASE_URL")`

### Suggested Fix
Add `prisma.config.ts` for Prisma 7 or pin Prisma to a version using schema datasource URL semantics.

### Metadata
- Reproducible: yes
- Related Files: ai-education-research/apps/web/prisma/schema.prisma

---

## [ERR-20260321-001] git-add-untracked-deletion

**Logged**: 2026-03-21T11:39:00+08:00
**Priority**: medium
**Status**: pending
**Area**: config

### Summary
Tried to `git add` a deleted file that had never been tracked, causing a pathspec failure.

### Error
```
fatal: pathspec '/home/zxq/.openclaw/workspace/BOOTSTRAP.md' did not match any files
```

### Context
- Operation attempted: remove BOOTSTRAP.md and commit the deletion
- Command used: `rm .../BOOTSTRAP.md && git add .../BOOTSTRAP.md && git commit ...`
- Root cause: file was untracked before deletion, so `git add <deleted-untracked-file>` cannot stage it

### Suggested Fix
Check whether the file is tracked before staging deletion; if untracked, only report the local removal or commit another tracked marker/state update.

### Metadata
- Reproducible: yes
- Related Files: BOOTSTRAP.md

---
