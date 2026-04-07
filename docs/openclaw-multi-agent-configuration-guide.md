# OpenClaw 多智能体调度配置指导手册（可复用 / 可验证）

> 适用环境：WSL + OpenClaw（配置文件：`~/.openclaw/openclaw.json`）
>
> 本手册基于 OpenClaw 源码机制与已落地配置编写，目标是让 **main 主智能体** 自动拆解任务并调度子智能体：`product`、`ui`、`engineering`、`qa`、`deploy`，并支持监督、异常检测、重调度。

---

## 1. 架构概览

```
用户 ──▶ main (总台) ──▶ sessions_spawn ──▶ 子智能体 (product/ui/engineering/qa/deploy)
                │                              │
                │ sessions_history              sessions (独立会话)
                │ subagents(list/steer/kill)
                ▼
            聚合结果
```

### 核心文件

| 文件 | 作用 |
|------|------|
| `~/.openclaw/openclaw.json` | 主配置：agent 列表、并发限制、可见性门禁 |
| `src/agents/tools/sessions-spawn-tool.ts` | `sessions_spawn` 工具实现 |
| `src/agents/subagent-spawn.ts` | 校验 allowAgents / depth / children / timeout |
| `src/agents/subagent-registry.ts` | 子任务生命周期：注册 / 归档 / 恢复 |
| `src/agents/tools/subagents-tool.ts` | `subagents(action=list\|steer\|kill)` |
| `src/agents/tools/agents-list-tool.ts` | 可派发目标清单（查 allowAgents） |

---

## 2. 标准配置模板

将以下结构合并到 `~/.openclaw/openclaw.json` 的 `agents` 节点：

```json
{
  "agents": {
    "defaults": {
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8,
        "maxSpawnDepth": 1,
        "maxChildrenPerAgent": 8,
        "archiveAfterMinutes": 180,
        "runTimeoutSeconds": 1800,
        "thinking": "medium",
        "announceTimeoutMs": 120000
      },
      "sandbox": {
        "sessionToolsVisibility": "all"
      }
    },
    "list": [
      {
        "id": "main",
        "subagents": {
          "allowAgents": ["product", "ui", "engineering", "qa", "deploy"]
        }
      },
      {
        "id": "product",
        "name": "product",
        "workspace": "/home/zxq/.openclaw/workspace-product",
        "agentDir": "/home/zxq/.openclaw/agents/product/agent",
        "subagents": { "allowAgents": [] }
      },
      {
        "id": "ui",
        "name": "ui",
        "workspace": "/home/zxq/.openclaw/workspace-ui",
        "agentDir": "/home/zxq/.openclaw/agents/ui/agent",
        "subagents": { "allowAgents": [] }
      },
      {
        "id": "engineering",
        "name": "engineering",
        "workspace": "/home/zxq/.openclaw/workspace-engineering",
        "agentDir": "/home/zxq/.openclaw/agents/engineering/agent",
        "subagents": { "allowAgents": [] }
      },
      {
        "id": "qa",
        "name": "qa",
        "workspace": "/home/zxq/.openclaw/workspace-qa",
        "agentDir": "/home/zxq/.openclaw/agents/qa/agent",
        "subagents": { "allowAgents": [] }
      },
      {
        "id": "deploy",
        "name": "deploy",
        "workspace": "/home/zxq/.openclaw/workspace-deploy",
        "agentDir": "/home/zxq/.openclaw/agents/deploy/agent",
        "subagents": { "allowAgents": [] }
      }
    ]
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

### 参数详解

#### `agents.defaults.subagents.*`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxConcurrent` | number | 8 | 全局子任务最大并发数 |
| `maxSpawnDepth` | number | 1 | 允许的派发层级深度；设为 1 表示 main 可派子任务，但子任务不能再派生 |
| `maxChildrenPerAgent` | number | 8 | 单个 agent 最多持有多少个子任务 |
| `archiveAfterMinutes` | number | 180 | 子任务完成后保留 3 小时，便于复盘 |
| `runTimeoutSeconds` | number | 1800 | 单个子任务最大运行时长（秒）；超时后自动终止 |
| `thinking` | string | "medium" | 子任务推理深度：`off` / `low` / `medium` / `high` |
| `announceTimeoutMs` | number | 120000 | 子任务启动通知超时（毫秒） |

#### `agents.defaults.sandbox.sessionToolsVisibility`

| 值 | 说明 |
|----|------|
| `"all"` | 主 / 子会话均可使用 `sessions_*` 工具（**推荐配置**） |
| `"own"` | 仅自身会话可用（更严格） |

