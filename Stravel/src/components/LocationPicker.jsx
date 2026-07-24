import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const FALLBACK_CENTER = [25.033, 121.5654] // Taipei

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function LocationPicker({ lat, lng, radiusM, onChange }) {
  const center = useMemo(() => {
    if (typeof lat === 'number' && typeof lng === 'number') return [lat, lng]
    return FALLBACK_CENTER
  }, [lat, lng])

  const hasPoint = typeof lat === 'number' && typeof lng === 'number'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={center} zoom={hasPoint ? 16 : 12} style={{ height: 260, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace onPick={(pickedLat, pickedLng) => onChange({ lat: pickedLat, lng: pickedLng })} />
        {hasPoint && (
          <>
            <Marker
              position={[lat, lng]}
              icon={defaultIcon}
              draggable
              eventHandlers={{
                dragend(e) {
                  const pos = e.target.getLatLng()
                  onChange({ lat: pos.lat, lng: pos.lng })
                },
              }}
            />
            <Circle center={[lat, lng]} radius={radiusM || 300} pathOptions={{ color: '#0891b2' }} />
          </>
        )}
      </MapContainer>
    </div>
  )
}

export default LocationPicker
