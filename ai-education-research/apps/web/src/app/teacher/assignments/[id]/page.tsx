"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AssignmentDetail = {
  id: string;
  title: string;
  prompt: string;
  rubric: string;
  dueAt: string;
  tags: string[];
  classroom: {
    id: string;
    name: string;
    subject: string;
    grade: string;
  };
  stats: {
    totalSubmissions: number;
    pendingReviews: number;
    reviewedSubmissions: number;
  };
  recentSubmissions: Array<{
    id: string;
    submittedAt: string;
    student: {
      id: string;
      name: string;
    };
    answer: string;
    reasoning: string;
    diagnosis: {
      misconceptionType: string;
      confidence: number;
      needsReview: boolean;
    } | null;
    status: string;
  }>;
};

export default function TeacherAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [assignmentId, setAssignmentId] = useState("");
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => setAssignmentId(id));
  }, [params]);

  useEffect(() => {
    if (!assignmentId) return;

    let cancelled = false;

    fetch(`/api/assignments/${assignmentId}`)
      .then(async (res) => {
        if (cancelled) return;

        if (res.status === 404) {
          setError("未找到该作业，或你无权查看。");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("作业详情加载失败，请稍后重试。");
          setLoading(false);
          return;
        }

        const data: AssignmentDetail = await res.json();
        if (cancelled) return;

        setDetail(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("网络异常，无法加载作业详情。");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Teacher Assignment Detail</p>
            <h1 className="text-2xl font-bold text-slate-900">作业详情</h1>
          </div>
          <Link href="/teacher/dashboard" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            返回 Dashboard
          </Link>
        </div>

        {loading && <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">加载中...</div>}

        {!loading && error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {!loading && !error && detail && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900">{detail.title}</h2>
                <div className="text-sm text-slate-600">
                  {detail.classroom.name}（{detail.classroom.grade} · {detail.classroom.subject}）
                </div>
                <div className="text-sm text-slate-600">截止时间：{new Date(detail.dueAt).toLocaleString()}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">Prompt</div>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{detail.prompt}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">Rubric</div>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{detail.rubric}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">Tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.tags.length > 0 ? (
                    detail.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">暂无标签</span>
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard title="总提交" value={detail.stats.totalSubmissions} />
              <StatCard title="待复核" value={detail.stats.pendingReviews} accent="amber" />
              <StatCard title="已复核" value={detail.stats.reviewedSubmissions} accent="green" />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">最近提交</h3>

              {detail.recentSubmissions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">暂无提交记录</div>
              ) : (
                <div className="space-y-3">
                  {detail.recentSubmissions.map((submission) => (
                    <div key={submission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-slate-800">{submission.student.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{new Date(submission.submittedAt).toLocaleString()}</span>
                          <StatusBadge status={submission.status} />
                        </div>
                      </div>

                      <div className="text-sm text-slate-700">
                        诊断结果：
                        {submission.diagnosis ? (
                          <span>
                            {submission.diagnosis.misconceptionType} · 置信度 {submission.diagnosis.confidence}
                          </span>
                        ) : (
                          <span>暂无</span>
                        )}
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="rounded-lg bg-white p-3 text-sm text-slate-700">
                          <b>答案：</b>
                          {submission.answer}
                        </div>
                        <div className="rounded-lg bg-white p-3 text-sm text-slate-700">
                          <b>过程：</b>
                          <span className="line-clamp-3">{submission.reasoning}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value, accent = "default" }: { title: string; value: number; accent?: "default" | "amber" | "green" }) {
  const toneClass =
    accent === "amber"
      ? "border-amber-200 bg-amber-50"
      : accent === "green"
        ? "border-green-200 bg-green-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const textMap: Record<string, string> = {
    pending: "待复核",
    confirmed: "已确认",
    revised: "已修订",
    rejected: "已驳回",
    auto_feedback: "自动反馈",
  };

  const toneMap: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    revised: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    auto_feedback: "bg-slate-200 text-slate-700",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneMap[status] || "bg-slate-200 text-slate-700"}`}>
      {textMap[status] || status}
    </span>
  );
}
