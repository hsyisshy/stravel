import { Link } from 'react-router-dom'

function HomePage() {
  const aiFeatures = [
    {
      title: '多模態拍照識景導覽',
      desc: '旅客拍下景點、文物、菜單，Gemini 多模態視覺即時講述歷史故事與拍照建議，並支援語音朗讀。',
      tag: 'Vision',
    },
    {
      title: '24 小時隨行領隊小幫手',
      desc: '串接本團行程、公告與導遊聯絡資訊，團員詢問集合時間、用餐地點時，AI 立即依據即時資料回覆。',
      tag: 'Grounded Chat',
    },
    {
      title: 'AI 智慧排程與動態應變',
      desc: '輸入關鍵字即可生成行程；遇天候或交通狀況可一鍵啟動動態調程，自動替換備案並草擬公告。',
      tag: 'Planning',
    },
    {
      title: '多模態旅遊回憶錄',
      desc: '彙整全團照片與行程足跡，旅程結束後自動生成圖文日誌與社群貼文文案。',
      tag: 'Storytelling',
    },
  ]

  const steps = [
    {
      title: '領隊端：一鍵排程與設定',
      desc: '透過 Gemini 自動產出多日行程與集合座標，系統自動產生旅客加入 QR Code。',
    },
    {
      title: '行程中：隨身導覽與防走失',
      desc: '團員免裝 App、掃碼即用，拍照即可取得 AI 語音導覽，脫離安全範圍自動提示。',
    },
    {
      title: '行程後：回憶相簿與紀錄',
      desc: '全團共享照片，Gemini 自動生成旅程日誌與社群文案。',
    },
  ]

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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">核心 AI 功能</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiFeatures.map((f, i) => (
            <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5">
              <div className="space-y-2">
                <span className="inline-block rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                  {f.tag}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-lg font-bold text-slate-900">服務流程</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                  {i + 1}
                </span>
                {step.title}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
