import { useEffect, useRef, useState } from 'react'
import { narrateLandmarkAI } from '../lib/gemini'

export default function AiTourGuideView({ group }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [locationName, setLocationName] = useState('')
  const [userQuestion, setUserQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const fileInputRef = useRef(null)
  const synthRef = useRef(null)

  // Suggest spots from group itinerary
  const itineraryLocations = Array.from(
    new Set((group?.itinerary || []).map((item) => item.location || item.title).filter(Boolean)),
  ).slice(0, 5)

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function handleClearImage() {
    setSelectedImage(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGenerateGuide(customLocation) {
    const targetLoc = customLocation || locationName
    if (!selectedImage && !targetLoc && !userQuestion) {
      setError('請先拍照/上傳景點照片，或輸入景點名稱')
      return
    }

    setLoading(true)
    setError('')
    stopAudio()

    try {
      const data = await narrateLandmarkAI({
        imageBase64: imagePreview,
        mimeType: selectedImage?.type || 'image/jpeg',
        locationName: targetLoc,
        userQuestion: userQuestion,
        groupInfo: group,
      })
      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'AI 景點辨識與導覽產生失敗')
    } finally {
      setLoading(false)
    }
  }

  // Web Speech API TTS
  function playAudioStory(text) {
    if (!window.speechSynthesis) {
      alert('您的瀏覽器暫不支援語音合成朗讀')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-TW'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => setIsPlayingAudio(true)
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  function stopAudio() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <span className="inline-block rounded border border-cyan-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
          Gemini Vision
        </span>
        <h2 className="mt-1.5 text-sm font-bold text-slate-900">多模態隨身 AI 導遊</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          拍照或選擇景點，由 Gemini 說明歷史故事與拍照建議
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Input / Photo Section */}
      <div className="space-y-3.5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800">
            拍照或上傳現場景點 / 文物 / 美食照片
          </label>
          {imagePreview && (
            <button
              type="button"
              onClick={handleClearImage}
              className="text-[11px] font-semibold text-rose-600 hover:underline"
            >
              清除照片
            </button>
          )}
        </div>

        {imagePreview ? (
          <div className="relative h-44 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img src={imagePreview} alt="景點預覽" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40"
          >
            <p className="text-xs font-semibold text-slate-700">點擊拍照或從相簿選取照片</p>
            <p className="text-[11px] text-slate-400">支援古蹟、招牌、建築、菜單、展覽品多模態辨識</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Location presets & input */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            或選擇本團行程景點 / 自訂地點
          </label>
          {itineraryLocations.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {itineraryLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setLocationName(loc)
                    handleGenerateGuide(loc)
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    locationName === loc
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例如：清水寺、金閣寺、九份阿妹茶樓..."
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => handleGenerateGuide()}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? 'AI 導覽產生中...' : '開始導覽'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-3.5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                隨身景點百科
              </span>
              <h3 className="mt-1 text-base font-bold text-slate-900">{result.landmarkName}</h3>
              {result.subtitle && (
                <p className="text-xs font-medium text-cyan-700">{result.subtitle}</p>
              )}
            </div>

            {/* Voice Audio Player Button */}
            <button
              type="button"
              onClick={() =>
                isPlayingAudio ? stopAudio() : playAudioStory(result.audioStory || result.summary)
              }
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                isPlayingAudio
                  ? 'bg-rose-500 text-white'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              {isPlayingAudio ? '停止朗讀' : '語音朗讀'}
            </button>
          </div>

          {/* Quick Summary */}
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            <span className="font-semibold text-slate-900">景點速覽：</span>
            {result.summary}
          </div>

          {/* Immersive Audio Story */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-900">導遊解說故事</h4>
            <p className="whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              {result.audioStory}
            </p>
          </div>

          {/* Fun Trivia & Photo Tips */}
          <div className="grid gap-2.5 text-xs sm:grid-cols-2">
            {result.funTrivia && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">冷知識</p>
                <p className="mt-1 leading-normal text-slate-600">{result.funTrivia}</p>
              </div>
            )}

            {result.photoTips && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">拍攝建議</p>
                <p className="mt-1 leading-normal text-slate-600">{result.photoTips}</p>
              </div>
            )}
          </div>

          {/* Etiquette / Notices */}
          {result.etiquette && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
              <span className="font-semibold">參觀禮儀與提醒：</span>
              {result.etiquette}
            </div>
          )}

          {/* Follow-up question */}
          <div className="border-t border-slate-100 pt-3">
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              想再深入了解什麼？（問問隨身 AI 導遊）
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例如：附近有什麼必吃排隊名店？"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateGuide()
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => handleGenerateGuide()}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                追問
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
