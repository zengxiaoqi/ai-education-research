import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">无权限访问</h1>
        <p className="text-slate-600 mb-8 max-w-md">
          当前页面需要特定角色权限，请使用正确的账号登录后再试
        </p>
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all"
        >
          ← 重新登录
        </Link>
      </div>
    </main>
  );
}
