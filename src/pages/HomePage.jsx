import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 py-8 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
        旅遊團務管理平台
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        遊點易思，透過 AI 降低旅遊意外風險
      </h1>

      <p className="text-base leading-relaxed text-slate-600">
        結合電子圍籬定位、即時 GPS 點名與 24 小時 AI 隨行助理，在團員脫隊、迷路或臨時狀況發生的第一時間主動示警、即時回應，讓領隊少一分擔心，旅客多一分安心。
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
  )
}

export default HomePage
