import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroup } from '../lib/storage'

const initialForm = {
  name: '',
  departureDate: '',
  returnDate: '',
  meetingPoint: '',
  guideName: '',
  guidePhone: '',
  notes: '',
}

function NewGroupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const created = await createGroup(form)
      navigate(`/admin/groups/${created.id}?token=${created.adminToken}`)
    } catch (err) {
      setError(err.message || '建立團體失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">新增旅遊團體</h1>
      <p className="mt-1 text-sm text-slate-500">建立新團後會自動產生旅客加入 QR Code。</p>
      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="form-label sm:col-span-2">
          團名
          <input
            required
            className="form-input"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </label>

        <label className="form-label">
          出發日期
          <input
            required
            type="date"
            className="form-input"
            value={form.departureDate}
            onChange={(e) => updateField('departureDate', e.target.value)}
          />
        </label>

        <label className="form-label">
          回程日期
          <input
            required
            type="date"
            className="form-input"
            value={form.returnDate}
            onChange={(e) => updateField('returnDate', e.target.value)}
          />
        </label>

        <label className="form-label sm:col-span-2">
          集合地點
          <input
            required
            className="form-input"
            value={form.meetingPoint}
            onChange={(e) => updateField('meetingPoint', e.target.value)}
          />
        </label>

        <label className="form-label">
          導遊姓名
          <input
            required
            className="form-input"
            value={form.guideName}
            onChange={(e) => updateField('guideName', e.target.value)}
          />
        </label>

        <label className="form-label">
          導遊電話
          <input
            required
            className="form-input"
            value={form.guidePhone}
            onChange={(e) => updateField('guidePhone', e.target.value)}
          />
        </label>

        <label className="form-label sm:col-span-2">
          備註
          <textarea
            rows={4}
            className="form-input"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </label>

        <div className="sm:col-span-2">
          <button
            disabled={submitting}
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '建立中...' : '建立團體'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewGroupPage
