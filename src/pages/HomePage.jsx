import { Link } from 'react-router-dom'
import logoAnimation from '../assets/logo-animation.mp4'
import logoImage from '../assets/logo.png'

function HomePage() {
  return (
    <div className="relative -mx-4 flex min-h-[calc(100vh-8rem)] items-center overflow-hidden sm:-mx-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-cyan-100/60 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            旅遊團務管理平台
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
            遊點易思，透過 AI
            <br />
            降低旅遊意外風險
          </h1>

          <p className="max-w-md text-base leading-relaxed text-slate-600">
            結合電子圍籬定位、即時 GPS 點名與 24 小時 AI 隨行助理，在團員脫隊、迷路或臨時狀況發生的第一時間主動示警、即時回應，讓領隊少一分擔心，旅客多一分安心。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/admin/groups"
              className="rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 transition hover:bg-cyan-700"
            >
              進入團體中控台
            </Link>
            <Link
              to="/admin/groups/new"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              新增旅遊團
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm md:max-w-none">
          <video
            className="w-full drop-shadow-xl"
            src={logoAnimation}
            poster={logoImage}
            autoPlay
            muted
            loop
            playsInline
          >
            <img src={logoImage} alt="遊點易思" className="w-full" />
          </video>
        </div>
      </div>
    </div>
  )
}

export default HomePage
