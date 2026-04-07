"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AssignmentDetail = {
  id: string;
  title: string;
  prompt: string;
  rubric: string;
  tags: string[];
  dueAt: string;
};

export default function StudentAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const router = useRouter();
  const [assignmentId, setAssignmentId] = useState("");
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [assignmentError, setAssignmentError] = useState(false);
  const [answer, setAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");

  useEffect(() => {
    params.then(({ assignmentId }) => {
      setAssignmentId(assignmentId);
      const key = `draft:${assignmentId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw);
        setAnswer(d.answer || "");
        setReasoning(d.reasoning || "");
      }
    });
  }, [params]);

  useEffect(() => {
    if (!assignmentId) return;

    let cancelled = false;

    fetch(`/api/assignments/${assignmentId}`)
      .then(async (res) => {
        if (!res.ok || cancelled) {
          setAssignmentError(true);
          return;
        }
        const data: AssignmentDetail = await res.json();
        if (cancelled) return;
        setAssignment(data);
      })
      .catch(() => {
        if (cancelled) return;
        setAssignmentError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) return;
    localStorage.setItem(`draft:${assignmentId}`, JSON.stringify({ answer, reasoning }));
  }, [assignmentId, answer, reasoning]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, answer, reasoning }),
    });
    if (!res.ok) return;
    const data = await res.json();
    localStorage.removeItem(`draft:${assignmentId}`);
    router.push(`/student/results/${data.submissionId}`);
  };

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <section className="rounded-xl border bg-white p-5 space-y-4">
        {!assignment && !assignmentError && <div className="text-sm text-gray-500">加载作业详情中...</div>}

        {assignmentError && <div className="text-sm text-red-600">作业详情加载失败，请刷新重试。</div>}

        {assignment && (
          <>
            <h1 className="text-2xl font-semibold">{assignment.title}</h1>

            <div>
              <div className="text-sm text-gray-500">题目要求 / Prompt</div>
              <div className="mt-1 whitespace-pre-wrap text-gray-800">{assignment.prompt}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">评分标准 / Rubric</div>
              <div className="mt-1 whitespace-pre-wrap text-gray-800">{assignment.rubric}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">相关标签</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {assignment.tags.length > 0 ? (
                  assignment.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">暂无标签</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">截止时间</div>
              <div className="mt-1 text-gray-800">{new Date(assignment.dueAt).toLocaleString()}</div>
            </div>
          </>
        )}
      </section>

      <form onSubmit={submit} className="space-y-4 rounded border p-4">
        <div className="text-lg font-medium">学生作答</div>
        <input className="w-full rounded border p-2" placeholder="你的答案" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <textarea className="min-h-40 w-full rounded border p-2" placeholder="请写出完整解题过程" value={reasoning} onChange={(e) => setReasoning(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white">提交作答</button>
      </form>
    </main>
  );
}
