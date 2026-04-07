import { MisconceptionDistributionChart } from "./MisconceptionDistributionChart";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export default async function InsightsPage() {
  const user = await requireRole("teacher");
  if (!user) return <main className="p-8">无权限</main>;

  const [misconceptionRows, totalDiagnoses, reviewStats, recentDiagnoses] = await Promise.all([
    prisma.diagnosis.groupBy({
      by: ["misconceptionType"],
      where: { submission: { assignment: { teacherId: user.id } } },
      _count: { _all: true },
      orderBy: { _count: { misconceptionType: "desc" } },
    }),
    prisma.diagnosis.count({ where: { submission: { assignment: { teacherId: user.id } } } }),
    prisma.reviewTask.groupBy({
      by: ["status"],
      where: { diagnosis: { submission: { assignment: { teacherId: user.id } } } },
      _count: { _all: true },
    }),
    prisma.diagnosis.findMany({
      where: { submission: { assignment: { teacherId: user.id } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        submission: {
          include: {
            assignment: true,
          },
        },
      },
    }),
  ]);

  const needsReviewCount = recentDiagnoses.filter((item) => item.needsReview).length;
  const autoFeedbackCount = Math.max(totalDiagnoses - needsReviewCount, 0);
  const reviewStatusMap = Object.fromEntries(reviewStats.map((item) => [item.status, item._count._all]));
  const misconceptionChartData = misconceptionRows.map((row) => {
    const count = row._count._all;
    const percent = totalDiagnoses === 0 ? 0 : Math.round((count / totalDiagnoses) * 100);

    return {
      type: row.misconceptionType,
      label: formatMisconception(row.misconceptionType),
      count,
      percent,
    };
  });

  return (
    <main className="p-8 space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-blue-600">Teacher Insights</p>
        <h1 className="text-3xl font-semibold">班级洞察</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          这里聚焦“学生常见误区分布 + AI 自动反馈 / 教师复核分流结果”，方便在演示中说明系统如何帮助老师更快定位问题样本。
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <InsightCard label="诊断总数" value={totalDiagnoses} helper="累计生成的诊断" />
        <InsightCard label="自动反馈" value={autoFeedbackCount} helper="无需教师介入" tone="green" />
        <InsightCard label="进入复核" value={needsReviewCount} helper="需教师确认" tone="amber" />
        <InsightCard label="已确认复核" value={reviewStatusMap.confirmed || 0} helper="已完成教师处理" tone="blue" />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">误区类型分布</h2>
            <span className="text-sm text-gray-500">按出现次数排序</span>
          </div>
          {misconceptionRows.length === 0 ? (
            <EmptyBlock text="暂无数据，至少需要一次学生提交。" />
          ) : (
            <MisconceptionDistributionChart data={misconceptionChartData} />
          )}
        </div>

        <div className="rounded-2xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold">复核状态概览</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniBadge label="pending" value={reviewStatusMap.pending || 0} tone="amber" />
            <MiniBadge label="confirmed" value={reviewStatusMap.confirmed || 0} tone="green" />
            <MiniBadge label="revised" value={reviewStatusMap.revised || 0} tone="blue" />
            <MiniBadge label="rejected" value={reviewStatusMap.rejected || 0} tone="red" />
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            演示时可以用这里说明：AI 先做初筛，低置信度样本进入教师复核，教师处理结果会进一步沉淀为可追踪的教学数据。
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近诊断样本</h2>
          <span className="text-sm text-gray-500">便于现场讲解具体案例</span>
        </div>
        {recentDiagnoses.length === 0 ? (
          <EmptyBlock text="暂无诊断样本。" />
        ) : (
          recentDiagnoses.map((item) => (
            <div key={item.id} className="rounded-xl border bg-gray-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{item.submission.assignment.title}</div>
                  <div className="text-sm text-gray-500">{formatMisconception(item.misconceptionType)} · 置信度 {item.confidence}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.needsReview ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {item.needsReview ? "教师复核" : "自动反馈"}
                </span>
              </div>
              <div className="text-sm text-gray-700">证据：{item.evidence}</div>
              <div className="text-sm text-gray-500 line-clamp-2">学生作答：{item.submission.reasoning}</div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function formatMisconception(value: string) {
  const map: Record<string, string> = {
    concept_misunderstanding: "概念理解偏差",
    formula_misuse: "公式误用",
    reasoning_gap: "推理缺口",
  };

  return map[value] || value;
}

function InsightCard({ label, value, helper, tone = "default" }: { label: string; value: number; helper: string; tone?: "default" | "green" | "amber" | "blue" }) {
  const toneClass = {
    default: "border-gray-200 bg-white",
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
    blue: "border-blue-200 bg-blue-50",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{helper}</div>
    </div>
  );
}

function MiniBadge({ label, value, tone }: { label: string; value: number; tone: "green" | "amber" | "blue" | "red" }) {
  const toneClass = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="text-xs uppercase">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed p-4 text-sm text-gray-500">{text}</div>;
}
