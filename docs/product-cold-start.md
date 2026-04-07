# Product 子会话冷启动指令模板

> 本文件是给主智能体的冷启动指令。使用前：先执行 `/new` 开启新主会话，再将以下内容粘贴到新会话。

---

## 执行步骤

请严格按照以下步骤执行，不要自行简化或跳过任何一步。

### 第 1 步：确认派发参数

`sessions_spawn` 工具调用**必须**严格遵守以下参数组合：

```
sessions_spawn(
  task = "<任务内容>",
  agentId = "product",
  runtime = "subagent",
  mode = "run",
  cleanup = "keep",
  sandbox = "inherit",
  thread = false,
  runTimeoutSeconds = 900
)
```

**禁止出现的字段**：`streamTo`（本参数仅 `runtime=acp` 支持）。

### 第 2 步：派发产品经理子任务

发送以下任务内容（复制粘贴，不要改参数名）：

```
请以产品经理身份，简述"AI 教育研究 MVP"项目的以下内容：
1. 核心功能范围（边界）
2. 验收标准（3 条）
3. 当前已知风险（至少 1 条）

完成后回复简洁汇报，不要贴代码。
```

调用示例（参数直接照填，不要改动）：

```
sessions_spawn(
  task = "请以产品经理身份，简述"AI 教育研究 MVP"项目的以下内容：\n1. 核心功能范围（边界）\n2. 验收标准（3 条）\n3. 当前已知风险（至少 1 条）\n\n完成后回复简洁汇报，不要贴代码。",
  agentId = "product",
  runtime = "subagent",
  mode = "run",
  cleanup = "keep",
  sandbox = "inherit",
  thread = false,
  runTimeoutSeconds = 900
)
```

### 第 3 步：检查结果

- 若返回 `status: "ok"` 和 `childSessionKey`：说明子会话已成功拉起。
- 若返回 `status: "error"` 和 `"streamTo is only supported for runtime=acp"`：说明误传了 `streamTo`，立即用相同参数重试一次，**删除 `streamTo` 字段**。
- 若返回其他错误：记录错误信息并升级给用户。

---

## 成功后验证

子会话成功拉起后，在 WSL 里执行以下命令确认：

```bash
source ~/.nvm/nvm.sh
"$HOME/.nvm/versions/node/v24.14.0/bin/openclaw" sessions --all-agents --active 60 --json
```

预期：sessions 列表中应出现非 `main` 的 session key（如 `agent:product:subagent:...`）。

---

## 成功标准

- [ ] 子会话成功创建（`status: ok`）
- [ ] `sessions --all-agents` 能看到 product 子会话
- [ ] product 子会话在 60 分钟内保持活跃（`updatedAt` 刷新）