#### `agents.list[].subagents.allowAgents`

- **main**：`["product","ui","engineering","qa","deploy"]`（允许派发到这 5 个角色）
- **子角色**：设为 `[]`（禁止横向派发，防止任务风暴）

#### `tools.agentToAgent.*`

| 参数 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 是否允许 agent 间互相调用（**必须为 true**） |
| `allow` | string[] | 允许互相调用的 agent id 白名单 |

---

## 3. sessions_spawn 参数手册（⭐ 核心）

> ⚠️ **最容易出错的地方**：错误地组合 `streamTo` 与 `runtime`，导致所有 spawn 调用全部失败。详见本章。

### 3.1 参数分类

#### 必填参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `task` | string | 派发给子智能体的任务描述 |
| `agentId` | string | 目标 agent id（如 `"product"`） |

#### 运行时参数

| 参数 | 类型 | 可选值 | 说明 |
|------|------|--------|------|
| `runtime` | string | `"subagent"` / `"acp"` | **子任务运行模式**，决定可用参数集合 |
| `mode` | string | `"run"` / `"session"` | `run`：任务完成后结束；`session`：创建常驻会话 |
| `cleanup` | string | `"keep"` / `"archive"` / `"delete"` | 任务结束后会话如何清理 |
| `thread` | boolean | `true` / `false` | 是否绑定到通道 thread（仅部分通道支持） |
| `sandbox` | string | `"inherit"` / `"on"` / `"off"` | 沙箱模式 |

#### 可选参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `runTimeoutSeconds` | number | 子任务超时（秒） |
| `timeoutSeconds` | number | 别名，与 `runTimeoutSeconds` 相同 |
| `model` | string | 指定模型（如 `"default"` 或 `"qwen"`） |
| `thinking` | string | 推理深度：`"off"` / `"low"` / `"medium"` / `"high"` |
| `attachAs` | object | 挂载路径，如 `{mountPath:"/workspace"}` |
| `cwd` | string | 子任务工作目录 |

#### ⚠️ 仅 `runtime=acp` 可用的参数（子任务模式禁止传！）

| 参数 | 说明 | 误用报错 |
|------|------|----------|
| `streamTo` | 流式输出目标（如 `"parent"`） | `streamTo is only supported for runtime=acp; got runtime=subagent` |

---

### 3.2 推荐参数组合（冷启动首选）

```json
{
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "keep",
  "sandbox": "inherit",
  "thread": false
}
```

**说明**：
- `mode=run`：任务执行完毕即结束，不需要 thread 绑定，最稳定
- `cleanup=keep`：保留会话记录，便于后续用 `sessions_history` 回溯
- `thread=false`：不需要通道支持，适合 QQBot / 非即时消息通道

---

### 3.3 常见错误与解决方案

#### 错误 1：`streamTo is only supported for runtime=acp`

**触发条件**：`runtime=subagent` 时误传了 `streamTo`

**原始错误**：
```
status: "error",
error: "streamTo is only supported for runtime=acp; got runtime=subagent"
```

**原因**：
1. 模型从历史调用中学习了错误模式，自动添加了 `streamTo`
2. 用户手动构造调用时混淆了 `subagent` 和 `acp` 参数集

**解决步骤**：
1. 立即用**相同参数重试一次**，删除 `streamTo` 字段
2. 不要改 `runtime`，保持 `runtime=subagent`
3. 参考 3.2 的推荐组合

**防呆规则**（写入 AGENTS.md）：
```
当 runtime=subagent 时：永远不传 streamTo
当 runtime=acp 时：可以传 streamTo
```

---

#### 错误 2：`mode="session" requires thread=true`

**触发条件**：`mode=session` 但 `thread=false`，且当前通道不支持 thread 绑定

**原始错误**：
```
status: "error",
error: "mode="session" requires thread=true so the subagent can stay bound to a thread"
```

**解决步骤**：
1. 如果当前通道不支持 thread，将 `mode` 改为 `"run"`
2. 如果确实需要常驻会话，改用 `runtime=acp`（且需要 `thread=true`）

---

#### 错误 3：`Thread bindings are unavailable for feishu`

**触发条件**：飞书等不支持 thread 的通道使用了 `thread=true`

**解决**：保持 `thread=false`，将 `mode` 改为 `"run"`

---

## 4. 冷启动流程（⭐ 必读）

> 本流程经过实际验证（2026-03-21），成功拉起了第一个 product 子会话。
>
> **核心问题**：旧会话上下文会复用错误的 tool-call 形状，导致 `streamTo` 污染。解决方案：每次规则调整后强制 `/new`。

