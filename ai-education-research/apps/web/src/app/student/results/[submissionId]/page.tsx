"use client";

import { useEffect, useState } from "react";

type Diagnosis = {
  misconceptionType: string;
  evidence: string;
  suggestion: string;
  confidence: number;
  needsReview: boolean;
};

type ReviewTaskStatus = "pending" | "confirmed" | "revised" | "rejected";

type ReviewTask = {
  status: ReviewTaskStatus | string;
  note: string | null;
  updatedAt: string;
};

type ResultData = {
  submission: {
    id: string;
    assignmentTitle: string;
    answer: string;
    reasoning: string;
    submittedAt: string;
  };
  diagnosis: Diagnosis | null;
  reviewTask: ReviewTask | null;
};

export default function ResultPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ submissionId }) => {
      try {
        const subRes = await fetch(`/api/submissions/${submissionId}`);
        if (!subRes.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        const subData = await subRes.json();

        const diagRes = await fetch(`/api/submissions/${submissionId}/diagnosis`);
        const diagnosis: Diagnosis | null = diagRes.ok ? await diagRes.json() : null;

        // 无论 needsReview 字段如何，都尝试读取 reviewTask（404 视为不存在）
        let reviewTask: ReviewTask | null = null;
        if (diagnosis) {
          const reviewRes = await fetch(`/api/review-tasks/${submissionId}`);
          if (reviewRes.ok) {
            reviewTask = await reviewRes.json();
          }
        }

        setData({
          submission: subData,
          diagnosis,
          reviewTask,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  if (loading) return <main className="p-8">加载中...</main>;
  if (error || !data) return <main className="p-8">结果加载失败</main>;

  const { submission, diagnosis, reviewTask } = data;

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">反馈结果</h1>
        <p className="text-sm text-gray-600">
          作业：{submission.assignmentTitle}
        </p>
      </div>

      {/* 总体状态徽章 */}
      <div className="flex items-center gap-3">
        {reviewTask ? (
          <StatusBadge status={reviewTask.status} />
        ) : diagnosis?.needsReview ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            教师复核中
          </span>
        ) : (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            已自动完成反馈
          </span>
        )}
      </div>

      {/* AI 诊断结果（与复核结果区分展示） */}
      {diagnosis ? (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <div className="text-sm font-medium text-gray-700">AI 初始诊断</div>

          <div>
            <div className="text-sm text-gray-500">误区类型</div>
            <div className="text-lg font-medium">{formatMisconception(diagnosis.misconceptionType)}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">证据</div>
            <div className="text-gray-700">{diagnosis.evidence}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">建议</div>
            <div className="text-gray-700">{diagnosis.suggestion}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">置信度</div>
            <div className="font-medium">{diagnosis.confidence}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-gray-50 p-5 text-sm text-gray-500">
          暂无诊断结果。
        </div>
      )}

      {/* 教师复核结果（若存在 reviewTask） */}
      {reviewTask && (
        <div className="rounded-xl border bg-blue-50 p-5 space-y-3">
          <div className="text-sm font-medium text-blue-800">教师复核状态</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态：</span>
            <StatusBadge status={reviewTask.status} />
          </div>

          {(reviewTask.status === "confirmed" || reviewTask.status === "revised") && (
            <div>
              <div className="text-sm text-gray-500">复核结论</div>
              <div className="text-gray-700">{getReviewConclusion(reviewTask)}</div>
            </div>
          )}

          {reviewTask.note && (
            <div>
              <div className="text-sm text-gray-500">教师备注</div>
              <div className="text-gray-700">{reviewTask.note}</div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            复核时间：{new Date(reviewTask.updatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* 学生作答 */}
      <div className="rounded-xl border bg-gray-50 p-5 space-y-3">
        <div className="text-sm font-medium text-gray-700">你的作答</div>
        <div>
          <div className="text-sm text-gray-500">答案</div>
          <div className="text-gray-700">{submission.answer}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">推理过程</div>
          <div className="text-gray-700 whitespace-pre-wrap">{submission.reasoning}</div>
        </div>
      </div>
    </main>
  );
}

function formatMisconception(type: string) {
  const map: Record<string, string> = {
    concept_misunderstanding: "概念理解偏差",
    formula_misuse: "公式误用",
    reasoning_gap: "推理缺口",
  };
  return map[type] || type;
}

function getReviewConclusion(reviewTask: ReviewTask) {
  if (reviewTask.note?.trim()) return reviewTask.note;

  if (reviewTask.status === "confirmed") {
    return "教师确认 AI 初始诊断结果有效。";
  }
  if (reviewTask.status === "revised") {
    return "教师已修订 AI 初始诊断，建议以教师复核意见为准。";
  }
  return "-";
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; class: string }> = {
    pending: { label: "待复核", class: "bg-amber-100 text-amber-700" },
    confirmed: { label: "已确认", class: "bg-green-100 text-green-700" },
    revised: { label: "已修订", class: "bg-blue-100 text-blue-700" },
    rejected: { label: "已驳回", class: "bg-red-100 text-red-700" },
  };

  const s = statusMap[status] || { label: status, class: "bg-gray-100 text-gray-700" };

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${s.class}`}>
      {s.label}
    </span>
  );
}
