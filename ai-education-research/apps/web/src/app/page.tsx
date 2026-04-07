import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            AI 教育研究演示系统
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            AI Education <span className="text-blue-600">Research</span> MVP
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            探索 AI 在教育场景的应用：智能诊断学生作答、识别误区类型、自动反馈 + 教师复核闭环
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link 
              href="/login" 
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40"
            >
              开始体验
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="📝"
            title="智能诊断"
            description="AI 自动分析学生作答，识别概念理解偏差、公式误用、推理缺口等误区类型"
          />
          <FeatureCard
            icon="🔄"
            title="自动反馈"
            description="高置信度诊断直接生成反馈，辅助学生即时了解错误原因"
          />
          <FeatureCard
            icon="👨‍🏫"
            title="教师复核"
            description="低置信度样本进入复核队列，教师确认后形成闭环"
          />
        </div>

        <div className="mt-16 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">快速入口</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/teacher/dashboard" 
              className="rounded-xl border-2 border-slate-200 px-5 py-3 font-medium text-slate-700 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
            >
              👨‍🏫 教师工作台
            </Link>
            <Link 
              href="/student/home" 
              className="rounded-xl border-2 border-slate-200 px-5 py-3 font-medium text-slate-700 transition-all hover:border-green-500 hover:bg-green-50 hover:text-green-700"
            >
              🎓 学生作业
            </Link>
            <Link 
              href="/login" 
              className="rounded-xl border-2 border-slate-200 px-5 py-3 font-medium text-slate-700 transition-all hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700"
            >
              🔐 登录入口
            </Link>
          </div>
        </div>

        <p className="mt-16 text-center text-sm text-slate-400">
          Powered by OpenClaw · AI Education Research Project
        </p>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
