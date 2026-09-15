import { useEffect, useState } from 'react'
import { Map, Marker, Circle } from '@vis.gl/react-google-maps'
import { distanceMeters, formatDateTime, getLiveLocations } from '../lib/storage'

const POLL_INTERVAL_MS = 10000

function dotIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  const maps = window.google?.maps
  return maps ? { url, scaledSize: new maps.Size(20, 20), anchor: new maps.Point(10, 10) } : url
}

const meetingIcon = dotIcon('#e11d48')
const insideIcon = dotIcon('#059669')
const outsideIcon = dotIcon('#dc2626')

function AdminLiveMapView({ group }) {
  const hasMeetingPoint = typeof group.meetingLat === 'number' && typeof group.meetingLng === 'number'
  const [liveLocations, setLiveLocations] = useState(group.liveLocations || {})
  const travelers = (group.travelers || []).filter((t) => t.role !== 'guardian')
  const radiusM = group.safetyRadiusM || 300

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await getLiveLocations(group.id)
        if (!cancelled) setLiveLocations(data)
      } catch {
        // 輪詢失敗時保留舊資料
      }
    }

    poll()
    const intervalId = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [group.id])

  const meetingPoint = hasMeetingPoint ? { lat: group.meetingLat, lng: group.meetingLng } : null
  const mapCenter = meetingPoint || { lat: 25.033, lng: 121.5654 }

  const rows = travelers.map((traveler) => {
    const loc = liveLocations[traveler.id]
    const hasPosition = typeof loc?.lat === 'number' && typeof loc?.lng === 'number'
    const distance = hasMeetingPoint && hasPosition ? distanceMeters(loc.lat, loc.lng, group.meetingLat, group.meetingLng) : null
    const isOutside = distance !== null && distance > radiusM
    return { traveler, loc, hasPosition, distance, isOutside }
  })

  const insideCount = rows.filter((r) => r.hasPosition && !r.isOutside).length
  const outsideCount = rows.filter((r) => r.hasPosition && r.isOutside).length
  const noReportCount = rows.filter((r) => !r.hasPosition).length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        團員需開啟旅客端「智慧定位」頁面，才會持續回報位置（每約 15 秒更新一次）。此頁面每 10 秒自動刷新。
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 p-3.5">
          <p className="text-xs font-semibold text-slate-500">團員總數</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <p className="text-xs font-semibold text-emerald-700">安全區域內</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{insideCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
          <p className="text-xs font-semibold text-rose-700">已脫離範圍</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{outsideCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-xs font-semibold text-slate-500">尚無回報</p>
          <p className="mt-1 text-2xl font-black text-slate-500">{noReportCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Map style={{ height: 360, width: '100%' }} defaultCenter={mapCenter} defaultZoom={hasMeetingPoint ? 15 : 12} gestureHandling="greedy">
          {meetingPoint && (
            <>
              <Marker position={meetingPoint} icon={meetingIcon} />
              <Circle center={meetingPoint} radius={radiusM} strokeColor="#0891b2" strokeWeight={2} fillColor="#0891b2" fillOpacity={0.12} />
            </>
          )}
          {rows
            .filter((r) => r.hasPosition)
            .map((r) => (
              <Marker key={r.traveler.id} position={{ lat: r.loc.lat, lng: r.loc.lng }} icon={r.isOutside ? outsideIcon : insideIcon} title={r.traveler.name} />
            ))}
        </Map>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">團員</th>
              <th className="px-4 py-2.5 font-semibold">狀態</th>
              <th className="px-4 py-2.5 font-semibold">距離集合點</th>
              <th className="px-4 py-2.5 font-semibold">最後更新</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                  尚無團員。
                </td>
              </tr>
            )}
            {rows.map(({ traveler, loc, hasPosition, distance, isOutside }) => (
              <tr key={traveler.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-semibold text-slate-900">{traveler.name}</td>
                <td className="px-4 py-2.5">
                  {!hasPosition ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">尚無回報</span>
                  ) : isOutside ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">已脫離範圍</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">安全區域內</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {distance === null ? '-' : distance >= 1000 ? `${(distance / 1000).toFixed(1)} 公里` : `${Math.round(distance)} 公尺`}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{hasPosition ? formatDateTime(loc.updatedAt) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminLiveMapView
