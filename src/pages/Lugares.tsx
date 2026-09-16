import { useState } from 'react'
import { Search } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { PlaceCard } from '../components/PlaceCard'
import type { PlaceType } from '../types'
import './Lugares.css'

const filters: { label: string; value: 'all' | PlaceType }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Restaurantes', value: 'restaurante' },
  { label: 'Ciudades', value: 'ciudad' },
  { label: 'Pueblos', value: 'pueblo' },
  { label: 'Hoteles', value: 'hotel' },
  { label: 'Experiencias', value: 'experiencia' },
]

export function Lugares() {
  const { places } = usePlaces()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | PlaceType>('all')

  const visited = places.filter(p => !p.is_planned)

  const filtered = visited.filter(p => {
    const matchType = activeFilter === 'all' || p.type === activeFilter
    const matchQuery = query === '' || 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.city.toLowerCase().includes(query.toLowerCase()) ||
      p.country.toLowerCase().includes(query.toLowerCase())
    return matchType && matchQuery
  })

  return (
    <div className="lugares-page">
      <div className="lugares-header">
        <div className="lugares-header-inner">
          <div>
            <h1 className="lugares-title">Nuestros lugares</h1>
            <p className="lugares-sub">Cada lugar guarda una parte de nuestra historia.</p>
          </div>
          <div className="lugares-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar un lugar..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-bar">
          {filters.map(f => (
            <button
              key={f.value}
              className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lugares-inner">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No encontramos lugares con ese criterio.</p>
          </div>
        ) : (
          <div className="lugares-grid">
            {filtered.map((place, i) => (
              <PlaceCard key={place.id} place={place} size={i === 0 ? 'large' : 'normal'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
