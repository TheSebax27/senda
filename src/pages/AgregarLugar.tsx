import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Upload, X, ImagePlus } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
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
          <Star size={22} fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="star-value">{value > 0 ? `${value}.0` : '—'}</span>
    </div>
  )
}

export function AgregarLugar() {
  const { upsertRating } = usePlaces()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    type: '' as PlaceType | '',
    city: '',
    country: 'Colombia',
    visit_date: '',
    myRating: 0,
    myComment: '',
    price_level: 2,
    would_return: null as boolean | null,
    story: '',
    lat: null as number | null,
    lng: null as number | null,
    tags: '',
  })

  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024)
    if (valid.length < files.length) setError('Algunas fotos superan 10MB y fueron ignoradas.')
    setPhotos(prev => [...prev, ...valid].slice(0, 6))
    setPhotoPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))].slice(0, 6))
  }

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const uploadPhotos = async (placeId: string): Promise<string[]> => {
    const urls: string[] = []
    for (const file of photos) {
      const ext = file.name.split('.').pop()
      const path = `${placeId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('place-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('place-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async () => {
    setError(null)
    if (!form.name || !form.type || !form.city) {
      setError('Nombre, tipo y ciudad son obligatorios.')
      return
    }

    setUploading(true)
    try {
      // Insert place first (sin fotos) para obtener el id
      const payload: PlaceInsert = {
        name: form.name,
        type: form.type as PlaceType,
        city: form.city,
        country: form.country,
        visit_date: form.visit_date || null,
        price_level: form.price_level,
        would_return: form.would_return,
        story: form.story || null,
        lat: form.lat,
        lng: form.lng,
        photos: [],
        is_favorite: false,
        is_planned: false,
        priority: null,
        budget: null,
        planned_year: null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        created_by: user?.id ?? null,
      }

      // Insert and get id
      const { data: newPlace, error: insertError } = await supabase
        .from('places')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError

      // Upload photos
      let photoUrls: string[] = []
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(newPlace.id)
        if (photoUrls.length > 0) {
          await supabase.from('places').update({ photos: photoUrls }).eq('id', newPlace.id)
          newPlace.photos = photoUrls
        }
      }

      // Save my rating if provided
      if (form.myRating > 0) {
        await upsertRating(newPlace.id, form.myRating, form.myComment || null)
      }

      setSubmitted(true)
      setTimeout(() => navigate(`/lugares/${newPlace.id}`), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el lugar.')
    } finally {
      setUploading(false)
    }
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
          {/* Lugar */}
          <div className="form-section">
            <h3>¿Dónde estuvieron?</h3>
            <div className="form-row">
              <div className="form-group flex-2">
                <label>Nombre del lugar</label>
                <input type="text" placeholder="Ej. La Trattoria" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
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

          {/* Mi calificación */}
          <div className="form-section">
            <h3>Tu calificación</h3>
            <div className="my-rating-row">
              {profile?.avatar_url
                ? <div className="form-user-avatar" style={{ backgroundImage: `url(${profile.avatar_url})` }} />
                : <div className="form-user-avatar form-user-avatar-placeholder">
                    <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                  </div>
              }
              <div>
                <p className="form-user-name">{profile?.display_name || 'Tú'}</p>
                <StarRating value={form.myRating} onChange={v => setForm(p => ({ ...p, myRating: v }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.875rem' }}>
              <label>Tu comentario <span className="hint">(opcional)</span></label>
              <input
                type="text"
                placeholder='"Una experiencia que repetiría."'
                value={form.myComment}
                onChange={e => setForm(p => ({ ...p, myComment: e.target.value }))}
              />
            </div>
            <p className="rating-note">El otro integrante puede agregar su calificación desde la página del lugar.</p>

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Precio aproximado</label>
                <div className="price-selector">
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} type="button" className={`price-btn ${form.price_level === n ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, price_level: n }))}>
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

          {/* Fotos */}
          <div className="form-section">
            <h3>Fotografías</h3>
            {photoPreviews.length > 0 && (
              <div className="photo-grid">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="photo-thumb" style={{ backgroundImage: `url(${src})` }}>
                    <button className="photo-remove" type="button" onClick={() => removePhoto(i)}><X size={12} /></button>
                  </div>
                ))}
                {photoPreviews.length < 6 && (
                  <button type="button" className="photo-add-more" onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={20} />
                  </button>
                )}
              </div>
            )}
            {photoPreviews.length === 0 && (
              <div className="photo-upload" onClick={() => fileRef.current?.click()}>
                <Upload size={20} />
                <p>Toca para agregar fotos</p>
                <span>JPG, PNG · máx. 10 MB por foto · hasta 6 fotos</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} hidden />
          </div>

          {/* Historia */}
          <div className="form-section">
            <h3>Nuestra historia</h3>
            <div className="form-group">
              <label>¿Qué recuerdan de este lugar? <span className="hint">(opcional)</span></label>
              <textarea rows={4} placeholder="Cuéntanos la historia de este lugar..." value={form.story} onChange={e => setForm(p => ({ ...p, story: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Etiquetas <span className="hint">(separadas por coma)</span></label>
              <input type="text" placeholder="playa, romántico, favorito" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn-save"
            onClick={handleSubmit}
            disabled={!form.name || !form.type || !form.city || uploading}
          >
            {uploading ? <span className="auth-spinner" style={{ borderTopColor: 'var(--ivory)' }} /> : '✦ Guardar huella'}
          </button>
        </div>
      </div>
    </div>
  )
}
