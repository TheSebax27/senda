import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { formatDate } from '../lib/utils'
import './Historia.css'

const TYPE_ICONS: Record<string, string> = {
  restaurante: '◆',
  ciudad: '★',
  pueblo: '✦',
  hotel: '◈',
  experiencia: '▲',
}

export function Historia() {
  const { places, loading } = usePlaces()

  const visited = [...places]
    .filter(p => !p.is_planned && p.visit_date)
    .sort((a, b) => (a.visit_date ?? '').localeCompare(b.visit_date ?? ''))

  return (
    <div className="historia-page">
      <div className="historia-inner">
        <div className="historia-header">
          <h1 className="historia-title">Nuestra historia</h1>
          <p className="historia-sub">Así hemos construido nuestra senda.</p>
        </div>

        {loading && (
          <div className="historia-loading">
            <span className="auth-spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--forest)' }} />
          </div>
        )}

        {!loading && visited.length === 0 && (
          <div className="historia-empty">
            <span>✦</span>
            <h3>La historia comienza cuando agreguen su primer lugar.</h3>
            <Link to="/agregar" className="btn-primary-lg">Agregar primer recuerdo</Link>
          </div>
        )}

        {!loading && visited.length > 0 && (
          <div className="timeline">
            {visited.map((place, i) => (
              <div key={place.id} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <Link to={`/lugares/${place.id}`} className="timeline-card">
                  {place.photos[0] && (
                    <div className="timeline-photo" style={{ backgroundImage: `url(${place.photos[0]})` }}>
                      <div className="timeline-photo-overlay" />
                    </div>
                  )}
                  <div className="timeline-body">
                    <span className="timeline-date">{formatDate(place.visit_date ?? '')}</span>
                    <h3 className="timeline-event-title">{place.name}</h3>
                    <p className="timeline-place">
                      <MapPin size={11} /> {place.city}, {place.country}
                    </p>
                    {place.story && <p className="timeline-desc">{place.story.slice(0, 100)}{place.story.length > 100 ? '…' : ''}</p>}
                    {place.rating_avg > 0 && (
                      <div className="timeline-rating">
                        <Star size={11} fill="currentColor" /> {place.rating_avg.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="timeline-node">
                  <span className="timeline-icon">{TYPE_ICONS[place.type] || '◆'}</span>
                </div>
                <div className="timeline-space" />
              </div>
            ))}

            <div className="timeline-end">
              <div className="timeline-end-node"><span>✦</span></div>
              <p className="timeline-end-text">y esto es solo el comienzo…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}