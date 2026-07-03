import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-cyan-100 blur-2xl" />
        <div className="absolute -bottom-10 left-16 h-40 w-40 rounded-full bg-emerald-100 blur-2xl" />
        <div className="relative space-y-4">
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            Travel Operation MVP
          </p>
          <h1 className="max-w-xl text-3xl font-black tracking-tight text-slate-900 lg:text-5xl">
            一站式管理旅遊團
            <span className="text-cyan-700">公告、旅客與行程資訊</span>
          </h1>
          <p className="max-w-2xl text-slate-600">
            專為旅行社後台打造，快速建立團體、產生 QR Code，讓旅客即時加入並查看最新公告。
          </p>
          <div className="flex flex-wrap gap-3 pt-3">
            <Link
              to="/admin/groups"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              進入團體列表
            </Link>
            <Link
              to="/admin/groups/new"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              立即新增團體
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">核心流程</h2>
        <ol className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="rounded-xl bg-slate-50 p-4">
            1. 建立團體並填寫行程與導遊資訊
          </li>
          <li className="rounded-xl bg-slate-50 p-4">
            2. 產生加入連結與 QR Code 給旅客掃描
          </li>
          <li className="rounded-xl bg-slate-50 p-4">
            3. 後台發布公告，旅客頁即時查閱
          </li>
        </ol>
      </section>
    </div>
  )
}

export default HomePage
