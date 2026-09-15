import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, Circle } from '@vis.gl/react-google-maps'
import { distanceMeters, updateMyLocation } from '../lib/storage'

const BROADCAST_INTERVAL_MS = 15000

function dotIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  const maps = window.google?.maps
  return maps ? { url, scaledSize: new maps.Size(20, 20), anchor: new maps.Point(10, 10) } : url
}

const meetingIcon = dotIcon('#e11d48')
const userIcon = dotIcon('#f59e0b')

function SmartLocationView({ group, participantId }) {
  const hasMeetingPoint = typeof group.meetingLat === 'number' && typeof group.meetingLng === 'number'
  const [position, setPosition] = useState(null)
  const [geoError, setGeoError] = useState('')
  const lastBroadcastRef = useRef(0)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('此瀏覽器不支援定位功能。')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError('')
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPosition(next)

        if (participantId) {
          const now = Date.now()
          if (now - lastBroadcastRef.current >= BROADCAST_INTERVAL_MS) {
            lastBroadcastRef.current = now
            updateMyLocation(group.id, participantId, next).catch(() => {
              // 位置回報失敗不影響使用者的定位體驗，安靜略過即可
            })
          }
        }
      },
      (err) => {
        setGeoError(err.code === 1 ? '請允許瀏覽器存取您的位置，才能使用智慧定位。' : '目前無法取得您的位置。')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [group.id, participantId])

  const distance = useMemo(() => {
    if (!hasMeetingPoint || !position) return null
    return distanceMeters(position.lat, position.lng, group.meetingLat, group.meetingLng)
  }, [hasMeetingPoint, position, group.meetingLat, group.meetingLng])

  const radiusM = group.safetyRadiusM || 300
  const isOutside = distance !== null && distance > radiusM

  const meetingPoint = hasMeetingPoint ? { lat: group.meetingLat, lng: group.meetingLng } : null
  const mapCenter = meetingPoint || position || { lat: 25.033, lng: 121.5654 }

  return (
    <div className="space-y-4">
      {!hasMeetingPoint && (
        <div className="traveler-glass-card border border-amber-300/60 text-sm text-amber-700">
          尚未設定集合地點座標，請聯繫導遊或管理員於後台設定，才能顯示安全範圍提醒。
        </div>
      )}

      {geoError && (
        <div className="traveler-glass-card border border-rose-200/60 text-sm text-rose-700">
          {geoError}
        </div>
      )}

      {hasMeetingPoint && distance !== null && (
        <div
          className={`traveler-glass-card text-sm font-bold ${
            isOutside ? 'text-rose-700' : 'text-emerald-700'
          }`}
        >
          {isOutside ? '您已脫離安全區域' : '您在安全區域內'}
          <span className="ml-2 font-normal text-slate-600">
            距離集合地點約 {distance >= 1000 ? `${(distance / 1000).toFixed(1)} 公里` : `${Math.round(distance)} 公尺`}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl">
        <Map style={{ height: 320, width: '100%' }} defaultCenter={mapCenter} defaultZoom={hasMeetingPoint ? 16 : 13} gestureHandling="greedy">
          {meetingPoint && (
            <>
              <Marker position={meetingPoint} icon={meetingIcon} />
              <Circle center={meetingPoint} radius={radiusM} strokeColor="#0891b2" strokeWeight={2} fillColor="#0891b2" fillOpacity={0.12} />
            </>
          )}
          {position && <Marker position={position} icon={userIcon} />}
        </Map>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs font-medium text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 您的位置
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> 導遊位置
        </span>
      </div>
    </div>
  )
}

export default SmartLocationView
