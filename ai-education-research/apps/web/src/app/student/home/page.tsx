"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  dueAt: string;
  submittedAt: string;
  diagnosis: {
    misconceptionType: string;
    confidence: number;
    needsReview: boolean;
  } | null;
  reviewStatus: string | null;
};

export default function StudentHomePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submissions/me")
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        <div className="text-gray-500">加载中...</div>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">学生首页</h1>
        <p className="text-sm text-gray-600">
          查看你的作业提交历史、诊断结果和教师复核状态。
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded border border-dashed p-8 text-center text-gray-500">
          暂无提交记录。
          <br />
          <Link href="/" className="text-blue-600 underline mt-2 inline-block">
            返回首页查看作业
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Link
              key={sub.id}
              href={`/student/results/${sub.id}`}
              className="block rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-lg">{sub.assignmentTitle}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    提交于 {new Date(sub.submittedAt).toLocaleString()}
                  </div>
                  {sub.diagnosis && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">
                        误区类型：{formatMisconception(sub.diagnosis.misconceptionType)}
                      </span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-600">
                        置信度：{sub.diagnosis.confidence}
                      </span>
                    </div>
                  )}
                </div>
                <StatusBadge
                  diagnosis={sub.diagnosis}
                  reviewStatus={sub.reviewStatus}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
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

function StatusBadge({
  diagnosis,
  reviewStatus,
}: {
  diagnosis: Submission["diagnosis"];
  reviewStatus: string | null;
}) {
  if (!diagnosis) {
    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        待诊断
      </span>
    );
  }

  if (reviewStatus) {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: "待复核", class: "bg-amber-100 text-amber-700" },
      confirmed: { label: "已确认", class: "bg-green-100 text-green-700" },
      revised: { label: "已修订", class: "bg-blue-100 text-blue-700" },
      rejected: { label: "已驳回", class: "bg-red-100 text-red-700" },
    };
    const status = statusMap[reviewStatus] || { label: reviewStatus, class: "bg-gray-100 text-gray-700" };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.class}`}>
        教师{status.label}
      </span>
    );
  }

  if (diagnosis.needsReview) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        教师复核中
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      已自动反馈
    </span>
  );
}
