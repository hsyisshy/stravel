import { useEffect, useRef, useState } from 'react'
import { chatTourAssistantAI } from '../lib/gemini'

export default function AiAssistantDrawer({ group }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `您好！我是本團的「遊點易思隨行 AI 領隊小幫手」✨\n有任何集合時間、行程規劃或旅行問題，隨時都可以問我喔！`,
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [readingId, setReadingId] = useState(null)
  const messagesEndRef = useRef(null)

  const quickChips = [
    { label: '🕒 幾點集合？', query: '請問接下來最近的集合時間與行程是什麼？' },
    { label: '📍 集合地點在哪？', query: '請問集合地點在哪裡？離我現在遠嗎？' },
    { label: '📞 導遊聯絡方式', query: '請問本團導遊姓名與聯絡電話是多少？' },
    { label: '🍱 今天吃什麼？', query: '請告訴我今天的餐飲與行程安排亮點！' },
    { label: '☀️ 穿著與天氣提醒', query: '請根據我們團體行程給我一些貼心的行前或穿著注意事項。' },
  ]

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  async function handleSend(textToSend) {
    const query = (textToSend || inputValue).trim()
    if (!query || loading) return

    const userMsg = { id: String(Date.now()), role: 'user', text: query }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    try {
      const historyTurns = messages.filter((m) => m.id !== 'welcome')
      const replyText = await chatTourAssistantAI({
        message: query,
        history: historyTurns,
        groupContext: group,
      })

      const botMsg = { id: String(Date.now() + 1), role: 'assistant', text: replyText }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error(err)
      const errorMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: `⚠️ 抱歉，回答時發生錯誤：${err.message || '連線逾時'}，請稍後再試。`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  function readAloud(id, text) {
    if (!window.speechSynthesis) return
    if (readingId === id) {
      window.speechSynthesis.cancel()
      setReadingId(null)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ''))
    utterance.lang = 'zh-TW'
    utterance.onend = () => setReadingId(null)
    utterance.onerror = () => setReadingId(null)
    setReadingId(id)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-900/20 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
          </span>
          <span>✨ AI 領隊小幫手</span>
        </button>
      </div>

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="flex h-[88vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-cyan-950 to-indigo-950 px-5 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 text-lg font-bold border border-cyan-400/30">
                  ✨
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">AI 隨行領隊小幫手</h3>
                  <p className="text-[11px] text-cyan-200/80">
                    專屬團務 RAG 問答 · 24 小時為您解答
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-white/70 hover:bg-white/20 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {messages.map((m) => {
                const isUser = m.role === 'user'
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      {!isUser && (
                        <div className="mt-1.5 flex items-center justify-end border-t border-slate-100 pt-1">
                          <button
                            type="button"
                            onClick={() => readAloud(m.id, m.text)}
                            className="text-[10px] font-semibold text-cyan-700 hover:underline flex items-center gap-1"
                          >
                            {readingId === m.id ? '⏹️ 停止' : '🔊 朗讀'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-xs text-slate-500 w-fit">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  Gemini 領隊正在思考回覆中...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            <div className="border-t border-slate-100 bg-white px-4 py-2">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5">⚡ 快速詢問常用事項：</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleSend(chip.query)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-100 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="問問導遊小幫手（例如：今晚自由活動哪裡好逛？）..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-700 disabled:opacity-40"
                >
                  發送
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
