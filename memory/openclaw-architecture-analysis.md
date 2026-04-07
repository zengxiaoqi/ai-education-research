# OpenClaw 核心代码总体架构分析

> 仓库：https://github.com/zengxiaoqi/openclaw.git
> 版本：2026.4.4 | 语言：TypeScript (pnpm monorepo)
> 规模：src/ 5725 TS 文件，extensions/ 3344 TS 文件

---

## 一、总体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                        客户端层 (apps/)                          │
│          Android / iOS / macOS / Web UI / CLI                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼───────────────────────────────────────────┐
│                    Gateway 服务 (src/gateway/)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ 认证授权  │ │ 会话管理  │ │ 聊天处理  │ │ 插件加载/热更新   │   │
│  │ auth.ts  │ │ session  │ │server-chat│ │plugin-bootstrap  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  HTTP: /v1/chat/completions, /v1/models, /hook/*, /control-ui/*│
│  WS: JSON-RPC 风格, 30+ method (chat.*, sessions.*, config.*)   │
└──────────┬──────────┬──────────┬────────────────────────────────┘
           │          │          │
┌──────────▼──┐ ┌─────▼─────┐ ┌▼──────────────────────────────────┐
│ Agent 引擎  │ │ 渠道系统   │ │ 插件/扩展系统                      │
│ src/agents/ │ │src/channels│ │ src/plugins/ + extensions/         │
│             │ │            │ │                                    │
│ • Pi引擎    │ │ • 注册表   │ │ • 95+ 扩展                         │
│ • 工具系统  │ │ • 会话映射  │ │   - 50+ LLM providers              │
│ • 子agent   │ │ • 传输层   │ │   - 20+ channels                   │
│ • 提示词    │ │            │ │   - 能力扩展                        │
│ • 压缩      │ │            │ │ • 声明式注册                        │
└──────┬──────┘ └────────────┘ └────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                    基础设施层 (src/infra/ + src/config/)          │
│  配置(JSON5+热更新) | CLI(commander) | 安全(auth+secrets)        │
│  Cron(定时) | MCP(工具协议) | Sandbox(Docker/SSH) | 事件系统     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、Gateway 服务（src/gateway/）

### 启动流程
```
openclaw gateway start
  → entry.ts → cli/gateway-cli.ts → server.impl.ts#startGatewayServer()
    1. 配置加载 (readConfigFileSnapshot → Zod 校验)
    2. Secrets 激活 (失败则阻止启动)
    3. 插件预加载 (server-plugin-bootstrap.ts)
    4. 运行时状态创建 (HTTP + WS Server + 内存状态)
    5. Sidecar 启动 (channel/hook/heartbeat/cron/gmail)
    6. BOOT.md 执行 (如有)
    7. 就绪日志
```

### 双协议
- **HTTP**：`/v1/chat/completions`（OpenAI 兼容）、`/v1/models`、`/hook/*`（Webhook）、`/control-ui/*`（Web 控制台）
- **WebSocket**：JSON-RPC 风格，30+ 方法，共享 HTTP 端口

### 认证三层
| 层 | 文件 | 职责 |
|---|---|---|
| Gateway 认证 | auth.ts | 模式解析（none/token/password/tailscale） |
| 客户端凭证 | connection-auth.ts | 从 config/env/CLI 解析凭证 |
| 设备配对 | device-auth.ts | 移动端/node 设备签名认证 |

### 会话管理
- Session Key 格式：`agent:main:channel:target`
- 文件系统持久化，实时 transcript 推送
- 四条事件总线：AgentEvent / HeartbeatEvent / TranscriptUpdate / LifecycleEvent

---

## 三、Agent 引擎（src/agents/，1170 文件）

### 一次完整运行的调用链
```
用户消息 → gateway → runEmbeddedPiAgent() [pi-embedded-runner/run.ts]
  ├── 解析 workspace/agent 配置
  ├── resolveModelAsync() → 模型发现
  ├── resolveAuthProfileOrder() → API Key 轮换策略
  ├── resolveBootstrapContextForRun() → 加载 AGENTS.md/SOUL.md 等
  ├── buildSystemPrompt() → 分层组装提示词
  ├── createOpenClawCodingTools() → 注册工具集
  └── 循环: runEmbeddedAttempt()
        ├── 构建 payloads → 调用 LLM transport stream
        ├── subscribeEmbeddedPiSession() → 解析流式响应
        │     ├── handlers.messages → 文本/reasoning
        │     ├── handlers.tools → 工具调用提取与执行
        │     └── handlers.compaction → 上下文压缩
        ├── 工具执行 → 结果回传 → 继续
        └── 失败 → model fallback / profile 轮换
```

### 模型调用层
- `provider-transport-stream.ts` 统一入口，按 `model.api` 路由到 6 种 transport
- OpenAI/Anthropic/Google 各自封装认证头、流式解析、tool_call 映射
- `model-fallback.ts` 管理 fallback 链：profile 轮换 → 降级模型 → 重试

### 工具系统
- **基础**：来自 `@mariozechner/pi-coding-agent` 的 read/write/edit/bash
- **增强**：沙箱版文件操作、exec（含审批流/PTY/Docker）
- **OpenClaw 专属**：sessions_spawn / subagents / message / cron / web_search 等
- **策略管道**：多层过滤（agent profile → group → sandbox → subagent → provider）
- **MCP 集成**：stdio/SSE/streamable-http 三种传输层，动态加载外部工具

### 子 Agent 调度
- **内部**（runtime=subagent）：`subagent-spawn.ts` → 验证 depth → 创建子 session → `callGateway()`
- **ACP 外部**（runtime=acp）：`acp-spawn.ts` → 启动 Codex/Claude Code 等外部 agent
- Depth 控制：默认最大 3 层
- Push-based 完成通知：子 agent 主动 announce，父 agent 不轮询

### 提示词构建
分层组装：身份 → 项目上下文（AGENTS.md→SOUL.md→USER.md→TOOLS.md→MEMORY.md）→ 工具描述 → 渠道适配 → provider 贡献

### 会话压缩
`compaction.ts`：检测超限 → 分 chunk 调用 LLM 生成摘要 → 替换历史 → 保留最近 N 轮

---

## 四、消息渠道系统（src/channels/ + extensions/）

### 渠道抽象层
- **registry.ts**：注册所有已启用的渠道
- **session.ts**：将渠道会话映射到 agent session key
- **transport/**：统一的传输层抽象

### 消息流转
```
渠道消息入站 (webhook/polling/长连接)
  → channel monitor (去重 + debounce)
  → bot handlers (消息解析 + 认证 + 命令检测 + 路由解析 + 会话绑定)
  → auto-reply/dispatch.ts → 路由判断
    ├── 斜杠命令 → command-detection.ts → 命令处理 (如 /status, /reasoning)
    ├── 心跳 → heartbeat.ts → 周期性检查 (默认30min)
    └── 消息 → dispatchReplyFromConfig() → agent 系统
       → agent 回复 → outbound adapter → 渠道 API 出站
```

### 渠道抽象接口（ChannelPlugin）
每个渠道实现 `ChannelPlugin` 接口，声明能力面：
- `gateway` — 启动/停止长连接
- `outbound` — 发送消息
- `config` — 账户解析
- `setup` / `setupWizard` — 初始化向导
- `heartbeat` — 心跳适配
- `threading` / `messaging` — 线程与消息能力
- `agentTools` — 渠道特有 agent 工具

### 渠道特有处理
- **Discord**：thread binding（线程绑定），`thread-ownership` 机制
- **Telegram**：inline keyboard 按钮，auto-topic-label
- **飞书**：card 交互（审批卡片），merge_forward 消息展开，权限错误通知
- **WhatsApp**：Baileys Web 自动认证，QR 码登录

### 自动回复系统（src/auto-reply/）
- `dispatch.ts`：消息路由中枢
- `command-detection.ts`：斜杠命令识别
- `heartbeat.ts`：心跳机制（构造 HEARTBEAT_PROMPT，agent 回复 HEARTBEAT_OK 表示无待处理）
- `envelope.ts`：消息封装
- `chunk.ts`：长消息分块发送

### Gateway 渠道编排
`ChannelManager`（server-channels.ts）在 gateway 启动时遍历已注册渠道插件，对每个已配置账户调用 `plugin.gateway.startAccount()` 启动监听，支持自动重连（指数退避，最多10次）

---

## 五、插件/扩展系统（src/plugins/ + extensions/）

### 插件生命周期
```
发现（discovery.ts）→ 加载（loader.ts，jiti 动态加载 TS/JS）
  → 激活（registry.ts，register(api)）→ 运行（hooks 系统）
  → 卸载（install.ts）
```

### Provider 扩展标准模式
```
extensions/openai/
├── package.json          # openclaw.extensions: ["./index.ts"]
├── index.ts              # definePluginEntry({id, name, register(api){...}})
├── openai-provider.ts    # resolveConfig / prepareRuntimeAuth / stream
├── speech-provider.ts    # 可选
└── realtime-voice.ts     # 可选
```

### 能力分类
Provider（LLM）| Channel（通讯渠道）| Tool（工具）| Hook（20+ 生命周期钩子）| Service（后台服务）| CLI 命令

### 技能系统（skills/）
- 本质是 **Markdown 文件**（SKILL.md），不是代码
- 安装：执行 frontmatter 声明的安装步骤
- 集成：Agent 启动时将匹配的 SKILL.md 拼入 system prompt

---

## 六、基础设施层

### 配置系统
- JSON5 格式，支持 includes 合并、环境变量替换
- **热更新**：运行时快照 + RefreshHandler，部分配置可热重载（hooks/cron/channel），部分需冷重启
- Zod schema 校验 + 多层语义校验

### 沙箱机制
- 可插拔后端：Docker 本地容器 + SSH 远程
- 路径隔离：`..` 逃逸检测，沙箱内固定 `/workspace`
- 工具策略：allow/deny 白名单

### Cron 系统
- 三种调度：at（一次性）| every（间隔）| cron（表达式+时区）
- 执行目标：main / isolated / current

### 事件系统
- 全局单例 + 发布订阅
- 事件类型：lifecycle / tool / assistant / error / item（start/update/end 三阶段）

---

## 七、核心设计模式总结

| 模式 | 应用 |
|------|------|
| **Registry** | 插件、node、channel、session event 全部通过注册表管理 |
| **Event Bus** | 4 条内部事件总线解耦模块 |
| **Plugin Architecture** | 声明式注册 + 开放-封闭原则 |
| **Strategy** | Transport 按模型 API 路由，Sandbox 按后端切换 |
| **Lane 隔离** | 每个 session 独立命令队列，防并发冲突 |
| **Auth Profile 轮换** | API Key 失败自动冷却、切换 |
| **Push-based 通知** | 子 agent 完成后主动 announce |
| **分层 Prompt** | 按优先级注入多层上下文，缓存边界分隔 |

---

*分析完成时间：2026-04-06*
*分析方式：5 个子 agent 并行分析各模块，汇总整合*
