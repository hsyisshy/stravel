import { useState } from 'react'
import { generateItineraryAI, replanItineraryAI, draftAnnouncementAI } from '../lib/gemini'
import { addMultipleItineraryItems, addAnnouncement } from '../lib/storage'

/**
 * 1. AI 行程規劃與動態調程 Modal
 */
export function AiItineraryModal({ isOpen, onClose, group, onApplied }) {
  const [mode, setMode] = useState('create') // 'create' or 'replan'
  const [destination, setDestination] = useState(group?.name || '')
  const [days, setDays] = useState(1)
  const [style, setStyle] = useState('經典大眾行程，節奏舒適')
  const [situation, setSituation] = useState('下午遇大雷雨，需調整為室內行程')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedItems, setGeneratedItems] = useState([])
  const [replanResult, setReplanResult] = useState(null)
  const [applying, setApplying] = useState(false)

  if (!isOpen) return null

  const quickSituations = [
    '🌧️ 午後大雷雨，需更換為室內景點備案',
    '🚧 景點臨時整修休館，需安排鄰近替代方案',
    '🚌 國道大塞車延誤 1.5 小時，需順延並簡化行程',
    '👵 長輩團員體力不適，需減緩節奏增加休息茶歇',
  ]

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      if (mode === 'create') {
        const items = await generateItineraryAI({
          destination: destination || group?.name,
          days: Number(days) || 1,
          departureDate: group?.departureDate,
          style: style,
          notes: group?.notes,
        })
        setGeneratedItems(items)
      } else {
        const result = await replanItineraryAI({
          currentItinerary: group?.itinerary || [],
          situation: situation,
          targetDate: group?.departureDate,
          groupNotes: group?.notes,
        })
        setReplanResult(result)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'AI 運算失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  async function handleApplyItems(itemsToApply, announcementToPublish) {
    if (!itemsToApply || itemsToApply.length === 0) return
    setApplying(true)
    setError('')
    try {
      await addMultipleItineraryItems(group.id, itemsToApply)
      if (announcementToPublish) {
        await addAnnouncement(group.id, {
          title: announcementToPublish.title,
          content: announcementToPublish.content,
          pinned: true,
        })
      }
      onApplied?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || '匯入行程至資料庫失敗')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-sm shadow-sm">
              ✨
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {mode === 'create' ? 'Gemini AI 智慧一鍵排程' : 'Gemini AI 突發應變與動態調程'}
              </h2>
              <p className="text-[11px] text-slate-400">利用 Google Gemini 智慧生成或即時應變行程</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('create')
              setError('')
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ✨ 一鍵自動排程
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('replan')
              setError('')
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'replan' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🚨 突發狀況動態調程
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Mode 1: Create Form */}
        {mode === 'create' && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">
                目的地 / 主題
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
                  value={destination}
                  placeholder="例如：京都 4 天 3 夜賞楓漫遊"
                  onChange={(e) => setDestination(e.target.value)}
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                天數
                <input
                  type="number"
                  min="1"
                  max="14"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-slate-700">
              旅遊風格 / 客群偏好
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
                value={style}
                placeholder="例如：親子同樂、長輩悠閒、美食探店、歷史古蹟..."
                onChange={(e) => setStyle(e.target.value)}
              />
            </label>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Gemini 正在為您精算排程中...' : '✨ 開始由 Gemini 生成完整行程表'}
            </button>

            {/* Generated Preview */}
            {generatedItems.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-900">
                    📋 AI 規劃完成（共 {generatedItems.length} 個行程點）
                  </span>
                  <button
                    type="button"
                    disabled={applying}
                    onClick={() => handleApplyItems(generatedItems)}
                    className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-slate-700 disabled:opacity-50"
                  >
                    {applying ? '匯入中...' : '📥 一鍵套用至本團行程表'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {generatedItems.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{item.date} {item.time} · {item.title}</span>
                        <span className="text-cyan-700 font-semibold">{item.location}</span>
                      </div>
                      <p className="text-slate-600 leading-normal">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Replan Form */}
        {mode === 'replan' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ⚡ 選擇常見突發狀況或輸入說明：
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickSituations.map((qs) => (
                  <button
                    key={qs}
                    type="button"
                    onClick={() => setSituation(qs)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      situation === qs
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {qs}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="描述具體狀況（例如：遊覽車在國道拋錨，預計延遲 2 小時，需要調整下午行程與晚餐時間）"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Gemini 正在動態重構行程與草擬公告...' : '🚨 立即啟動 AI 應變調程'}
            </button>

            {/* Replan Result Preview */}
            {replanResult && (
              <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                <div className="rounded-xl bg-white p-3 border border-rose-100 text-xs">
                  <span className="font-bold text-rose-900">💡 領隊應變分析：</span>
                  <p className="mt-1 text-slate-700 leading-relaxed">{replanResult.explanation}</p>
                </div>

                {replanResult.announcementDraft && (
                  <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900">
                      📢 自動草擬緊急公告：{replanResult.announcementDraft.title}
                    </span>
                    <p className="text-amber-800 whitespace-pre-line leading-relaxed">
                      {replanResult.announcementDraft.content}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700">
                    調整後新行程（共 {replanResult.revisedItinerary?.length || 0} 項）
                  </span>
                  <button
                    type="button"
                    disabled={applying}
                    onClick={() =>
                      handleApplyItems(
                        replanResult.revisedItinerary,
                        replanResult.announcementDraft,
                      )
                    }
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                  >
                    {applying ? '同步中...' : '🚀 一鍵套用新行程並自動發布置頂公告'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 2. AI 智慧公告撰寫與潤飾 Modal
 */
export function AiAnnouncementModal({ isOpen, onClose, group, onDraftReady }) {
  const [category, setCategory] = useState('集合與行李提醒')
  const [rawTopic, setRawTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  if (!isOpen) return null

  const categories = [
    '⏰ 集合時間與地點提醒',
    '🧳 行李打包與天氣穿著提醒',
    '⚠️ 自由活動與安全守則宣導',
    '🛍️ 在地美食與免稅購物秘笈',
    '🚨 突發行程異動通知',
  ]

  async function handleDraft() {
    if (!rawTopic.trim()) {
      setError('請輸入公告重點或關鍵字')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await draftAnnouncementAI({
        rawTopic,
        category,
        groupInfo: group,
      })
      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message || '草擬失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  function handleUseDraft() {
    if (!result) return
    onDraftReady?.({
      title: result.title,
      content: result.content,
      pinned: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-sm shadow-sm">
              ✨
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Gemini AI 智慧公告撰寫</h2>
              <p className="text-[11px] text-slate-400">快速將零散草稿轉換為溫暖清晰的專業領隊公告</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">公告主題類別</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  category === c
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            輸入重點草稿（隨手打幾個關鍵字即可）
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
            placeholder="例如：明天 7:30 飯店大廳集合吃早餐，8:15 準時發車。記得帶雨傘和薄外套。"
            value={rawTopic}
            onChange={(e) => setRawTopic(e.target.value)}
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleDraft}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
        >
          {loading ? 'Gemini 正在撰寫潤飾中...' : '✨ 讓 Gemini 自動生成專業公告'}
        </button>

        {result && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase">標題預覽</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{result.title}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase">內容預覽</span>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mt-0.5 bg-white p-3 rounded-xl border border-amber-100">
                {result.content}
              </p>
            </div>
            <button
              type="button"
              onClick={handleUseDraft}
              className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow hover:bg-slate-700"
            >
              📋 帶入公告發布表單
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
