# Demo 优化需求文档

> 分析日期：2026-03-26  
> 角色：Product  
> 目标：识别 teacher dashboard / insights 页面与 demo 脚本预期之间的缺口

---

## 1. 当前状态概览

### 1.1 Dashboard (`/teacher/dashboard`)

| 组件/数据 | 状态 | 备注 |
|----------|------|------|
| 班级数 | ✅ 已实现 | 直接查询 |
| 作业数 | ✅ 已实现 | 直接查询 |
| 提交数 | ✅ 已实现 | 直接查询 |
| 待复核数 | ✅ 已实现 | 高亮显示 |
| 本轮演示摘要卡片 | ✅ 已实现 | 自动反馈/待复核/复核占比 |
| 最近作业列表 | ✅ 已实现 | 展示标题、班级、截止时间、提交数 |
| 最近复核活动 | ✅ 已实现 | 展示任务状态、误区类型、置信度、学生作答摘要 |
| 演示讲解顺序 | ✅ 已实现 | 引导文案 |

**现状**：功能完整，数据展示清晰，有基础引导文案

### 1.2 Insights (`/teacher/insights`)

| 组件/数据 | 状态 | 备注 |
|----------|------|------|
| 诊断总数 | ✅ 已实现 | |
| 自动反馈数 | ✅ 已实现 | |
| 进入复核数 | ✅ 已实现 | |
| 已确认复核数 | ✅ 已实现 | |
| 误区类型分布 | ✅ 已实现 | 带百分比进度条 |
| 复核状态概览 | ✅ 已实现 | pending/confirmed/revised/rejected |
| 最近诊断样本 | ✅ 已实现 | 含学生作答、证据、置信度 |

**现状**：功能完整，但缺少可视化图表，仅有进度条

### 1.3 Student Assignment Page

| 组件/数据 | 状态 | 备注 |
|----------|------|------|
| 作业标题 | ❌ 缺失 | 仅显示"学生作答" |
| 作业描述/Prompt | ❌ 缺失 | 学生看不到题目要求 |
| Rubric/评分标准 | ❌ 缺失 | 学生不了解评分依据 |
| Tags/标签 | ❌ 缺失 | |
| 截止时间 | ❌ 缺失 | |

**现状**：学生只能看到空表单，无法理解题目要求，Demo 演示时无法说明"学生是依据什么作答"

---

## 2. 缺口列表（带优先级）

### P0 — 必须修复（Demo 核心体验）

| # | 缺口项 | 影响 | 建议方案 |
|---|--------|------|----------|
| P0-1 | **Student Assignment 页面缺少作业详情** | 学生不知题目要求，Demo 无法展示评分标准 | 在页面顶部展示：标题、Prompt、Rubric、Tags、截止时间 |
| P0-2 | **Demo 缺乏 Seed Data** | 全新环境无数据可演示，Dashboard/Insights 空荡荡 | 添加 seed script，生成：3个班级、5个作业、20+ 份提交（混合 auto/review） |
| P0-3 | **Dashboard 无班级/作业筛选** | 无法聚焦特定班级讲解 | 添加简单的筛选下拉框（按班级、按时间） |

### P1 — 建议优化（Demo 演示流畅度）

| # | 缺口项 | 影响 | 建议方案 |
|---|--------|------|----------|
| P1-1 | **Insights 缺少图表可视化** | 误区分布只能看进度条，不够直观 | 引入简单饼图或柱状图（可用 Recharts） |
| P1-2 | **Assignment Detail Page（Teacher 侧）缺失** | 教师无法查看特定作业的详情和提交列表 | 新建 `/teacher/assignments/[id]` 页面 |
| P1-3 | **Reviewed Result 回流到学生端** | 学生看不到自己被复核的结果 | 在学生 results 页面显示复核状态 |
| P1-4 | **引导文案增强** | 部分页面缺少"这是什么的"解释 | 在关键卡片增加 tooltip 或小问号提示 |

---

## 3. 建议的 Mock 数据结构

### 3.1 Demo Seed Data（Prisma）

```typescript
// 建议的 seed 数据结构

const seedData = {
  // 3个班级
  classrooms: [
    { name: "高一（演示班）", subject: "数学", grade: "高一" },
    { name: "高二（演示班）", subject: "物理", grade: "高二" },
    { name: "初三（演示班）", subject: "化学", grade: "初三" },
  ],
  
  // 5个作业（分布在不同班级）
  assignments: [
    { title: "二次函数诊断", classroomIndex: 0, dueAt: "2026-03-30" },
    { title: "一元二次方程", classroomIndex: 0, dueAt: "2026-03-28" },
    { title: "力学基础", classroomIndex: 1, dueAt: "2026-03-29" },
    { title: "化学反应类型", classroomIndex: 2, dueAt: "2026-03-31" },
    { title: "酸碱盐综合", classroomIndex: 2, dueAt: "2026-04-02" },
  ],
  
  // 20+ 份提交，混合 auto-feedback 和 review-path
  submissions: [
    // Auto-feedback (高置信度)
    { answer: "顶点坐标为(1,-2)", reasoning: "已知二次函数解析式后，我先利用配方法整理出顶点式...", needsReview: false },
    { answer: "x=3", reasoning: "将方程两边同时除以2，得到x=3，代入检验...", needsReview: false },
    // Review-path (低置信度)
    { answer: "答案可能是3", reasoning: "我直接套公式，不太确定", needsReview: true },
    { answer: "应该是对吧", reasoning: "不太确定是不是这样", needsReview: true },
    // ... 更多混合数据
  ],
  
  // 5个已处理的复核任务
  reviewTasks: [
    { status: "confirmed" },
    { status: "revised" },
    { status: "rejected" },
    // ...
  ]
}
```

