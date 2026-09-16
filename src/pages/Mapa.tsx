import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Star, X } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import type { Place, PlaceType } from '../types'
import './Mapa.css'

// Fix leaflet default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createSendaIcon(type: PlaceType) {
  const colors: Record<PlaceType, string> = {
    restaurante: '#C0714F',
    ciudad: '#2A4430',
    pueblo: '#5C7A3E',
    hotel: '#8B7355',
    experiencia: '#6B7A8D',
  }
  const color = colors[type] || '#2A4430'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    className: 'senda-marker',
  })
}

export function Mapa() {
  const { places } = usePlaces()
  const [activeType, setActiveType] = useState<'all' | PlaceType>('all')
  const [selected, setSelected] = useState<Place | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  const visited = places.filter(p => !p.is_planned && p.lat && p.lng)
  const filtered = activeType === 'all' ? visited : visited.filter(p => p.type === activeType)

  const typeFilters: { label: string; value: 'all' | PlaceType; color: string }[] = [
    { label: 'Todos', value: 'all', color: 'var(--forest)' },
    { label: 'Restaurantes', value: 'restaurante', color: '#C0714F' },
    { label: 'Ciudades', value: 'ciudad', color: '#2A4430' },
    { label: 'Pueblos', value: 'pueblo', color: '#5C7A3E' },
    { label: 'Hoteles', value: 'hotel', color: '#8B7355' },
  ]

  const center: [number, number] = [5.5, -73.5]

  return (
    <div className="mapa-page">
      <div className="mapa-header">
        <div className="mapa-header-inner">
          <div>
            <h1 className="mapa-title">Nuestra senda</h1>
            <p className="mapa-sub">{filtered.length} lugares en el mapa</p>
          </div>
          <div className="mapa-filters">
            {typeFilters.map(f => (
              <button
                key={f.value}
                className={`mapa-filter-btn ${activeType === f.value ? 'active' : ''}`}
                onClick={() => setActiveType(f.value)}
                style={{ '--dot-color': f.color } as React.CSSProperties}
              >
                <span className="filter-dot" />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mapa-container">
        {mapReady && (
          <MapContainer
            center={center}
            zoom={6}
            className="leaflet-map"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {filtered.map(place => (
              <Marker
                key={place.id}
                position={[place.lat!, place.lng!]}
                icon={createSendaIcon(place.type)}
                eventHandlers={{
                  click: () => setSelected(place),
                }}
              >
                <Popup className="senda-popup">
                  <Link to={`/lugares/${place.id}`} className="popup-link">
                    {place.photos[0] && (
                      <div className="popup-photo" style={{ backgroundImage: `url(${place.photos[0]})` }} />
                    )}
                    <div className="popup-body">
                      <strong>{place.name}</strong>
                      <span>{place.city}</span>
                      {place.rating_avg > 0 && (
                        <span className="popup-rating"><Star size={10} fill="currentColor" /> {place.rating_avg.toFixed(1)}</span>
                      )}
                    </div>
                  </Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {selected && (
          <div className="map-selected-card">
            <button className="map-card-close" onClick={() => setSelected(null)}><X size={14} /></button>
            {selected.photos[0] && (
              <div className="map-card-photo" style={{ backgroundImage: `url(${selected.photos[0]})` }} />
            )}
            <div className="map-card-body">
              <span className="map-card-type">{selected.type}</span>
              <h3>{selected.name}</h3>
              <p>{selected.city}, {selected.country}</p>
              {selected.rating_avg > 0 && (
                <div className="map-card-rating"><Star size={12} fill="currentColor" /> {selected.rating_avg.toFixed(1)}</div>
              )}
              <Link to={`/lugares/${selected.id}`} className="map-card-link">Ver recuerdo →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
