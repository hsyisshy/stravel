import { useRef, useState } from 'react'
import { addPhoto, formatDateTime } from '../lib/storage'
import { generateTravelStoryAI } from '../lib/gemini'

function PhotoGalleryView({ group, participantId, onUploaded }) {
  const [tab, setTab] = useState('shared')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [storyResult, setStoryResult] = useState(null)
  const [storyModalOpen, setStoryModalOpen] = useState(false)
  const [storyTone, setStoryTone] = useState('感人溫馨')
  const [copiedCaption, setCopiedCaption] = useState(false)
  const fileInputRef = useRef(null)

  const photos = group?.photos || []
  const visiblePhotos = tab === 'mine' ? photos.filter((p) => p.participantId === participantId) : photos

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    setUploadError('')
    try {
      for (const file of files) {
        const title = file.name.replace(/\.[^/.]+$/, '') || '未命名照片'
        // eslint-disable-next-line no-await-in-loop
        await addPhoto(group.id, { title, file, participantId })
      }
      onUploaded?.()
    } catch (err) {
      setUploadError(err.message || '上傳照片失敗')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGenerateStory() {
    setIsGeneratingStory(true)
    setUploadError('')
    try {
      const story = await generateTravelStoryAI({
        photos: group.photos || [],
        itinerary: group.itinerary || [],
        groupInfo: group,
        tone: storyTone,
      })
      setStoryResult(story)
      setStoryModalOpen(true)
    } catch (err) {
      console.error(err)
      setUploadError(err.message || '生成回憶錄失敗，請稍後再試')
    } finally {
      setIsGeneratingStory(false)
    }
  }

  function handleCopyCaption() {
    if (!storyResult?.socialMediaCaption) return
    navigator.clipboard.writeText(storyResult.socialMediaCaption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* AI Memory Generator Card */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-block rounded border border-cyan-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
              Gemini 多模態生成
            </span>
            <h3 className="mt-1 text-sm font-bold text-slate-900">AI 專屬旅程回憶錄</h3>
            <p className="text-[11px] text-slate-500">
              結合全團照片與足跡，自動生成回憶故事與社群貼文
            </p>
          </div>
          <button
            type="button"
            disabled={isGeneratingStory}
            onClick={handleGenerateStory}
            className="shrink-0 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {isGeneratingStory ? '生成中...' : '一鍵生成'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-semibold text-slate-500">寫作風格：</span>
          {['感人溫馨', '熱血青春', '幽默風趣', '文青深度'].map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => setStoryTone(tone)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                storyTone === tone
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('shared')}
          className={`px-3 py-2 text-sm font-semibold transition ${
            tab === 'shared' ? 'border-b-2 border-cyan-600 text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          團體共享 ({photos.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`px-3 py-2 text-sm font-semibold transition ${
            tab === 'mine' ? 'border-b-2 border-cyan-600 text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          我的照片
        </button>
      </div>

      {tab === 'mine' && !participantId && (
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          請先加入團體，才能查看與上傳「我的照片」。
        </p>
      )}

      {uploadError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {uploadError}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {visiblePhotos.length === 0 && (tab === 'shared' || participantId) && (
          <p className="col-span-3 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-400">
            目前沒有照片，快成為第一個上傳回憶的人吧。
          </p>
        )}
        {visiblePhotos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <img
              src={photo.image}
              alt={photo.title}
              title={`${photo.title} · ${formatDateTime(photo.uploadedAt)}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
        <span className="text-xs font-semibold text-slate-700">與全團共享旅程照片</span>
        <label
          className={`rounded-lg px-4 py-2.5 text-xs font-semibold text-white ${
            participantId ? 'cursor-pointer bg-cyan-600 hover:bg-cyan-700' : 'cursor-not-allowed bg-slate-300'
          }`}
        >
          {uploading ? '上傳中...' : '一鍵同步上傳'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={!participantId || uploading}
            className="hidden"
            onChange={handleFilesSelected}
          />
        </label>
      </div>

      {/* Story Modal */}
      {storyModalOpen && storyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{storyResult.storyTitle}</h3>
                <p className="text-[11px] font-semibold text-slate-500">{group.name} · 專屬回憶錄</p>
              </div>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Lead */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs italic leading-relaxed text-slate-700">
              "{storyResult.lead}"
            </div>

            {/* Daily Highlights */}
            <div className="space-y-3">
              {(storyResult.dailyHighlights || []).map((h, i) => (
                <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 p-3.5">
                  <h4 className="text-xs font-bold text-slate-900">{h.dayTitle}</h4>
                  <p className="text-xs leading-relaxed text-slate-600">{h.story}</p>
                  {h.bestMemoryQuote && (
                    <p className="text-[11px] font-semibold text-cyan-700">
                      經典時刻：「{h.bestMemoryQuote}」
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Epilogue */}
            {storyResult.epilogue && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900">旅程結語：</span>
                {storyResult.epilogue}
              </div>
            )}

            {/* Social Media Caption Box */}
            {storyResult.socialMediaCaption && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">社群貼文文案</span>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700"
                  >
                    {copiedCaption ? '已複製' : '複製文案'}
                  </button>
                </div>
                <p className="whitespace-pre-line rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700">
                  {storyResult.socialMediaCaption}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                關閉回憶錄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoGalleryView
