import { useEffect, useState } from 'react'
import { getGeminiApiKey, setGeminiApiKey } from '../lib/gemini'

export default function GeminiApiKeyModal({ isOpen, onClose }) {
  const [keyInput, setKeyInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setKeyInput(getGeminiApiKey() || '')
      setSaved(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleSave(e) {
    e.preventDefault()
    setGeminiApiKey(keyInput.trim())
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-sm font-bold text-sm">
              ✨
            </span>
            <h2 className="text-lg font-black text-slate-900">Google Gemini AI 設定</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          本專案深度整合 Google Gemini 多模態生態系（含多模態識景導覽、AI 隨行助理、智慧行程應變與回憶錄生成）。
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              若未於專案 .env 設定，可直接於此處貼上由{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 underline hover:text-cyan-700"
              >
                Google AI Studio
              </a>{' '}
              取得之免費 API Key。
            </p>
          </div>

          {saved && (
            <div className="rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-700">
              ✅ API Key 已成功儲存！
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95"
            >
              儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
