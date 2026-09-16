import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, RotateCcw, Calendar, DollarSign } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { typeLabel, formatDate, priceLabel } from '../lib/utils'
import './PlaceDetail.css'

const categoryRatings = ['Comida', 'Ambiente', 'Precio', 'Servicio', 'Experiencia']

export function PlaceDetail() {
  const { id } = useParams()
  const { places } = usePlaces()
  const navigate = useNavigate()
  const place = places.find(p => p.id === id)

  if (!place) {
    return (
      <div className="not-found">
        <p>Lugar no encontrado.</p>
        <Link to="/lugares">← Volver a lugares</Link>
      </div>
    )
  }

  const photo = place.photos[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80'

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Hero photo */}
      <div
        className="detail-hero"
        style={{ backgroundImage: `url(${photo})` }}
      >
        <div className="detail-hero-overlay" />
      </div>

      <div className="detail-body">
        <div className="detail-main">
          {/* Header */}
          <div className="detail-header">
            <div>
              <span className="detail-type">{typeLabel(place.type)}</span>
              <h1 className="detail-name">{place.name}</h1>
              <div className="detail-meta">
                <span><MapPin size={13} /> {place.city}, {place.country}</span>
                {place.visit_date && (
                  <span><Calendar size={13} /> {formatDate(place.visit_date)}</span>
                )}
                {place.price_level > 0 && (
                  <span><DollarSign size={13} /> {priceLabel(place.price_level)}</span>
                )}
                {place.would_return && (
                  <span className="would-return-badge"><RotateCcw size={11} /> Volveríamos</span>
                )}
              </div>
            </div>

            {place.rating_avg > 0 && (
              <div className="detail-rating-block">
                <div className="detail-rating-avg">
                  <Star size={20} fill="currentColor" />
                  <span>{place.rating_avg.toFixed(1)}</span>
                </div>
                <p>Nuestra calificación</p>
                <div className="detail-rating-pair">
                  <div className="rating-person">
                    <div className="person-avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80)' }} />
                    <div>
                      <span className="person-label">Él</span>
                      <strong>{place.rating_him.toFixed(1)}</strong>
                    </div>
                  </div>
                  <div className="rating-divider" />
                  <div className="rating-person">
                    <div className="person-avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80)' }} />
                    <div>
                      <span className="person-label">Ella</span>
                      <strong>{place.rating_her.toFixed(1)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category ratings */}
          {place.rating_avg > 0 && (
            <div className="detail-categories">
              {categoryRatings.map((cat, i) => (
                <div key={cat} className="category-item">
                  <span>{cat}</span>
                  <div className="stars">
                    {[1,2,3,4,5].map(n => (
                      <Star
                        key={n}
                        size={12}
                        fill={n <= Math.round((place.rating_avg + i * 0.1) / 1) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Story */}
          {place.story && (
            <section className="detail-section">
              <h2>Nuestra historia</h2>
              <p className="detail-story">{place.story}</p>
            </section>
          )}

          {/* Comments */}
          {(place.comment_him || place.comment_her) && (
            <section className="detail-section">
              <div className="comments-grid">
                {place.comment_him && (
                  <div className="comment-card">
                    <div className="comment-avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80)' }} />
                    <div>
                      <span className="comment-label">Lo que dijo él</span>
                      <p>"{place.comment_him}"</p>
                      {place.rating_him > 0 && (
                        <div className="comment-rating"><Star size={11} fill="currentColor" /> {place.rating_him.toFixed(1)}</div>
                      )}
                    </div>
                  </div>
                )}
                {place.comment_her && (
                  <div className="comment-card">
                    <div className="comment-avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80)' }} />
                    <div>
                      <span className="comment-label">Lo que dijo ella</span>
                      <p>"{place.comment_her}"</p>
                      {place.rating_her > 0 && (
                        <div className="comment-rating"><Star size={11} fill="currentColor" /> {place.rating_her.toFixed(1)}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Photo gallery sidebar */}
        {place.photos.length > 0 && (
          <aside className="detail-gallery">
            <h3>Galería</h3>
            {place.photos.map((photo, i) => (
              <div key={i} className="gallery-photo" style={{ backgroundImage: `url(${photo})` }} />
            ))}
            {place.tags.length > 0 && (
              <div className="detail-tags">
                {place.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
