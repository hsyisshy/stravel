import { useState } from 'react'
import { addFeedback, formatDateTime, hasSubmittedFeedback, markFeedbackSubmitted } from '../lib/storage'
import RecapVideoGenerator from './RecapVideoGenerator'

function GuideFeedbackForm({ group, participantId, onSubmitted }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(hasSubmittedFeedback(group.id))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!participantId) return
    setSubmitting(true)
    setError('')
    try {
      await addFeedback(group.id, { participantId, rating, comment })
      markFeedbackSubmitted(group.id)
      setSubmitted(true)
      onSubmitted?.()
    } catch (err) {
      setError(err.message || '送出回饋失敗，請重試')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
        感謝您的回饋，已成功送出！
      </div>
    )
  }

  return (
    <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
      <h3 className="text-sm font-bold text-slate-900">導遊滿意度回饋</h3>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl leading-none transition ${n <= rating ? 'text-amber-500' : 'text-slate-300'}`}
            aria-label={`${n} 顆星`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        className="form-input"
        placeholder="想對導遊說的話（選填）"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        type="submit"
        disabled={submitting || !participantId}
        className="w-full rounded-lg bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '送出中...' : '送出回饋'}
      </button>
    </form>
  )
}

function RecommendationsFeed({ group }) {
  const recommendations = group.recommendations || []

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">新行程通知</h3>
      {recommendations.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-400">目前沒有新行程通知。</p>
      ) : (
        <div className="space-y-2">
          {recommendations.map((r) => (
            <article key={r.id} className="rounded-lg border border-slate-200 p-3">
              <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
              <p className="mt-1 whitespace-pre-line text-xs text-slate-600">{r.content}</p>
              {r.linkUrl && (
                <a
                  href={r.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-cyan-700 hover:underline"
                >
                  查看詳情 →
                </a>
              )}
              <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(r.createdAt)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function PostTripView({ group, participantId, role }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-bold text-slate-900">旅程後</h2>
        <p className="mt-0.5 text-xs text-slate-500">回顧這趟旅程的精彩瞬間，並留下您的回饋。</p>
      </div>

      <RecapVideoGenerator group={group} />

      {role === 'guardian' ? (
        <RecommendationsFeed group={group} />
      ) : (
        <>
          <GuideFeedbackForm group={group} participantId={participantId} />
          <RecommendationsFeed group={group} />
        </>
      )}
    </div>
  )
}

export default PostTripView
