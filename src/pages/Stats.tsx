import { useState, useEffect } from 'react'
import { MapPin, Globe, Star, Heart, TrendingUp, RotateCcw, Calendar } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { supabase } from '../lib/supabase'
import './Stats.css'

export function Stats() {
  const { places, loading } = usePlaces()
  const [revisitCounts, setRevisitCounts] = useState<Record<string, number>>({})
  const [loadingRevisits, setLoadingRevisits] = useState(true)

  useEffect(() => {
    supabase.from('revisits').select('place_id').then(({ data }) => {
      if (data) {
        const counts: Record<string, number> = {}
        data.forEach(r => { counts[r.place_id] = (counts[r.place_id] || 0) + 1 })
        setRevisitCounts(counts)
      }
      setLoadingRevisits(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-inner">
          <div className="stats-skeleton-header" />
          <div className="stats-skeleton-grid" />
        </div>
      </div>
    )
  }

  const visited = places.filter(p => !p.is_planned)
  const totalVisited = visited.length
  const totalPlanned = places.filter(p => p.is_planned).length
  const cities = new Set(visited.map(p => p.city).filter(Boolean)).size
  const countries = new Set(visited.map(p => p.country).filter(Boolean)).size
  const favorites = visited.filter(p => p.is_favorite).length
  const wouldReturn = visited.filter(p => p.would_return === true).length

  const ratedPlaces = visited.filter(p => p.rating_avg > 0)
  const avgRating = ratedPlaces.length > 0
    ? ratedPlaces.reduce((sum, p) => sum + p.rating_avg, 0) / ratedPlaces.length
    : 0

  const typeCounts: Record<string, number> = {}
  visited.forEach(p => {
    if (p.type) typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
  })
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxTypeCount = sortedTypes[0]?.[1] || 1

  const mostRevisitedId = Object.entries(revisitCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostRevisited = mostRevisitedId ? places.find(p => p.id === mostRevisitedId) : null
  const mostRevisitedCount = mostRevisitedId ? revisitCounts[mostRevisitedId] : 0

  const firstPlace = [...visited]
    .filter(p => p.visit_date)
    .sort((a, b) => (a.visit_date! < b.visit_date! ? -1 : 1))[0]

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <div className="stats-page">
      <div className="stats-inner">
        <div className="stats-header">
          <span className="stats-eyebrow">Nuestra historia</span>
          <h1 className="stats-title">En números</h1>
        </div>

        {totalVisited === 0 ? (
          <div className="stats-empty">
            <Calendar size={32} />
            <p>Todavía no hay huellas que contar. El primer lugar marcará el inicio de esta historia.</p>
          </div>
        ) : (
          <>
            <div className="stats-grid-main">
              <div className="stat-card stat-featured">
                <span className="stat-number">{totalVisited}</span>
                <span className="stat-label">
                  <MapPin size={13} />
                  {totalVisited === 1 ? 'lugar visitado' : 'lugares visitados'}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{cities}</span>
                <span className="stat-label">{cities === 1 ? 'ciudad' : 'ciudades'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{countries}</span>
                <span className="stat-label">
                  <Globe size={13} />
                  {countries === 1 ? 'país' : 'países'}
                </span>
              </div>
            </div>

            <div className="stats-grid-secondary">
              <div className="stat-card-sm">
                <Star size={15} className="stat-icon" />
                <div className="stat-sm-body">
                  <span className="stat-number-sm">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                  <span className="stat-label-sm">promedio calificaciones</span>
                </div>
              </div>
              <div className="stat-card-sm">
                <Heart size={15} className="stat-icon" />
                <div className="stat-sm-body">
                  <span className="stat-number-sm">{favorites}</span>
                  <span className="stat-label-sm">favoritos</span>
                </div>
              </div>
              <div className="stat-card-sm">
                <RotateCcw size={15} className="stat-icon" />
                <div className="stat-sm-body">
                  <span className="stat-number-sm">{wouldReturn}</span>
                  <span className="stat-label-sm">volveríamos</span>
                </div>
              </div>
              <div className="stat-card-sm">
                <TrendingUp size={15} className="stat-icon" />
                <div className="stat-sm-body">
                  <span className="stat-number-sm">{totalPlanned}</span>
                  <span className="stat-label-sm">en la lista de deseos</span>
                </div>
              </div>
            </div>

            {sortedTypes.length > 0 && (
              <div className="stats-section">
                <h2 className="stats-section-title">Por tipo de lugar</h2>
                <div className="type-bars">
                  {sortedTypes.map(([type, count]) => (
                    <div key={type} className="type-bar-row">
                      <span className="type-bar-label">{capitalize(type)}</span>
                      <div className="type-bar-track">
                        <div
                          className="type-bar-fill"
                          style={{ width: `${(count / maxTypeCount) * 100}%` }}
                        />
                      </div>
                      <span className="type-bar-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="stats-notable-grid">
              {firstPlace && (
                <div className="notable-card">
                  {firstPlace.photos?.[0] && (
                    <div
                      className="notable-photo"
                      style={{ backgroundImage: `url(${firstPlace.photos[0]})` }}
                    />
                  )}
                  <div className="notable-body">
                    <span className="notable-eyebrow">Primera huella</span>
                    <p className="notable-name">{firstPlace.name}</p>
                    <p className="notable-sub">{firstPlace.city} · {formatDate(firstPlace.visit_date!)}</p>
                  </div>
                </div>
              )}
              {!loadingRevisits && mostRevisited && mostRevisitedCount > 0 && (
                <div className="notable-card">
                  {mostRevisited.photos?.[0] && (
                    <div
                      className="notable-photo"
                      style={{ backgroundImage: `url(${mostRevisited.photos[0]})` }}
                    />
                  )}
                  <div className="notable-body">
                    <span className="notable-eyebrow">Más revisitado</span>
                    <p className="notable-name">{mostRevisited.name}</p>
                    <p className="notable-sub">
                      {mostRevisited.city} · {mostRevisitedCount} {mostRevisitedCount === 1 ? 'visita extra' : 'visitas extra'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
