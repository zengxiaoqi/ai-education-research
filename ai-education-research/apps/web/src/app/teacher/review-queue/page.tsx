"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  status: string;
  note: string | null;
  diagnosis: { confidence: number; misconceptionType: string; evidence: string; submission: { answer: string; reasoning: string } };
};

export default function ReviewQueuePage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await fetch("/api/review-queue");
      if (!res.ok || cancelled) return;
      const data: Item[] = await res.json();
      if (!cancelled) setItems(data);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const act = async (id: string, status: "confirmed" | "revised" | "rejected") => {
    await fetch(`/api/review-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const res = await fetch("/api/review-queue");
    if (res.ok) {
      const data: Item[] = await res.json();
      setItems(data);
    }
  };

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">复核队列</h1>
      {items.length === 0 ? <div className="rounded border border-dashed p-4 text-sm text-gray-500">暂无待复核项。</div> : items.map((item) => (
        <div key={item.id} className="space-y-3 rounded border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.diagnosis.misconceptionType}</div>
              <div className="text-sm text-gray-500">置信度 {item.diagnosis.confidence}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => act(item.id, "confirmed")} className="rounded border px-3 py-1">确认</button>
              <button onClick={() => act(item.id, "revised")} className="rounded border px-3 py-1">修订</button>
              <button onClick={() => act(item.id, "rejected")} className="rounded border px-3 py-1">驳回</button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded bg-gray-50 p-3 text-sm"><b>答案：</b>{item.diagnosis.submission.answer}</div>
            <div className="rounded bg-gray-50 p-3 text-sm"><b>过程：</b>{item.diagnosis.submission.reasoning}</div>
          </div>
          <div className="text-sm text-gray-600">证据：{item.diagnosis.evidence}</div>
        </div>
      ))}
    </main>
  );
}
