"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type classroom = { id: string; name: string; subject: string; grade: string; code: string };

const defaultDueAt = new Date(Date.now() + 86400000).toISOString().slice(0, 16);

export default function NewAssignmentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    classroomId: "",
    title: "函数误区诊断练习",
    prompt: "请完成这道题，并写出完整解题过程。",
    rubric: "标准",
    misconceptionTags: "概念误解,公式误用",
    dueAt: defaultDueAt,
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/classes").then(async (res) => {
      if (!res.ok || cancelled) return;
      const data: classroom[] = await res.json();
      if (cancelled) return;
      setClasses(data);
      if (data[0]) {
        setForm((prev) => ({
          ...prev,
          classroomId: prev.classroomId || data[0].id,
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        misconceptionTags: form.misconceptionTags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setLoading(false);
    if (res.ok) router.push("/teacher/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">创建作业</h1>
          <p className="text-slate-600 mt-1">发布一个新的诊断练习任务</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择班级</label>
            <select 
              value={form.classroomId} 
              onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">选择班级</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.subject}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">作业标题</label>
            <input 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">题目描述</label>
            <textarea 
              value={form.prompt} 
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">评分标准</label>
              <input 
                value={form.rubric} 
                onChange={(e) => setForm({ ...form, rubric: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">截止时间</label>
              <input 
                value={form.dueAt} 
                type="datetime-local"
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">误区标签（逗号分隔）</label>
            <input 
              value={form.misconceptionTags} 
              onChange={(e) => setForm({ ...form, misconceptionTags: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="概念误解,公式误用,推理缺口"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button 
              type="submit"
              disabled={loading || !form.classroomId}
              className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "发布中..." : "发布作业"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