### 4.1 冷启动标准流程

#### 第 0 步：开启新主会话

```
/new
```

**必须原因**：旧会话的历史 tool-call 形状会被模型复用，可能持续携带 `streamTo`，导致所有 spawn 调用失败。

---

#### 第 1 步：确认派发参数

`sessions_spawn` **必须**严格遵守以下组合（禁止自行增删字段）：

```
runtime = "subagent"
mode = "run"
cleanup = "keep"
sandbox = "inherit"
thread = false
```

**禁止出现的字段**：`streamTo`

---

#### 第 2 步：执行第一次派工（仅 product 一个角色）

在主会话输入以下命令：

```
/call sessions_spawn task="请以产品经理身份，简述'AI 教育研究 MVP'项目的以下内容：\n1. 核心功能范围（边界）\n2. 验收标准（3 条）\n3. 当前已知风险（至少 1 条）\n\n完成后回复简洁汇报，不要贴代码。" agentId="product" runtime="subagent" mode="run" cleanup="keep" sandbox="inherit" thread=false runTimeoutSeconds=900
```

---

#### 第 3 步：检查结果

**成功标志**（`status: ok`）：
```json
{
  "key": "agent:product:subagent:940b93f6-ce96-48ba-979d-ef0fa4109785",
  "updatedAt": 1774106772418,
  "agentId": "product",
  "kind": "direct"
}
```

**失败标志**（`status: error`）：
- 含 `"streamTo is only supported"` → 删除 `streamTo` 重新执行第 2 步
- 含 `"Thread bindings are unavailable"` → 保持 `thread=false`，改 `mode="run"`

---

#### 第 4 步：验证会话可见

```bash
source ~/.nvm/nvm.sh
"$HOME/.nvm/versions/node/v24.14.0/bin/openclaw" sessions --all-agents --active 60 --json
```

预期：sessions 列表中出现 `agent:product:subagent:...` 的 session key。

---

#### 第 5 步：扩展到其他角色

product 验证成功后，按同样方式依次派发 ui / engineering / qa / deploy：

```
/call sessions_spawn task="你的任务内容" agentId="ui" runtime="subagent" mode="run" cleanup="keep" sandbox="inherit" thread=false runTimeoutSeconds=900
```

```
/call sessions_spawn task="你的任务内容" agentId="engineering" runtime="subagent" mode="run" cleanup="keep" sandbox="inherit" thread=false runTimeoutSeconds=900
```

```
/call sessions_spawn task="你的任务内容" agentId="qa" runtime="subagent" mode="run" cleanup="keep" sandbox="inherit" thread=false runTimeoutSeconds=900
```

```
/call sessions_spawn task="你的任务内容" agentId="deploy" runtime="subagent" mode="run" cleanup="keep" sandbox="inherit" thread=false runTimeoutSeconds=900
```

---

## 5. 会话状态查询命令

### 查看所有 agent 的活跃会话

```bash
source ~/.nvm/nvm.sh
"$HOME/.nvm/versions/node/v24.14.0/bin/openclaw" sessions --all-agents --active 60 --json
```

- 配合 `grep` 过滤特定 agent：`--json | python3 -c "import sys,json; [print(s['agentId'], s['key']) for s in json.load(sys.stdin)['sessions']]"`
- 查看全部（不限时间）：去掉 `--active 60`

### 查看特定 agent 的会话

```bash
openclaw sessions --agent product
openclaw sessions --agent engineering
```

### 读取子会话历史

```
/call sessions_history sessionKey="agent:product:subagent:940b93f6-ce96-48ba-979d-ef0fa4109785" limit=50
```

### 向子会话发消息

```
/call sessions_send sessionKey="agent:product:subagent:940b93f6-ce96-48ba-979d-ef0fa4109785" message="请补充说明验收标准第 2 条的具体衡量方式。"
```

---

## 6. 主智能体编排规范

### 6.1 主智能体职责文件

| 文件 | 作用 |
|------|------|
| `workspace/AGENTS.md` | 总台角色定义、派发协议、执行循环 |
| `workspace/ORCHESTRATION.md` | 任务拆解、派工、监督、重调度策略 |
| `workspace/SUPERVISION.md` | 异常升级条件 |
| `workspace/TEAM.md` | 角色分工 |

### 6.2 子角色职责文件

