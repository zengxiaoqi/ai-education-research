# 任务模板

- **任务名**：AI Education Research Web MVP 持续推进
- **创建时间**：2026-03-21 11:45 Asia/Shanghai
- **优先级**：P0
- **当前状态**：In Progress
- **总负责人**：总台
- **参与角色**：product / ui / engineering / qa / deploy

## 目标

- 分析 `/home/zxq/.openclaw/workspace/ai-education-research` 当前实现状态
- 对照既有产品/开发文档找出缺口
- 继续推进 app 功能开发，优先补齐最关键的 P0 能力

## 成功标准

- 明确当前已完成能力与缺口
- 选定下一批最值得推进的功能
- 完成至少一轮可验证的功能开发或修复
- 输出阶段性结论、风险和下一步

## 范围

### 做
- 代码结构分析
- 现状体检（lint/build/关键文件）
- 功能缺口判断
- P0/P1 功能继续开发

### 不做
- 未经确认的大范围重构
- 与当前 MVP 目标无关的功能扩张

## 当前编排

- **先手角色**：product / engineering
- **并行角色**：qa
- **后置角色**：deploy
- **子智能体强制模板**：`runtime=subagent, mode=run, cleanup=keep, thread=false`，且**不传 `streamTo`**

## 子任务

- [x] product：梳理当前能力与文档差距（主智能体静态审查已完成第一轮）
- [x] ui：识别关键页面/状态缺口（主智能体静态审查已完成第一轮）
- [x] engineering：完成基线体检并确认关键路由/API 已存在且可构建
- [x] engineering：将 diagnosis/review 从随机行为改为可预测、可稳定演示的规则
- [x] qa：完成一轮主链路与双分支回归（主智能体执行）
- [x] qa：完成 review task 状态变更闭环验证（pending → confirmed）
- [x] product：产出 P0 优先级与 demo script 文档
- [x] engineering：补齐 student 侧历史记录与已复核结果回流
- [ ] deploy：待可发布后介入

## 风险 / 阻塞

- Next 16 已提示 `middleware` 约定废弃，后续需迁移到 `proxy`
- 项目当前 Git 状态较混杂，需要谨慎提交范围
- 当前主环境缺少 `pnpm`，项目验证需改走 `npm`
- 子 agent 调度必须锁定：`runtime=subagent, mode=run, cleanup=keep, thread=false`，并且不传 `streamTo`
- 当前仍缺 product / qa 子智能体的独立产出，因派工调用曾被错误模板污染，暂由主智能体代打

## 最近更新

- 已确认项目存在 docs + apps/web MVP 骨架，不是空仓
- 已发现 README 低估了当前实现，实际 web 侧已有更多路由/API
- 已重新体检 apps/web：
  - `npm run lint` ✅ 通过
  - `npm run build` ✅ 通过
- 已确认当前已存在的关键页面/路由：
  - `/`
  - `/login`
  - `/forbidden`
  - `/teacher/dashboard`
  - `/teacher/classes`
  - `/teacher/assignments/new`
  - `/teacher/review-queue`
  - `/teacher/insights`
  - `/student/home`
  - `/student/assignments/[assignmentId]`
  - `/student/results/[submissionId]`
