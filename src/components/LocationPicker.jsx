import { Map, Marker, Circle } from '@vis.gl/react-google-maps'

const FALLBACK_CENTER = { lat: 25.033, lng: 121.5654 } // Taipei

function toLatLngLiteral(latLng) {
  if (!latLng) return null
  const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat
  const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng
  return { lat, lng }
}

function LocationPicker({ lat, lng, radiusM, onChange }) {
  const hasPoint = typeof lat === 'number' && typeof lng === 'number'
  const center = hasPoint ? { lat, lng } : FALLBACK_CENTER

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Map
        style={{ height: 260, width: '100%' }}
        defaultCenter={center}
        defaultZoom={hasPoint ? 16 : 12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={(e) => {
          const picked = toLatLngLiteral(e.detail.latLng)
          if (picked) onChange(picked)
        }}
      >
        {hasPoint && (
          <>
            <Marker
              position={center}
              draggable
              onDragEnd={(e) => {
                const picked = toLatLngLiteral(e.latLng)
                if (picked) onChange(picked)
              }}
            />
            <Circle center={center} radius={radiusM || 300} strokeColor="#0891b2" strokeWeight={2} fillColor="#0891b2" fillOpacity={0.15} />
          </>
        )}
      </Map>
    </div>
  )
}

export default LocationPicker
