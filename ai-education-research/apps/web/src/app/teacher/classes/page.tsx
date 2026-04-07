"use client";

import { useEffect, useState } from "react";

type Classroom = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  code: string;
};

export default function TeacherClassesPage() {
  const [items, setItems] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("数学");
  const [grade, setGrade] = useState("高一");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await fetch("/api/classes");
      if (!res.ok || cancelled) return;
      const data: Classroom[] = await res.json();
      if (!cancelled) setItems(data);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, grade }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      const next = await fetch("/api/classes");
      if (next.ok) {
        const data: Classroom[] = await next.json();
        setItems(data);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">班级管理</h1>
          <p className="text-slate-600 mt-1">创建和管理教学班级</p>
        </div>

        <form onSubmit={createClass} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">班级名称</label>
              <input 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="如：高一（1）班"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">学科</label>
              <input 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">年级</label>
              <input 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button 
                disabled={loading || !name.trim()}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "创建中..." : "创建班级"}
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">已有班级</h2>
          </div>
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-slate-500">暂无班级，请在上方创建一个</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((c) => (
                <div key={c.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mr-2">
                          {c.subject}
                        </span>
                        {c.grade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500">班级码</div>
                      <div className="font-mono font-semibold text-slate-700">{c.code}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
