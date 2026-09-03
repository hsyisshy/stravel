import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            Google Gemini AI 旅遊團務平台
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            讓每一趟團體旅行更聰明、更安全
          </h1>

          <p className="text-base leading-relaxed text-slate-600">
            遊點易思結合 Google Gemini 生成式 AI、Google Maps 電子圍籬與即時團務協作，協助領隊處理重複問答與突發調程，並為旅客提供隨身 AI 導遊與回憶錄。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/admin/groups"
              className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              進入團體中控台
            </Link>
            <Link
              to="/admin/groups/new"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              新增旅遊團
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
