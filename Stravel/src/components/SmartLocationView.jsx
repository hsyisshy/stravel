import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import { distanceMeters } from '../lib/storage'

function dotIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.25)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const meetingIcon = dotIcon('#e11d48')
const userIcon = dotIcon('#f59e0b')

function SmartLocationView({ group }) {
  const hasMeetingPoint = typeof group.meetingLat === 'number' && typeof group.meetingLng === 'number'
  const [position, setPosition] = useState(null)
  const [geoError, setGeoError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('此瀏覽器不支援定位功能。')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError('')
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setGeoError(err.code === 1 ? '請允許瀏覽器存取您的位置，才能使用智慧定位。' : '目前無法取得您的位置。')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const distance = useMemo(() => {
    if (!hasMeetingPoint || !position) return null
    return distanceMeters(position.lat, position.lng, group.meetingLat, group.meetingLng)
  }, [hasMeetingPoint, position, group.meetingLat, group.meetingLng])

  const radiusM = group.safetyRadiusM || 300
  const isOutside = distance !== null && distance > radiusM

  const mapCenter = hasMeetingPoint
    ? [group.meetingLat, group.meetingLng]
    : position
      ? [position.lat, position.lng]
      : [25.033, 121.5654]

  return (
    <div className="space-y-4">
      {!hasMeetingPoint && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
          尚未設定集合地點座標，請聯繫導遊或管理員於後台設定，才能顯示安全範圍提醒。
        </div>
      )}

      {geoError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {geoError}
        </div>
      )}

      {hasMeetingPoint && distance !== null && (
        <div
          className={`rounded-xl p-4 text-sm font-bold ${
            isOutside ? 'border border-rose-300 bg-rose-50 text-rose-700' : 'border border-emerald-300 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isOutside ? '⚠️ 您已脫離安全區域' : '✅ 您在安全區域內'}
          <span className="ml-2 font-normal">
            距離集合地點約 {distance >= 1000 ? `${(distance / 1000).toFixed(1)} 公里` : `${Math.round(distance)} 公尺`}
          </span>
        </div>
      )}

      <MapContainer center={mapCenter} zoom={hasMeetingPoint ? 16 : 13} style={{ height: 320, width: '100%' }} className="overflow-hidden rounded-2xl border border-slate-200">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasMeetingPoint && (
          <>
            <Marker position={[group.meetingLat, group.meetingLng]} icon={meetingIcon} />
            <Circle center={[group.meetingLat, group.meetingLng]} radius={radiusM} pathOptions={{ color: '#0891b2' }} />
          </>
        )}
        {position && <Marker position={[position.lat, position.lng]} icon={userIcon} />}
      </MapContainer>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 您的位置
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> 集合地點
        </span>
      </div>
    </div>
  )
}

export default SmartLocationView