### 3.2 前端 Mock 接口（如需要）

```typescript
// 建议的 Dashboard API Response 结构
interface DashboardData {
  overview: {
    classes: number;
    assignments: number;
    submissions: number;
    pendingReviews: number;
    autoFeedbackCount: number;
    reviewRate: number;
  };
  recentAssignments: Array<{
    id: string;
    title: string;
    classroom: string;
    dueAt: string;
    submissionCount: number;
  }>;
  recentReviews: Array<{
    id: string;
    assignmentTitle: string;
    misconceptionType: string;
    confidence: number;
    status: "pending" | "confirmed" | "revised" | "rejected";
    studentReasoning: string;
  }>;
}

// 建议的 Insights API Response 结构
interface InsightsData {
  overview: {
    totalDiagnoses: number;
    autoFeedback: number;
    needsReview: number;
    confirmedReviews: number;
  };
  misconceptionDistribution: Array<{
    type: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  reviewStatusBreakdown: {
    pending: number;
    confirmed: number;
    revised: number;
    rejected: number;
  };
  recentDiagnoses: Array<{
    id: string;
    assignmentTitle: string;
    misconceptionType: string;
    confidence: number;
    needsReview: boolean;
    evidence: string;
    studentReasoning: string;
  }>;
}
```

---

## 4. 建议的引导文案方向

### 4.1 Student Assignment Page（新增）

页面顶部增加标题区域：

```markdown
## 二次函数诊断

**题目要求**：请解答并说明推理过程

**评分标准**：步骤完整、依据清晰

**相关标签**：公式误用、推理缺口

**截止时间**：2026-03-30 23:59
```

底部增加小提示：

> 💡 提示：系统会根据你的答案和推理过程自动生成反馈。如果答案不够清晰，老师可能会进行复核。

### 4.2 Dashboard 卡片增强

每个指标卡片增加 tooltip：

- **班级数** → ℹ️ 您创建的所有教学空间
- **作业数** → ℹ️ 已发布且未过期的作业
- **提交数** → ℹ️ 学生累计提交的答案总数
- **待复核** → ℹ️ AI 判定为低置信度、需您确认的提交

### 4.3 Insights 页面增强

- 误区类型分布标题下增加说明：
  > 这里统计了所有学生提交的误区类型分布，帮助您定位需要重点讲解的概念。

- 复核状态卡片增加说明：
  > pending = 待处理 | confirmed = 已确认 AI 判断 | revised = 您修订了 AI 判断 | rejected = 驳回（需重新诊断）

### 4.4 Assignment Detail（待新增）

建议新增 `/teacher/assignments/[id]` 页面，包含：

```markdown
## {作业标题}

| 班级 | {班级名} |
|------|----------|
| 截止 | {日期} |
| 已提交 | {n} 份 |
| 待复核 | {n} 份 |

**Prompt**: {作业要求}

**Rubric**: {评分标准}

**Tags**: {标签列表}

---

### 最近提交
[列表...]（含学生答案、诊断结果、状态）
```

---

## 5. 执行优先级建议

### 阶段 1：Demo 就绪（P0）

1. **补充 Student Assignment 页面作业详情**（P0-1）
2. **创建 Seed Script**（P0-2）

### 阶段 2：Demo 流畅（P1）

3. Dashboard 增加筛选（P0-3）
4. 新增 Teacher Assignment 详情页（P1-2）
5. 增加 Charts（P1-1）
6. 引导文案优化（P1-4）

### 阶段 3：Demo 增强（P2）

7. 复核结果回流传（P1-3）
8. 更多 Demo 场景

---

## 6. 相关文件索引

| 文件 | 路径 |
|------|------|
| P0 Priorities | `docs/p0-priorities.md` |
| Demo Script | `docs/demo-script.md` |
| Dashboard | `apps/web/src/app/teacher/dashboard/page.tsx` |
| Insights | `apps/web/src/app/teacher/insights/page.tsx` |
| Student Assignment | `apps/web/src/app/student/assignments/[assignmentId]/page.tsx` |
| API: Submissions | `apps/web/src/app/api/submissions/route.ts` |

---

*本文档由 Product 角色产于 2026-03-26，用于指导 Demo 优化工作。*