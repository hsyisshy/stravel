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
const childIcon = dotIcon('#0891b2')

function GuardianLocationView({ group, child }) {
  const hasMeetingPoint = typeof group.meetingLat === 'number' && typeof group.meetingLng === 'number'
  const [liveLocations, setLiveLocations] = useState(group.liveLocations || {})

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await getLiveLocations(group.id)
        if (!cancelled) setLiveLocations(data)
      } catch {
        // 輪詢失敗時保留舊資料，安靜略過即可
      }
    }

    poll()
    const intervalId = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [group.id])

  if (!child) {
    return (
      <div className="traveler-glass-card border border-amber-300/60 text-sm text-amber-700">
        找不到您關注的團員資料，請聯繫導遊確認。
      </div>
    )
  }

  const childLocation = liveLocations[child.id]
  const hasChildPosition = typeof childLocation?.lat === 'number' && typeof childLocation?.lng === 'number'

  const distance =
    hasMeetingPoint && hasChildPosition
      ? distanceMeters(childLocation.lat, childLocation.lng, group.meetingLat, group.meetingLng)
      : null

  const radiusM = group.safetyRadiusM || 300
  const isOutside = distance !== null && distance > radiusM

  const meetingPoint = hasMeetingPoint ? { lat: group.meetingLat, lng: group.meetingLng } : null
  const childPoint = hasChildPosition ? { lat: childLocation.lat, lng: childLocation.lng } : null
  const mapCenter = childPoint || meetingPoint || { lat: 25.033, lng: 121.5654 }

  return (
    <div className="space-y-4">
      <div className="traveler-glass-card">
        <h2 className="text-sm font-bold text-slate-900">{child.name} 的即時位置</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {hasChildPosition ? `最後更新：${formatDateTime(childLocation.updatedAt)}` : '尚未取得孩子的位置回報，孩子的裝置需開啟「智慧定位」頁面才會持續回報。'}
        </p>
      </div>

      {!hasMeetingPoint && (
        <div className="traveler-glass-card border border-amber-300/60 text-sm text-amber-700">
          導遊尚未設定集合地點座標，暫無法顯示安全範圍提醒。
        </div>
      )}

      {hasMeetingPoint && distance !== null && (
        <div
          className={`traveler-glass-card text-sm font-bold ${
            isOutside ? 'text-rose-700' : 'text-emerald-700'
          }`}
        >
          {isOutside ? `${child.name} 已脫離安全區域` : `${child.name} 在安全區域內`}
          <span className="ml-2 font-normal text-slate-600">
            距離集合地點約 {distance >= 1000 ? `${(distance / 1000).toFixed(1)} 公里` : `${Math.round(distance)} 公尺`}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl">
        <Map style={{ height: 320, width: '100%' }} defaultCenter={mapCenter} defaultZoom={hasMeetingPoint || hasChildPosition ? 16 : 13} gestureHandling="greedy">
          {meetingPoint && (
            <>
              <Marker position={meetingPoint} icon={meetingIcon} />
              <Circle center={meetingPoint} radius={radiusM} strokeColor="#0891b2" strokeWeight={2} fillColor="#0891b2" fillOpacity={0.12} />
            </>
          )}
          {childPoint && <Marker position={childPoint} icon={childIcon} />}
        </Map>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs font-medium text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-600" /> {child.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> 集合地點
        </span>
      </div>
    </div>
  )
}

export default GuardianLocationView
