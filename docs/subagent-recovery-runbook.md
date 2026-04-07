# Subagent Recovery Runbook（子智能体会话恢复手册）

## 0. 适用场景

- `openclaw sessions --all-agents --active 60` 只看到 `main`
- `product/ui/engineering/qa/deploy` 没有可续跑会话

---

## 1. 快速诊断

```bash
source ~/.nvm/nvm.sh
"$HOME/.nvm/versions/node/v24.14.0/bin/openclaw" sessions --all-agents --json
"$HOME/.nvm/versions/node/v24.14.0/bin/openclaw" sessions --all-agents --active 60 --json
```

判定：

- 全量也没有子 agent：说明未成功 spawn。
- 全量有、active 没有：说明不在活跃窗口（不是创建失败）。

---

## 2. 两个高频致命参数错误

1. `runtime=subagent` 下传了 `streamTo`
   - 错误：`streamTo is only supported for runtime=acp; got runtime=subagent`

2. `mode="session"` 但未满足 thread 绑定条件
   - 错误：`mode="session" requires thread=true ...`

---

## 3. 安全默认派发模板（推荐）

```json
{
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "keep",
  "sandbox": "inherit",
  "thread": false
}
```

规则：

- 不要传 `streamTo`
- 不要默认 `mode=session`

---

## 4. 可见性门禁配置（已验证）

确保 `openclaw.json` 含以下关键项：

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "sessionToolsVisibility": "all"
      }
    }
  },
  "tools": {
    "sessions": {
      "visibility": "all"
    },
    "agentToAgent": {
      "enabled": true,
      "allow": ["main", "product", "ui", "engineering", "qa", "deploy"]
    }
  }
}
```

---

## 5. 恢复步骤（按顺序）

0. 先在主会话执行 `/new`（或创建新的主会话）再继续。
   - 原因：旧会话里的历史 tool-call 形状会被模型复用，可能持续携带 `streamTo`。

1. 修正编排参数（禁止 `streamTo`，默认 `mode=run`）。
2. 让 main 下发一轮最小派工（product/ui/engineering/qa/deploy）。
3. 观察 `subagents(action=list)` 是否出现 run。
4. 执行：

```bash
"$HOME/.nvm/versions/node/v24.14.0/bin/openclaw" sessions --all-agents --active 60 --json
```

5. 若仍无子会话，回看 main transcript 是否出现上述两类错误。

6. 若第 5 步仍失败，再次 `/new` 并只做一次最小派工（仅 product 一个子任务）验证，不要并发五个角色。

### 5.1 直接验证“污染是否还在”

在 WSL 里执行：

```bash
grep -R --line-number --include='*.jsonl' '"name":"sessions_spawn"' ~/.openclaw/agents/main/sessions | tail -n 20
grep -R --line-number --include='*.jsonl' '"runtime":"subagent".*"streamTo"' ~/.openclaw/agents/main/sessions | tail -n 20
```

判定：

- 第 2 条命令有输出：说明本轮仍有污染（subagent+streamTo 同时出现）。
- 第 2 条命令无输出且 spawn 成功：说明污染已清除。

---

## 6. 成功标准

- `sessions --all-agents --json` 能看到非 main 的 session key。
- 任务看板中的 `Blocked` 原因从“调度未打通”移除。
- engineering 能被重新派工继续 lint/build 修复。
