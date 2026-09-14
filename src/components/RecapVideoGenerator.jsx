import { useRef, useState } from 'react'
import { generateTravelStoryAI } from '../lib/gemini'

const FONT_STACK = '"Noto Sans TC", "PingFang TC", sans-serif'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawCoverImage(ctx, img, w, h, zoom = 1) {
  const imgRatio = img.width / img.height
  const canvasRatio = w / h
  let sw, sh
  if (imgRatio > canvasRatio) {
    sh = img.height
    sw = sh * canvasRatio
  } else {
    sw = img.width
    sh = sw / canvasRatio
  }
  sw /= zoom
  sh /= zoom
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'center', maxLines = 5) {
  ctx.textAlign = align
  const chars = String(text || '').split('')
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  lines.slice(0, maxLines).forEach((l, i) => {
    ctx.fillText(l, x, y + i * lineHeight)
  })
}

function drawSlide(ctx, canvas, slide, t) {
  const w = canvas.width
  const h = canvas.height

  if (slide.type === 'title') {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#0e7490')
    grad.addColorStop(1, '#0891b2')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 56px ${FONT_STACK}`
    wrapText(ctx, slide.title, w / 2, h / 2 - 40, w - 200, 68, 'center', 3)

    ctx.font = `28px ${FONT_STACK}`
    ctx.globalAlpha = 0.9
    wrapText(ctx, slide.subtitle || '', w / 2, h / 2 + 80, w - 280, 40, 'center', 3)
    ctx.globalAlpha = 1
    return
  }

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, w, h)

  if (slide.image) {
    const zoom = 1 + 0.08 * t
    drawCoverImage(ctx, slide.image, w, h, zoom)
  }

  const overlay = ctx.createLinearGradient(0, h * 0.4, 0, h)
  overlay.addColorStop(0, 'rgba(15,23,42,0)')
  overlay.addColorStop(1, 'rgba(15,23,42,0.9)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 40px ${FONT_STACK}`
  ctx.textAlign = 'left'
  ctx.fillText(slide.heading || '', 60, h - 190)

  ctx.font = `24px ${FONT_STACK}`
  wrapText(ctx, slide.body || '', 60, h - 140, w - 120, 34, 'left', 2)

  if (slide.quote) {
    ctx.font = `italic 22px ${FONT_STACK}`
    ctx.fillStyle = '#67e8f9'
    ctx.textAlign = 'left'
    ctx.fillText(`「${slide.quote}」`, 60, h - 40)
  }
}

function renderVideo(canvas, slides, onSlideDone) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d')
    canvas.width = 1280
    canvas.height = 720

    const stream = canvas.captureStream(30)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
    const chunks = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      resolve(URL.createObjectURL(new Blob(chunks, { type: mimeType })))
    }
    recorder.onerror = (e) => reject(e.error || new Error('錄製影片失敗'))

    recorder.start()

    let slideIndex = 0
    let slideStart = performance.now()

    function frame(now) {
      const slide = slides[slideIndex]
      const elapsed = now - slideStart
      const t = Math.min(elapsed / slide.duration, 1)

      drawSlide(ctx, canvas, slide, t)

      if (elapsed >= slide.duration) {
        onSlideDone?.(slideIndex)
        slideIndex += 1
        slideStart = now
        if (slideIndex >= slides.length) {
          recorder.stop()
          return
        }
      }
      requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
  })
}

function RecapVideoGenerator({ group }) {
  const canvasRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState('')

  const supported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'

  async function handleGenerate() {
    if (!supported) {
      setError('此瀏覽器不支援影片錄製功能，請改用最新版 Chrome / Edge。')
      return
    }

    setGenerating(true)
    setError('')
    setVideoUrl(null)

    try {
      setProgress('AI 正在撰寫回憶錄...')
      const story = await generateTravelStoryAI({
        photos: group.photos || [],
        itinerary: group.itinerary || [],
        groupInfo: group,
        tone: '感人溫馨',
      })

      setProgress('載入照片素材...')
      const photos = group.photos || []
      const images = (
        await Promise.all(photos.slice(0, 12).map((p) => loadImage(p.image).catch(() => null)))
      ).filter(Boolean)

      const highlights = story.dailyHighlights || []
      const slides = [
        { type: 'title', title: story.storyTitle || group.name, subtitle: story.lead || '', duration: 4000 },
        ...highlights.map((h, i) => ({
          type: 'photo',
          image: images.length ? images[i % images.length] : null,
          heading: h.dayTitle,
          body: h.story,
          quote: h.bestMemoryQuote,
          duration: 5000,
        })),
        { type: 'title', title: '旅程結語', subtitle: story.epilogue || '', duration: 4000 },
      ]

      setProgress(`渲染影片中... (0/${slides.length})`)
      const url = await renderVideo(canvasRef.current, slides, (doneIndex) => {
        setProgress(`渲染影片中... (${doneIndex + 1}/${slides.length})`)
      })
      setVideoUrl(url)
    } catch (err) {
      console.error(err)
      setError(err.message || '生成影片失敗，請稍後再試')
    } finally {
      setGenerating(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="inline-block rounded border border-cyan-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
            Gemini 多模態生成
          </span>
          <h3 className="mt-1 text-sm font-bold text-slate-900">一鍵生成回顧影片</h3>
          <p className="text-[11px] text-slate-500">結合團體照片與 AI 回憶錄文字，自動生成專屬旅程回顧影片</p>
        </div>
        <button
          type="button"
          disabled={generating || !supported}
          onClick={handleGenerate}
          className="shrink-0 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {generating ? '生成中...' : videoUrl ? '重新生成' : '一鍵生成'}
        </button>
      </div>

      {!supported && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          此瀏覽器不支援影片錄製功能，請改用最新版 Chrome / Edge。
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</p>
      )}

      {generating && (
        <p className="rounded-lg border border-cyan-200 bg-white p-3 text-xs font-semibold text-cyan-700">{progress}</p>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {videoUrl && (
        <div className="space-y-2">
          <video src={videoUrl} controls className="w-full rounded-lg border border-slate-200 bg-black" />
          <a
            href={videoUrl}
            download={`${group.name || 'trip'}-旅程回顧.webm`}
            className="block w-full rounded-lg bg-slate-900 py-2 text-center text-xs font-semibold text-white hover:bg-slate-700"
          >
            下載影片
          </a>
        </div>
      )}
    </div>
  )
}

export default RecapVideoGenerator
