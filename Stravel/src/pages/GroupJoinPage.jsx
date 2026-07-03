import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addTraveler, getGroupById } from '../lib/storage'

function GroupJoinPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getGroupById(groupId)
        setGroup(data)
      } catch (err) {
        setError(err.message || '讀取團體失敗')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [groupId])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        讀取中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    )
  }

  if (!group) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        團體不存在或已下架。
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addTraveler(groupId, form)
      navigate(`/group/${groupId}`)
    } catch (err) {
      setError(err.message || '加入團體失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">加入團體</h1>
      <p className="mt-1 text-sm text-slate-500">{group.name}</p>
      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="form-label">
          姓名
          <input
            required
            className="form-input"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </label>

        <label className="form-label">
          手機
          <input
            required
            className="form-input"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </label>

        <label className="form-label">
          備註
          <textarea
            rows={4}
            className="form-input"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </label>

        <button
          disabled={submitting}
          type="submit"
          className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? '送出中...' : '送出並加入'}
        </button>
      </form>
    </div>
  )
}

export default GroupJoinPage
