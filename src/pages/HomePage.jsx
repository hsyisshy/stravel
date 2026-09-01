import { Link } from 'react-router-dom'

function HomePage() {
  const aiFeatures = [
    {
      icon: '📸',
      title: '多模態拍照識景導覽',
      desc: '旅客隨手拍下景點、文物、菜單，Gemini 多模態視覺即時講述歷史故事與拍照秘訣，並支援語音朗讀。',
      tag: 'Gemini Vision & TTS',
      color: 'from-cyan-500/10 to-teal-500/10 border-cyan-200',
    },
    {
      icon: '💬',
      title: '24/7 隨行領隊小幫手',
      desc: '精準串接本團行程、公告與導遊電話，團員隨時問「幾點集合、去哪吃飯」，AI 立即親切解答。',
      tag: 'Grounded Context RAG',
      color: 'from-indigo-500/10 to-purple-500/10 border-indigo-200',
    },
    {
      icon: '⚡',
      title: 'AI 智慧排程與動態應變',
      desc: '領隊輸入關鍵字秒出行程；遇天候或塞車一鍵啟動「動態調程」，智能替換備案並自動草擬緊急公告。',
      tag: 'Structured AI Planning',
      color: 'from-amber-500/10 to-rose-500/10 border-amber-200',
    },
    {
      icon: '📖',
      title: '多模態 AI 旅遊回憶錄',
      desc: '匯整全團照片與足跡，旅程結束一鍵自動譜寫專屬圖文日誌與 IG 精選文案，打造超高回味價值。',
      tag: 'Multimodal Storytelling',
      color: 'from-purple-500/10 to-pink-500/10 border-purple-200',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
        <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute -bottom-10 right-1/3 h-52 w-52 rounded-full bg-indigo-100/60 blur-3xl" />
        
        <div className="relative space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-3.5 py-1 text-xs font-bold text-cyan-800 backdrop-blur-xs">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
            <span>Google Gemini AI 生態系智慧旅遊賦能平台</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl leading-tight">
            讓每一趟團體旅行
            <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              更聰明、更安全、更有溫度
            </span>
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            Stravel 結合 <strong>Google Gemini 多模態生成式 AI</strong>、<strong>Google Maps 智慧電子圍籬</strong> 與 <strong>即時團務協作</strong>，為領隊解決重複問答與突發調程痛點，為旅客打造專屬隨身 AI 導遊與回憶錄。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to="/admin/groups"
              className="rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-700"
            >
              進入團體中控台
            </Link>
            <Link
              to="/admin/groups/new"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-400 hover:text-slate-900"
            >
              立即新增旅遊團
            </Link>
          </div>
        </div>
      </section>

      {/* Gemini AI Core Features Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Google Gemini AI 核心智慧亮點</h2>
            <p className="text-xs text-slate-500">
              深度對標多模態互動、真實場域痛點與全流程智慧化服務
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiFeatures.map((f, i) => (
            <div
              key={i}
              className={`flex flex-col justify-between rounded-3xl border bg-gradient-to-b ${f.color} p-6 shadow-xs transition hover:-translate-y-1`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Flow */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">完整落地服務流程</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-2xl bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">1</span>
              領隊端：AI 一鍵排程與設定
            </div>
            <p className="text-slate-600 leading-relaxed">
              透過 Gemini 自動產出多日行程與集合座標，系統自動產出旅客專屬加入 QR Code。
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">2</span>
              行中端：隨身 AI 導覽與智慧防走失
            </div>
            <p className="text-slate-600 leading-relaxed">
              團員免裝 App 掃碼即用，拍照即享 AI 語音導覽，脫離安全半徑自動警示，24 小時解答團務問題。
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">3</span>
              行後端：AI 記憶相簿與口碑行銷
            </div>
            <p className="text-slate-600 leading-relaxed">
              全團共享精彩照片，Gemini 自動生成動人旅程日誌與社群文案，創造高旅客滿意度與二次轉化。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
