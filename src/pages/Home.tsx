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
  const recent = [...visited].sort((a, b) => b.visit_date.localeCompare(a.visit_date)).slice(0, 4)

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-image" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522199710521-72d69614c702?w=1600&q=80)'
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
          <img
            src="https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-74.0721,5.0,4.5,0/900x320@2x?access_token=pk.placeholder"
            alt="Mapa de nuestra senda"
            className="map-fallback-img"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
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

      {/* Highlights */}
      <section className="section highlights">
        <div className="highlight-card" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1583682064285-79b3d7bcf5b5?w=800&q=80)' }}>
          <div className="highlight-overlay" />
          
        </div>
        <div className="highlight-card" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80)' }}>
          <div className="highlight-overlay" />
          
        </div>
        <div className="highlight-card highlight-cta">
          <div className="highlight-cta-content">
            <p>¿A dónde vamos después?</p>
            <Link to="/proximos" className="btn-primary">Ver próximas sendas</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
