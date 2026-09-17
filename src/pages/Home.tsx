import { Link } from 'react-router-dom'
import { MapPin, Star, ArrowRight } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { PlaceCard } from '../components/PlaceCard'
import './Home.css'

export function Home() {
  const { places } = usePlaces()

  const visited = places.filter(p => !p.is_planned)
  const cities = [...new Set(visited.map(p => p.city))].length
  const restaurants = visited.filter(p => p.type === 'restaurante').length
  const trips = visited.filter(p => p.type === 'ciudad' || p.type === 'pueblo').length
  const recent = [...visited]
    .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
    .slice(0, 4)

  // Mejor calificado — real
  const bestRated = visited.length > 0
    ? [...visited].sort((a, b) => b.rating_avg - a.rating_avg)[0]
    : null

  // Primera cita — el lugar visitado más antiguo
  const firstPlace = visited.length > 0
    ? [...visited].filter(p => p.visit_date).sort((a, b) => a.visit_date.localeCompare(b.visit_date))[0]
    : null

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-image" style={{
          backgroundImage: 'url(https://i.pinimg.com/1200x/90/ff/b9/90ffb9b1b163b494575538e05a209f21.jpg)'
        }}>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-eyebrow">Nuestra Senda</p>
            <h1 className="hero-title">El camino que<br />recorremos juntos.</h1>
            <Link to="/agregar" className="hero-cta">
              Agregar huella <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stats-inner">
          <div className="stat">
            <span className="stat-number">{visited.length}</span>
            <span className="stat-label">lugares</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">{cities}</span>
            <span className="stat-label">ciudades</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">{restaurants}</span>
            <span className="stat-label">restaurantes</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">{trips}</span>
            <span className="stat-label">viajes</span>
          </div>
        </div>
      </section>

      {/* Map teaser */}
      <section className="section map-teaser">
        <div className="section-header">
          <div>
            <h2 className="section-title">Nuestro recorrido</h2>
            <p className="section-sub">Cada punto, un recuerdo.</p>
          </div>
          <Link to="/mapa" className="see-all">Ver mapa completo <ArrowRight size={13} /></Link>
        </div>
        <div className="map-preview">
          <div className="map-placeholder">
            <div className="map-bg" />
            {visited.filter(p => p.lat).map(p => (
              <div
                key={p.id}
                className="map-dot"
                style={{
                  left: `${((p.lng! + 80) / 20) * 100}%`,
                  top: `${((12 - p.lat!) / 10) * 100}%`,
                }}
                title={p.name}
              >
                <span className="map-dot-label">{p.name}</span>
              </div>
            ))}
            <div className="map-overlay-text">
              <MapPin size={18} />
              <span>{visited.filter(p => p.lat).length} lugares en el mapa</span>
              <Link to="/mapa" className="map-btn">Explorar <ArrowRight size={13} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent places */}
      {recent.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Últimas huellas</h2>
              <p className="section-sub">Los lugares que hemos visitado recientemente.</p>
            </div>
            <Link to="/lugares" className="see-all">Ver todos <ArrowRight size={13} /></Link>
          </div>
          <div className="cards-grid">
            {recent.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {/* Highlights — solo si hay datos reales */}
      {(bestRated || firstPlace) && (
        <section className="section highlights">
          {bestRated && (
            <Link to={`/lugares/${bestRated.id}`} className="highlight-card" style={{
              backgroundImage: bestRated.photos[0] ? `url(${bestRated.photos[0]})` : 'none',
              background: !bestRated.photos[0] ? 'var(--forest)' : undefined,
            }}>
              <div className="highlight-overlay" />
              <div className="highlight-body">
                <span className="highlight-label">Mejor calificado</span>
                <h3>{bestRated.name}</h3>
                {bestRated.rating_avg > 0 && (
                  <div className="highlight-rating">
                    <Star size={13} fill="currentColor" /> {bestRated.rating_avg.toFixed(1)}
                  </div>
                )}
              </div>
            </Link>
          )}

          {firstPlace && (
            <Link to={`/lugares/${firstPlace.id}`} className="highlight-card" style={{
              backgroundImage: firstPlace.photos[0] ? `url(${firstPlace.photos[0]})` : 'none',
              background: !firstPlace.photos[0] ? 'var(--olive)' : undefined,
            }}>
              <div className="highlight-overlay" />
              <div className="highlight-body">
                <span className="highlight-label">El principio</span>
                <h3>{firstPlace.name}</h3>
                {firstPlace.visit_date && (
                  <div className="highlight-rating" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {new Date(firstPlace.visit_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </Link>
          )}

          <div className="highlight-card highlight-cta">
            <div className="highlight-cta-content">
              <p>¿A dónde vamos después?</p>
              <Link to="/proximos" className="btn-primary">Ver próximas sendas</Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {visited.length === 0 && (
        <section className="section home-empty">
          <div className="home-empty-inner">
            <span className="home-empty-icon">✦</span>
            <h2>Aún no hay huellas en vuestra senda</h2>
            <p>Empiecen agregando el primer lugar que han recorrido juntos.</p>
            <Link to="/agregar" className="btn-primary">Agregar primer lugar</Link>
          </div>
        </section>
      )}
    </div>
  )
}
