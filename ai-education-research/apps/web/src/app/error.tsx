"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-semibold">页面发生错误</h2>
      <p className="text-sm text-gray-600">{error.message}</p>
      <button className="rounded bg-black px-3 py-2 text-white" onClick={() => reset()}>
        重试
      </button>
    </div>
  );
}
