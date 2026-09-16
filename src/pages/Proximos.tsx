import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, CheckCircle } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { priorityLabel } from '../lib/utils'
import './Proximos.css'

export function Proximos() {
  const { places, convertToMemory } = usePlaces()
  const [converting, setConverting] = useState<string | null>(null)
  const [converted, setConverted] = useState<Set<string>>(new Set())

  const planned = places.filter(p => p.is_planned)
  const byPriority = {
    alta: planned.filter(p => p.priority === 'alta'),
    media: planned.filter(p => p.priority === 'media'),
    baja: planned.filter(p => p.priority === 'baja'),
  }

  const handleConvert = async (id: string) => {
    setConverting(id)
    await convertToMemory(id)
    setConverted(prev => new Set([...prev, id]))
    setConverting(null)
  }

  return (
    <div className="proximos-page">
      <div className="proximos-inner">
        <div className="proximos-header">
          <div>
            <h1 className="proximos-title">Próximas sendas</h1>
            <p className="proximos-sub">Lugares que queremos conocer juntos.</p>
          </div>
          <Link to="/agregar" className="btn-add-proximos">
            + Agregar destino
          </Link>
        </div>

        {/* Bucket list hero */}
        <div className="bucket-hero">
          <div className="bucket-hero-text">
            <span className="bucket-eyebrow">En nuestra lista</span>
            <div className="bucket-stats">
              <div className="bucket-stat">
                <span className="bucket-num">{planned.length}</span>
                <span>destinos</span>
              </div>
              <div className="bucket-divider" />
              <div className="bucket-stat">
                <span className="bucket-num">{byPriority.alta.length}</span>
                <span>alta prioridad</span>
              </div>
              <div className="bucket-divider" />
              <div className="bucket-stat">
                <span className="bucket-num">
                  {planned.reduce((sum, p) => sum + (p.planned_year || 0), 0) > 0
                    ? Math.min(...planned.filter(p => p.planned_year).map(p => p.planned_year!))
                    : '—'}
                </span>
                <span>próximo año</span>
              </div>
            </div>
          </div>
          <div className="bucket-photos">
            {planned.slice(0, 3).map(p => (
              <div
                key={p.id}
                className="bucket-thumb"
                style={{ backgroundImage: `url(${p.photos[0]})` }}
              />
            ))}
          </div>
        </div>

        {/* Priority sections */}
        {(['alta', 'media', 'baja'] as const).map(priority => {
          const items = byPriority[priority]
          if (items.length === 0) return null
          return (
            <section key={priority} className="priority-section">
              <div className="priority-header">
                <span className={`priority-badge ${priority}`}>{priorityLabel(priority)}</span>
                <h2>Prioridad {priorityLabel(priority).toLowerCase()}</h2>
              </div>
              <div className="proximos-grid">
                {items.map(place => (
                  <div key={place.id} className={`proximo-card ${converted.has(place.id) ? 'converted' : ''}`}>
                    <div
                      className="proximo-photo"
                      style={{ backgroundImage: `url(${place.photos[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'})` }}
                    >
                      <div className="proximo-photo-overlay" />
                      <div className="proximo-photo-content">
                        <span className="proximo-country">{place.country}</span>
                        {place.planned_year && (
                          <span className="proximo-year">{place.planned_year}</span>
                        )}
                      </div>
                    </div>
                    <div className="proximo-body">
                      <h3>{place.name}</h3>
                      <div className="proximo-meta">
                        <span><MapPin size={11} /> {place.city}</span>
                        {place.budget && <span className="proximo-budget">{place.budget}</span>}
                      </div>
                      {place.tags.length > 0 && (
                        <div className="proximo-tags">
                          {place.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="proximo-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="proximo-actions">
                        {converted.has(place.id) ? (
                          <div className="converted-msg">
                            <CheckCircle size={15} />
                            ¡Convertido a recuerdo!
                          </div>
                        ) : (
                          <>
                            <button
                              className="btn-convert"
                              onClick={() => handleConvert(place.id)}
                              disabled={converting === place.id}
                            >
                              {converting === place.id ? '...' : 'Convertir en recuerdo'}
                              {converting !== place.id && <ArrowRight size={13} />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {planned.length === 0 && (
          <div className="proximos-empty">
            <span className="empty-icon">✦</span>
            <h3>Aún no tienen destinos planeados</h3>
            <p>Agreguen los lugares que quieren conocer juntos.</p>
            <Link to="/agregar" className="btn-primary-lg">Agregar primer destino</Link>
          </div>
        )}
      </div>
    </div>
  )
}
