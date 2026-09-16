import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Upload } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import type { PlaceType, PlaceInsert } from '../types'
import './AgregarLugar.css'

const placeTypes: { value: PlaceType; label: string }[] = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'ciudad', label: 'Ciudad' },
  { value: 'pueblo', label: 'Pueblo' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'experiencia', label: 'Experiencia' },
]

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= (hover || value) ? 'active' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star size={20} fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="star-value">{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  )
}

export function AgregarLugar() {
  const { addPlace } = usePlaces()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    type: '' as PlaceType | '',
    city: '',
    country: 'Colombia',
    visit_date: '',
    rating_him: 0,
    rating_her: 0,
    price_level: 2,
    would_return: null as boolean | null,
    story: '',
    comment_him: '',
    comment_her: '',
    lat: null as number | null,
    lng: null as number | null,
    tags: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.city) return
    const avg = form.rating_him > 0 && form.rating_her > 0
      ? (form.rating_him + form.rating_her) / 2
      : form.rating_him || form.rating_her

    const payload: PlaceInsert = {
      name: form.name,
      type: form.type as PlaceType,
      city: form.city,
      country: form.country,
      visit_date: form.visit_date,
      rating_him: form.rating_him,
      rating_her: form.rating_her,
      rating_avg: avg,
      price_level: form.price_level,
      would_return: form.would_return,
      story: form.story || null,
      comment_him: form.comment_him || null,
      comment_her: form.comment_her || null,
      lat: form.lat,
      lng: form.lng,
      photos: [],
      is_favorite: false,
      is_planned: false,
      priority: null,
      budget: null,
      planned_year: null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    await addPlace(payload)
    setSubmitted(true)
    setTimeout(() => navigate('/lugares'), 1200)
  }

  if (submitted) {
    return (
      <div className="agregar-success">
        <div className="success-icon">✦</div>
        <h2>¡Huella guardada!</h2>
        <p>Tu recuerdo ha sido añadido a la senda.</p>
      </div>
    )
  }

  return (
    <div className="agregar-page">
      <div className="agregar-inner">
        <div className="agregar-header">
          <span className="agregar-eyebrow">Nueva huella</span>
          <h1 className="agregar-title">Guarda otro momento de nuestra senda.</h1>
        </div>

        <div className="agregar-form">
          {/* Basic info */}
          <div className="form-section">
            <h3>¿Dónde estuvieron?</h3>
            <div className="form-row">
              <div className="form-group flex-2">
                <label>Nombre del lugar</label>
                <input
                  type="text"
                  placeholder="Ej. La Trattoria"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as PlaceType }))}>
                  <option value="">Selecciona un tipo</option>
                  {placeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ciudad</label>
                <input type="text" placeholder="Bogotá" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>País</label>
                <input type="text" placeholder="Colombia" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Fecha de visita</label>
                <input type="date" value={form.visit_date} onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="form-section">
            <h3>¿Cómo lo calificaron?</h3>
            <div className="form-row ratings-row">
              <div className="form-group">
                <label>
                  <div className="label-avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80)' }} />
                  Calificación de él
                </label>
                <StarRating value={form.rating_him} onChange={v => setForm(p => ({ ...p, rating_him: v }))} />
              </div>
              <div className="form-group">
                <label>
                  <div className="label-avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80)' }} />
                  Calificación de ella
                </label>
                <StarRating value={form.rating_her} onChange={v => setForm(p => ({ ...p, rating_her: v }))} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio aproximado</label>
                <div className="price-selector">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`price-btn ${form.price_level === n ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, price_level: n }))}
                    >
                      {'$'.repeat(n)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>¿Volverían?</label>
                <div className="toggle-group">
                  <button type="button" className={`toggle-btn ${form.would_return === true ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, would_return: true }))}>Sí</button>
                  <button type="button" className={`toggle-btn ${form.would_return === null ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, would_return: null }))}>Tal vez</button>
                  <button type="button" className={`toggle-btn ${form.would_return === false ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, would_return: false }))}>No</button>
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="form-section">
            <h3>Fotografías</h3>
            <div className="photo-upload">
              <Upload size={20} />
              <p>Arrastra fotos aquí o haz clic para seleccionar</p>
              <span>Las fotos se subirán a Supabase Storage</span>
            </div>
          </div>

          {/* Story */}
          <div className="form-section">
            <h3>Nuestra historia</h3>
            <div className="form-group">
              <label>¿Qué recuerdan de este lugar?</label>
              <textarea
                rows={4}
                placeholder="Cuéntanos la historia de este lugar..."
                value={form.story}
                onChange={e => setForm(p => ({ ...p, story: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Lo que dijo él</label>
                <input type="text" placeholder='"Una experiencia que repetiría."' value={form.comment_him} onChange={e => setForm(p => ({ ...p, comment_him: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Lo que dijo ella</label>
                <input type="text" placeholder='"Quiero volver."' value={form.comment_her} onChange={e => setForm(p => ({ ...p, comment_her: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Etiquetas <span className="hint">(separadas por coma)</span></label>
              <input type="text" placeholder="playa, romántico, favorito" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
          </div>

          <button
            className="btn-save"
            onClick={handleSubmit}
            disabled={!form.name || !form.type || !form.city}
          >
            ✦ Guardar huella
          </button>
        </div>
      </div>
    </div>
  )
}
