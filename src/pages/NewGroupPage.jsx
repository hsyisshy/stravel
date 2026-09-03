import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroup } from '../lib/storage'
import LocationPicker from '../components/LocationPicker'

const initialForm = {
  name: '',
  departureDate: '',
  returnDate: '',
  meetingPoint: '',
  meetingLat: null,
  meetingLng: null,
  safetyRadiusM: 300,
  guideName: '',
  guidePhone: '',
  notes: '',
}

const demoPresets = [
  {
    name: '【秋季限定】日本京都古都賞楓 4 日慢遊團',
    departureDate: '2026-10-15',
    returnDate: '2026-10-18',
    meetingPoint: '桃園機場第二航廈 3F 華航團體櫃檯',
    meetingLat: 25.0797,
    meetingLng: 121.2342,
    safetyRadiusM: 250,
    guideName: '陳大衛 (David)',
    guidePhone: '0912-345-678',
    notes: '• 請攜帶保暖外套與舒適健走鞋\n• 自由活動時間請隨身開啟遊點易思智慧定位\n• 景點寺廟內請遵守拍照禮儀',
  },
  {
    name: '【親子生態】宜蘭礁溪溫泉與傳藝文化 2 日遊',
    departureDate: '2026-09-20',
    returnDate: '2026-09-21',
    meetingPoint: '台北車站東三門 (遊覽車停靠處)',
    meetingLat: 25.0478,
    meetingLng: 121.517,
    safetyRadiusM: 200,
    guideName: '林美玲 (May)',
    guidePhone: '0988-765-432',
    notes: '• 包含傳藝中心 DIY 體驗與礁溪溫泉泡湯\n• 集合時間請配合導遊廣播與公告',
  },
]

function NewGroupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(preset) {
    setForm(preset)
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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">新增旅遊團體</h1>
          <p className="mt-1 text-xs text-slate-500">建立新團後會自動產生旅客加入 QR Code 與專屬管理 Token。</p>
        </div>

        {/* Demo Fast Fill */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400">⚡ 快速套用示範資料：</span>
          {demoPresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-800 transition"
            >
              {idx === 0 ? '🌸 京都賞楓團' : '🏞️ 宜蘭生態團'}
            </button>
          ))}
        </div>
      </div>

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

        <div className="sm:col-span-2">
          <p className="form-label mb-2">
            集合地點座標（點選地圖設定「智慧定位」中心點，可選填）
          </p>
          <LocationPicker
            lat={form.meetingLat}
            lng={form.meetingLng}
            radiusM={form.safetyRadiusM}
            onChange={({ lat, lng }) => {
              updateField('meetingLat', lat)
              updateField('meetingLng', lng)
            }}
          />
        </div>

        <label className="form-label">
          安全範圍半徑（公尺）
          <input
            type="number"
            min="20"
            step="10"
            className="form-input"
            value={form.safetyRadiusM}
            onChange={(e) => updateField('safetyRadiusM', Number(e.target.value) || 300)}
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
