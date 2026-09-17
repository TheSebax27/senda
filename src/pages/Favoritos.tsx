import { Link } from 'react-router-dom'
import { Star, Trophy } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import type { PlaceType } from '../types'
import './Favoritos.css'

function getBest(places: ReturnType<typeof usePlaces>['places'], type: PlaceType | null) {
  const pool = type ? places.filter(p => p.type === type && !p.is_planned) : places.filter(p => !p.is_planned)
  return [...pool].sort((a, b) => b.rating_avg - a.rating_avg)[0] || null
}

const rankings = [
  { emoji: '🏆', label: 'Mejor restaurante', type: 'restaurante' as PlaceType },
  { emoji: '🏆', label: 'Mejor viaje', type: 'ciudad' as PlaceType },
  { emoji: '🏆', label: 'Mejor ciudad', type: 'ciudad' as PlaceType },
  { emoji: '🏆', label: 'Mejor pueblo', type: 'pueblo' as PlaceType },
  { emoji: '🏆', label: 'Mejor hotel', type: 'hotel' as PlaceType },
  { emoji: '🏆', label: 'Mejor experiencia', type: 'experiencia' as PlaceType },
]

export function Favoritos() {
  const { places } = usePlaces()
  const visited = places.filter(p => !p.is_planned)

  const top = [...visited].sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 3)
  const worst = [...visited].filter(p => p.rating_avg > 0).sort((a, b) => a.rating_avg - b.rating_avg).slice(0, 3)
  const returnPlaces = visited.filter(p => p.would_return).slice(0, 3)

  return (
    <div className="favoritos-page">
      <div className="favoritos-inner">
        <div className="fav-header">
          <h1 className="fav-title">Nuestros favoritos</h1>
          <p className="fav-sub">Los lugares que más nos han marcado.</p>
        </div>

        {/* Top 3 podium */}
        <section className="fav-section">
          <div className="podium">
            {top[1] && (
              <Link to={`/lugares/${top[1].id}`} className="podium-item silver">
                <div className="podium-photo" style={{ backgroundImage: `url(${top[1].photos[0]})` }} />
                <div className="podium-medal">🥈</div>
                <h3>{top[1].name}</h3>
                <div className="podium-rating"><Star size={12} fill="currentColor" /> {top[1].rating_avg.toFixed(1)}</div>
                <div className="podium-bar silver" style={{ height: '90px' }} />
              </Link>
            )}
            {top[0] && (
              <Link to={`/lugares/${top[0].id}`} className="podium-item gold">
                <div className="podium-photo" style={{ backgroundImage: `url(${top[0].photos[0]})` }} />
                <div className="podium-medal">🥇</div>
                <h3>{top[0].name}</h3>
                <div className="podium-rating"><Star size={12} fill="currentColor" /> {top[0].rating_avg.toFixed(1)}</div>
                <div className="podium-bar gold" style={{ height: '120px' }} />
              </Link>
            )}
            {top[2] && (
              <Link to={`/lugares/${top[2].id}`} className="podium-item bronze">
                <div className="podium-photo" style={{ backgroundImage: `url(${top[2].photos[0]})` }} />
                <div className="podium-medal">🥉</div>
                <h3>{top[2].name}</h3>
                <div className="podium-rating"><Star size={12} fill="currentColor" /> {top[2].rating_avg.toFixed(1)}</div>
                <div className="podium-bar bronze" style={{ height: '70px' }} />
              </Link>
            )}
          </div>
        </section>

        {/* Rankings by category */}
        <section className="fav-section">
          <h2 className="fav-section-title">Por categoría</h2>
          <div className="rankings-grid">
            {rankings.map((r) => {
              const best = getBest(places, r.type)
              if (!best) return null
              return (
                <Link key={r.label} to={`/lugares/${best.id}`} className="ranking-card">
                  <div className="ranking-photo" style={{ backgroundImage: `url(${best.photos[0]})` }}>
                    <div className="ranking-overlay" />
                    <Trophy size={14} className="ranking-trophy" />
                  </div>
                  <div className="ranking-body">
                    <span className="ranking-label">{r.label}</span>
                    <h3>{best.name}</h3>
                    <div className="ranking-rating"><Star size={11} fill="currentColor" /> {best.rating_avg.toFixed(1)}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Would return */}
        {returnPlaces.length > 0 && (
          <section className="fav-section">
            <h2 className="fav-section-title">Volveríamos ✦</h2>
            <div className="return-list">
              {returnPlaces.map(p => (
                <Link key={p.id} to={`/lugares/${p.id}`} className="return-item">
                  <div className="return-photo" style={{ backgroundImage: `url(${p.photos[0]})` }} />
                  <div className="return-body">
                    <h3>{p.name}</h3>
                    <span>{p.city}, {p.country}</span>
                  </div>
                  <div className="return-rating"><Star size={12} fill="currentColor" /> {p.rating_avg.toFixed(1)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Worst */}
        {worst.length > 0 && (
          <section className="fav-section">
            <h2 className="fav-section-title">No volveríamos 😅</h2>
            <p className="fav-section-sub">Los que nos dejaron con ganas de más…</p>
            <div className="worst-list">
              {worst.map(p => (
                <Link key={p.id} to={`/lugares/${p.id}`} className="worst-item">
                  <div className="worst-photo" style={{ backgroundImage: `url(${p.photos[0]})` }} />
                  <div className="worst-body">
                    <h3>{p.name}</h3>
                    <span>{p.city}</span>
                    <div className="worst-rating"><Star size={11} fill="currentColor" /> {p.rating_avg.toFixed(1)}</div>
                  </div>

                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
