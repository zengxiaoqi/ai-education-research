import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type DashboardSearchParams = {
  classId?: string;
  assignmentId?: string;
};

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<DashboardSearchParams>;
}) {
  const user = await requireRole("teacher");
  if (!user) return <main className="p-8">无权限</main>;

  const params = (await searchParams) ?? {};
  const selectedClassId = typeof params.classId === "string" && params.classId.trim() ? params.classId : undefined;
  const selectedAssignmentId =
    typeof params.assignmentId === "string" && params.assignmentId.trim() ? params.assignmentId : undefined;

  const assignmentFilter = {
    teacherId: user.id,
    ...(selectedClassId ? { classroomId: selectedClassId } : {}),
    ...(selectedAssignmentId ? { id: selectedAssignmentId } : {}),
  };

  const [classOptions, assignmentOptions, classes, assignments, submissions, pendingReviews, recentAssignments, recentReviews] =
    await Promise.all([
      prisma.classroom.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      }),
      prisma.assignment.findMany({
        where: {
          teacherId: user.id,
          ...(selectedClassId ? { classroomId: selectedClassId } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, classroom: { select: { name: true } } },
      }),
      prisma.classroom.count({ where: { teacherId: user.id } }),
      prisma.assignment.count({ where: assignmentFilter }),
      prisma.submission.count({ where: { assignment: assignmentFilter } }),
      prisma.reviewTask.count({
        where: { status: "pending", diagnosis: { submission: { assignment: assignmentFilter } } },
      }),
      prisma.assignment.findMany({
        where: assignmentFilter,
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          classroom: true,
          _count: { select: { submissions: true } },
        },
      }),
      prisma.reviewTask.findMany({
        where: { diagnosis: { submission: { assignment: assignmentFilter } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          diagnosis: {
            include: {
              submission: {
                include: {
                  assignment: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const autoFeedbackCount = Math.max(submissions - pendingReviews, 0);
  const reviewRate = submissions === 0 ? 0 : Math.round((pendingReviews / submissions) * 100);

  return (
    <main className="p-8 space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-semibold text-blue-600">Teacher Workspace</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">教师 Dashboard</h1>
          <p className="max-w-3xl text-sm text-gray-600 leading-relaxed">
            这里展示班级、作业、提交与教师复核的当前状态，适合在演示时快速讲清楚&quot;AI 自动反馈 + 教师兜底复核&quot;的工作流。
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
        <div className="text-sm font-medium text-gray-500">数据筛选</div>
        <form className="grid gap-3 md:grid-cols-[1fr,1fr,auto,auto] md:items-end" method="get">
          <label className="space-y-1.5 text-sm">
            <span className="text-gray-600 font-medium">按班级筛选</span>
            <select name="classId" defaultValue={selectedClassId ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">全部班级</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-gray-600 font-medium">按作业筛选</span>
            <select
              name="assignmentId"
              defaultValue={selectedAssignmentId ?? ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={assignmentOptions.length === 0}
            >
              <option value="">全部作业</option>
              {assignmentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}（{item.classroom.name}）
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            应用筛选
          </button>
          <Link href="/teacher/dashboard" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-50 transition-colors">
            重置
          </Link>
        </form>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card title="班级数" value={classes} helper="已创建教学空间" />
        <Card title="作业数" value={assignments} helper="筛选范围内作业" />
        <Card title="提交数" value={submissions} helper="筛选范围内提交" />
        <Card title="待复核" value={pendingReviews} helper="筛选范围内教师待处理项" accent={pendingReviews > 0 ? "amber" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-800">本轮演示摘要</h2>
            <p className="text-sm text-gray-600">
              当前共有 {submissions} 份学生提交，其中约 {autoFeedbackCount} 份可直接自动反馈，{pendingReviews} 份进入教师复核。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <MiniStat label="自动反馈" value={autoFeedbackCount} tone="green" />
            <MiniStat label="待教师复核" value={pendingReviews} tone="amber" />
            <MiniStat label="复核占比" value={`${reviewRate}%`} tone="blue" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/classes" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-300">班级管理</Link>
            <Link href="/teacher/assignments/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">创建作业</Link>
            <Link href="/teacher/review-queue" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-300">复核队列</Link>
            <Link href="/teacher/insights" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-300">洞察</Link>
          </div>
        </section>

        <section className="rounded-xl border bg-slate-50 shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">演示讲解顺序</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
            <li>先看概览卡片，说明班级 / 作业 / 提交 / 复核的规模。</li>
            <li>进入作业与学生提交流程，展示 AI 自动反馈。</li>
            <li>再切回复核队列，展示教师介入处理低置信度样本。</li>
            <li>最后进入洞察页，总结主要误区类型与复核分流情况。</li>
          </ol>
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">最近作业</h2>
            <Link href="/teacher/assignments/new" className="text-sm font-medium text-blue-600 hover:text-blue-700">继续创建 →</Link>
          </div>
          {recentAssignments.length === 0 ? (
            <EmptyBlock text="当前筛选下暂无作业。" />
          ) : (
            recentAssignments.map((assignment) => (
              <Link key={assignment.id} href={`/teacher/assignments/${assignment.id}`} className="block rounded-lg border border-gray-100 bg-slate-50 p-4 space-y-1 hover:bg-gray-100 hover:border-gray-200 transition-all">
                <div className="font-medium text-slate-800">{assignment.title}</div>
                <div className="text-sm text-gray-500">{assignment.classroom.name} · 截止 {new Date(assignment.dueAt).toLocaleString()}</div>
                <div className="text-sm text-gray-400">已收集提交 {assignment._count.submissions} 份</div>
              </Link>
            ))
          )}
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">最近复核活动</h2>
            <Link href="/teacher/review-queue" className="text-sm font-medium text-blue-600 hover:text-blue-700">查看队列 →</Link>
          </div>
          {recentReviews.length === 0 ? (
            <EmptyBlock text="当前筛选下暂无复核活动。" />
          ) : (
            recentReviews.map((task) => (
              <div key={task.id} className="rounded-lg border border-gray-100 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-800">{task.diagnosis.submission.assignment.title}</div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="text-sm text-gray-500">误区：{task.diagnosis.misconceptionType} · 置信度 {task.diagnosis.confidence}</div>
                <div className="text-sm text-gray-400 line-clamp-2">学生作答：{task.diagnosis.submission.reasoning}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value, helper, accent = "default" }: { title: string; value: number; helper: string; accent?: "default" | "amber" }) {
  const accentClass = accent === "amber" ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white shadow-sm";

  return (
    <div className={`rounded-xl border p-5 ${accentClass}`}>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
      <div className="mt-2 text-xs text-gray-500">{helper}</div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: "green" | "amber" | "blue" }) {
  const toneClass = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="text-xs">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    revised: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed p-4 text-sm text-gray-500">{text}</div>;
}
