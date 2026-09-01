import { useState } from 'react'
import { distanceMeters, formatDateTime, setAttendanceStatus } from '../lib/storage'

export default function RollCallTravelerView({ group, participantId, onRefresh }) {
  const [submittingId, setSubmittingId] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const events = group?.attendanceEvents || []
  const hasMeetingPoint = typeof group?.meetingLat === 'number' && typeof group?.meetingLng === 'number'

  async function handleCheckIn(event) {
    if (!participantId) {
      setErrorMsg('請先完成團員登記，才能進行簽到打卡。')
      return
    }

    setSubmittingId(event.id)
    setStatusMsg('')
    setErrorMsg('')

    // Try to get GPS location for smart distance calculation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          let distInfo = ''
          if (hasMeetingPoint) {
            const dist = distanceMeters(
              pos.coords.latitude,
              pos.coords.longitude,
              group.meetingLat,
              group.meetingLng,
            )
            distInfo = `（距離集合點約 ${dist >= 1000 ? `${(dist / 1000).toFixed(1)}公里` : `${Math.round(dist)}公尺`}）`
          }

          try {
            await setAttendanceStatus(group.id, event.id, participantId, true)
            setStatusMsg(`🎉 簽到成功！${distInfo}`)
            onRefresh?.()
          } catch (err) {
            setErrorMsg(err.message || '簽到失敗，請重試')
          } finally {
            setSubmittingId(null)
          }
        },
        async () => {
          // GPS failed or denied, proceed with normal check-in
          try {
            await setAttendanceStatus(group.id, event.id, participantId, true)
            setStatusMsg('🎉 簽到成功！已向導遊回報已抵達。')
            onRefresh?.()
          } catch (err) {
            setErrorMsg(err.message || '簽到失敗，請重試')
          } finally {
            setSubmittingId(null)
          }
        },
        { timeout: 8000, enableHighAccuracy: true },
      )
    } else {
      try {
        await setAttendanceStatus(group.id, event.id, participantId, true)
        setStatusMsg('🎉 簽到成功！已向導遊回報已抵達。')
        onRefresh?.()
      } catch (err) {
        setErrorMsg(err.message || '簽到失敗')
      } finally {
        setSubmittingId(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 p-4 text-white shadow-md">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
          <span>📍 智慧 GPS 快速點名</span>
        </div>
        <h2 className="mt-1 text-base font-black tracking-tight">團員即時簽到回報</h2>
        <p className="mt-0.5 text-xs text-emerald-100/90">
          導遊發起點名時，團員可在此一鍵回報抵達狀態，避免團體延誤
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {errorMsg}
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
            📋
          </div>
          <p className="text-sm font-bold text-slate-700">目前尚無進行中的點名活動</p>
          <p className="text-xs text-slate-400">當導遊發起點名時，這裡將會自動出現簽到按鈕。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const isArrived = Boolean(event.records?.[participantId])
            const totalCount = group.travelers?.length || 0
            const arrivedCount = Object.values(event.records || {}).filter(Boolean).length

            return (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{event.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      發起時間：{formatDateTime(event.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isArrived
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isArrived ? '✅ 您已簽到' : '⏳ 等待簽到'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 flex items-center justify-between">
                  <span>全團簽到進度：</span>
                  <span className="font-bold text-slate-900">
                    {arrivedCount} / {totalCount} 人已到齊
                  </span>
                </div>

                <div>
                  {isArrived ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center text-xs font-bold text-emerald-700">
                      👍 您已向導遊回報抵達！請留意導遊現場指示。
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={submittingId === event.id}
                      onClick={() => handleCheckIn(event)}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                    >
                      {submittingId === event.id ? '定位打卡中...' : '📍 我已抵達！點此立即 GPS 簽到'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
