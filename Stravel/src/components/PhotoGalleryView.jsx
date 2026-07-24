import { useRef, useState } from 'react'
import { addPhoto, formatDateTime } from '../lib/storage'

function PhotoGalleryView({ group, participantId, onUploaded }) {
  const [tab, setTab] = useState('shared')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const photos = group.photos || []
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('shared')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'shared' ? 'bg-white text-slate-900 shadow' : 'bg-amber-100 text-slate-600'
          }`}
        >
          班級共享
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'mine' ? 'bg-white text-slate-900 shadow' : 'bg-amber-100 text-slate-600'
          }`}
        >
          我的照片
        </button>
      </div>

      {tab === 'mine' && !participantId && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          請先加入團體，才能查看與上傳「我的照片」。
        </p>
      )}

      {uploadError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{uploadError}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {visiblePhotos.length === 0 && (tab === 'shared' || participantId) && (
          <p className="col-span-3 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
            目前沒有照片。
          </p>
        )}
        {visiblePhotos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
            <img
              src={photo.image}
              alt={photo.title}
              title={`${photo.title} · ${formatDateTime(photo.uploadedAt)}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
        <span className="text-sm font-semibold text-slate-600">共享回憶</span>
        <label
          className={`rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 shadow ${
            participantId ? 'cursor-pointer bg-amber-400 hover:bg-amber-300' : 'cursor-not-allowed bg-amber-200 opacity-60'
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
    </div>
  )
}

export default PhotoGalleryView