- 已确认当前已存在的关键 API：
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/me`
  - `/api/classes`
  - `/api/assignments`
  - `/api/submissions`
  - `/api/submissions/me`（新增：学生历史提交列表）
  - `/api/submissions/[id]`（新增：学生提交详情）
  - `/api/submissions/[id]/diagnosis`
  - `/api/review-queue`
  - `/api/review-tasks/[id]`（新增：支持 GET 获取复核状态）
- 已确认 teacher/student 基础角色流已接入 cookie + middleware/proxy 保护
- 已完成真实回归：
  - teacher 登录 → 建班 → 建作业 ✅
  - student 登录 → 提交作答 ✅
  - diagnosis 查询 ✅
  - 匿名/越权访问 teacher 页面被拦截 ✅
- 已修复 diagnosis/review 的演示不稳定问题：
  - 去除随机置信度与随机误区类型
  - 改为基于关键词/长度/不确定表达的确定性规则
  - 已稳定打出两条分支：
    - `needsReview=true` → teacher review queue 出现条目 ✅
    - `needsReview=false` → student 直接收到自动反馈 ✅
- 已补强 student result 页面文案，明确区分"教师复核中"与"已自动完成反馈"
- 已完成 review task 操作闭环验证：
  - pending task 可被 teacher PATCH 为 `confirmed`
  - 更新后 review queue 清空 ✅
- 已新增文档：
  - `docs/demo-script.md`
  - `docs/p0-priorities.md`
  - `docs/demo-improvement.md`
- 已更新仓库 README，使其反映当前 Web MVP 实况
- 已补齐 student 侧历史记录与已复核结果回流：
  - `/api/submissions/me` 返回学生提交列表（含诊断状态和复核状态）
  - `/api/submissions/[id]` 返回学生提交详情
  - `/api/review-tasks/[id]` 支持 GET 获取复核状态（学生可查看）
  - `student/home` 页面升级为显示提交历史列表，区分状态徽章
  - `student/results/[submissionId]` 页面升级为显示完整诊断+复核结果（如果已复核）
  - 已验证 API 响应正常，返回正确的诊断与复核状态数据 ✅
- **Demo 优化 P0 修复已完成**：
  - P0-1: Student Assignment 页面增加作业详情（标题、Prompt、Rubric、Tags、截止时间）
  - P0-2: 创建 Demo Seed Data（`npm run db:seed`）
  - P0-3: Dashboard 增加按班级/作业筛选功能
- **Demo 优化 P1 修复已完成**：
  - P1-1: Insights 页面增加饼图可视化误区类型分布
  - P1-2: 新增 Teacher Assignment 详情页 `/teacher/assignments/[id]`
  - P1-3: 复核结果回传学生端，学生结果页可见复核状态

## 产品升级规划（新）

### 看板管理

| 任务 | 状态 | 负责人 |
|------|------|--------|
| 产品升级规划文档 | ✅ 已完成 | product 子智能体 |
| UI 美化改进 | ✅ 已完成 | ui 子智能体 |

### 产出物清单

- [x] `docs/product-upgrade.md` - 产品升级规划（PRD）
- [x] `docs/feature-backlog.md` - 功能待办列表
- [x] `docs/roadmap.md` - 路线图

### 产品升级方向（初步）

- **核心场景**：从"作业提交-AI诊断-教师复核"扩展为完整的 AI 辅助教学闭环
- **新增能力方向**：
  - 个性化学习路径
  - 自适应练习推荐
  - 详细的学习诊断报告
  - 教师效率工具（批量处理、智能建议）

---

## 下一步

1. 等待 product 子智能体产出产品升级规划
2. 根据规划拆解功能 backlog
3. UI 美化完成后验证效果
4. 确认新功能开发优先级

---

## 开发任务（Phase 1 MVP+）

### 当前待开发 P0 功能

| ID | 功能 | 状态 | 负责人 |
|----|------|------|--------|
| F01 | AI 批改引擎 v1 | ✅ 已完成+集成 | engineering 子智能体+主智能体 |
| F02 | 教师审核台优化 | 🔄 待开发 | 待分配 |
| F03 | 班级管理 | ✅ 已存在 | - |
| F04 | 学生作业提交 | ✅ 已存在 | - |
| F05 | 用户认证 | ✅ 已存在 | - |

### 开发计划

**Sprint 1（本周）**：
1. AI 批改引擎 v1 核心能力（评分 + 多维度评价）
2. 教师审核台优化（支持修改评语）

### 汇报机制

- 每日进度同步，有问题及时升级
- 完成后主动汇报结果
- 阻塞时说明原因和解决建议