| 文件 | 作用 |
|------|------|
| `workspace-product/ROLE.md` | product 输出规范：PRD、范围、验收标准 |
| `workspace-ui/ROLE.md` | ui 输出规范：IA、交互、组件约束 |
| `workspace-engineering/ROLE.md` | engineering 输出规范：实现、自测、风险 |
| `workspace-qa/ROLE.md` | qa 输出规范：测试矩阵、缺陷、发布建议 |
| `workspace-deploy/ROLE.md` | deploy 输出规范：检查清单、部署、回滚 |

### 6.3 编排规则要点

1. **拆解**：先将任务分解为角色可独立完成的子任务包
2. **派发**：使用 `/call sessions_spawn` 按 3.2 推荐参数派发
3. **监督**：用 `subagents(action="list")` 轮询运行状态
4. **验收**：用 `sessions_history` 拉取结果并检查完整性
5. **异常处理**（三级）：
   - 第 1 次异常：`subagents(action="steer")` 纠偏
   - 第 2 次异常：`kill` + 缩小范围重新 spawn
   - 第 3 次异常：升级给用户

---

## 7. 排障手册

### 症状 1：`sessions --all-agents` 只看到 main

**排查顺序**：

1. **先看全量**（不限时间）：
   ```bash
   openclaw sessions --all-agents --json
   ```
2. **再看历史调用**（检查是否参数错误导致从未创建）：
   ```bash
   grep -R --line-number '"runtime":"subagent".*"streamTo"' ~/.openclaw/agents/main/sessions
   ```
   - 有输出 → 说明 spawn 失败（见错误 1）
   - 无输出但仍无子会话 → 可能是其他配置问题
3. **确认编排规则是否加载**：检查 `sessions.json` 里的 `skillsSnapshot` 是否包含 AGENTS.md / ORCHESTRATION.md

---

### 症状 2：spawn 报错 `streamTo is only supported`

**根因**：历史调用将 `streamTo` 混入了 `runtime=subagent` 的调用里

**解决**：
1. 先 `/new` 开新主会话
2. 用 3.3 错误 1 的解决步骤重试
3. 参考 4.1 冷启动流程

---

### 症状 3：子任务不回传或卡住

**排查**：
- `runTimeoutSeconds` 是否过小（建议 ≥ 900）
- `maxChildrenPerAgent` 是否已满
- `maxSpawnDepth` 是否限制链路（建议保持 1）

**处理**：
- 加大 `runTimeoutSeconds`
- 用 `subagents(action="kill")` 终止卡住的任务
- 重新 spawn

---

### 症状 4：任务风暴（无限派发）

**收敛策略**：
1. 将子角色 `allowAgents` 置空 `[]`
2. 降低 `maxChildrenPerAgent`
3. 保持 `maxSpawnDepth=1`

---

## 8. 回滚方案

### 配置回滚

```bash
cp ~/.openclaw/openclaw.json.bak ~/.openclaw/openclaw.json
```

### Gateway 重启

```bash
pkill -9 -f openclaw-gateway || true
nohup openclaw gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
```

---

## 9. 验证清单

每次配置调整后，按以下清单逐项验证：

```
[ ] 1. JSON 语法正确：python -c "import json; json.load(open('/home/zxq/.openclaw/openclaw.json'))"
[ ] 2. 工具门禁开启：tools.sessions.visibility=all 且 tools.agentToAgent.enabled=true
[ ] 3. main 可派发：agents.list[main].subagents.allowAgents 包含全部 5 个角色
[ ] 4. 子角色安全：每个子角色 subagents.allowAgents=[]（禁止横向派发）
[ ] 5. 冷启动成功：product 子会话在 sessions --all-agents 中可见
[ ] 6. 任务下发：用 sessions_send 向子会话发消息，有响应
[ ] 7. 异常恢复：用 subagents(action=steer) 能纠正子任务方向
```

---

## 10. 版本化复用

建议将以下文件纳入版本管理（如私有仓库），确保新环境一键复现：

1. `openclaw.json` 的 `agents` 配置片段
2. `workspace/AGENTS.md`、`workspace/ORCHESTRATION.md`
3. 五个子 workspace 的 `ROLE.md`
4. 本手册

---

## 11. 本机已落地状态（2026-03-21 验证通过）

| 项目 | 状态 |
|------|------|
| `openclaw.json` agents 配置 | ✅ 已配置 main->5子角色 |
| `tools.sessions.visibility=all` | ✅ 已开启 |
| `tools.agentToAgent.enabled=true` | ✅ 已开启 |
| `agents.defaults.sandbox.sessionToolsVisibility=all` | ✅ 已开启 |
| product 冷启动验证 | ✅ 成功拉起（session key 已确认） |
| 本手册 | ✅ 已更新至最新排障经验 |
