import { Link } from 'react-router-dom'
import { MapPin, Star, RotateCcw } from 'lucide-react'
import type { Place } from '../types'
import { typeLabel } from '../lib/utils'
import './PlaceCard.css'

interface Props {
  place: Place
  size?: 'normal' | 'large'
}

export function PlaceCard({ place, size = 'normal' }: Props) {
  const photo = place.photos[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'

  return (
    <Link to={`/lugares/${place.id}`} className={`place-card ${size}`}>
      <div className="place-card-image" style={{ backgroundImage: `url(${photo})` }}>
        <span className="place-card-type">{typeLabel(place.type)}</span>
        {place.would_return && (
          <span className="place-card-return" title="Volveríamos">
            <RotateCcw size={11} />
          </span>
        )}
      </div>
      <div className="place-card-body">
        <h3 className="place-card-name">{place.name}</h3>
        <div className="place-card-meta">
          <span className="place-card-location">
            <MapPin size={11} />
            {place.city}, {place.country}
          </span>
          <span className="place-card-date">
            {formatDate(place.visit_date)}
          </span>
        </div>
        {place.rating_avg > 0 && (
          <div className="place-card-rating">
            <Star size={12} fill="currentColor" />
            <span>{place.rating_avg.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}