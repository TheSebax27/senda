import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Star, RotateCcw, Calendar, DollarSign, Pencil, Trash2, User } from 'lucide-react'
import { usePlaces } from '../context/PlacesContext'
import { useAuth } from '../context/AuthContext'
import { typeLabel, formatDate, priceLabel } from '../lib/utils'
import type { Rating } from '../types'
import './PlaceDetail.css'

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className={`star-pick-btn ${n <= (hover || value) ? 'active' : ''}`}
        >
          <Star size={22} fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

// Modal de confirmación para eliminar el lugar completo
function DeletePlaceModal({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🗑️</div>
        <h3 className="modal-title">¿Eliminar esta huella?</h3>
        <p className="modal-desc">
          Vas a eliminar <strong>{name}</strong> de vuestra senda. Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="modal-btn-confirm" onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  )
}

export function PlaceDetail() {
  const { id } = useParams()
  const { places, getRatings, upsertRating, deleteRating, deletePlace } = usePlaces()
  const { user } = useAuth()
  const navigate = useNavigate()

  const place = places.find(p => p.id === id)

  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingsLoading, setRatingsLoading] = useState(true)

  // My rating form
  const myRating = ratings.find(r => r.user_id === user?.id)
  const [myStars, setMyStars] = useState(myRating?.rating || 0)
  const [myComment, setMyComment] = useState(myRating?.comment || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Eliminar lugar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setRatingsLoading(true)
    getRatings(id).then(data => {
      setRatings(data)
      const mine = data.find(r => r.user_id === user?.id)
      if (mine) {
        setMyStars(mine.rating)
        setMyComment(mine.comment || '')
      }
      setRatingsLoading(false)
    })
  }, [id])

  const handleSaveRating = async () => {
    if (!id || myStars === 0) return
    setSaving(true)
    setSaveMsg(null)
    const { error } = await upsertRating(id, myStars, myComment || null)
    if (error) {
      setSaveMsg('Error al guardar: ' + error)
    } else {
      const updated = await getRatings(id)
      setRatings(updated)
      setSaveMsg('¡Calificación guardada!')
      setEditing(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
    setSaving(false)
  }

  const handleDeleteRating = async () => {
    if (!id) return
    await deleteRating(id)
    const updated = await getRatings(id)
    setRatings(updated)
    setMyStars(0)
    setMyComment('')
    setEditing(false)
  }

  const handleDeletePlace = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deletePlace(id)
      navigate('/lugares', { replace: true })
    } catch {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (!place) {
    return (
      <div className="not-found">
        <p>Lugar no encontrado.</p>
        <Link to="/lugares">← Volver a lugares</Link>
      </div>
    )
  }

  const photo = place.photos[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80'
  const othersRatings = ratings.filter(r => r.user_id !== user?.id)
  const hasMyRating = !!myRating && !editing

  return (
    <div className="detail-page">
      {/* Modal de confirmación */}
      {showDeleteModal && (
        <DeletePlaceModal
          name={place.name}
          onConfirm={handleDeletePlace}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Volver
      </button>
      <button
        className="detail-delete-place-btn"
        onClick={() => setShowDeleteModal(true)}
        disabled={deleting}
        title="Eliminar esta huella"
      >
        <Trash2 size={15} />
        {deleting ? 'Eliminando…' : 'Eliminar huella'}
      </button>

      <div className="detail-hero" style={{ backgroundImage: `url(${photo})` }}>
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
                {place.visit_date && <span><Calendar size={13} /> {formatDate(place.visit_date)}</span>}
                {place.price_level > 0 && <span><DollarSign size={13} /> {priceLabel(place.price_level)}</span>}
                {place.would_return && <span className="would-return-badge"><RotateCcw size={11} /> Volveríamos</span>}
              </div>
            </div>

            {place.rating_avg > 0 && (
              <div className="detail-rating-block">
                <div className="detail-rating-avg">
                  <Star size={20} fill="currentColor" />
                  <span>{place.rating_avg.toFixed(1)}</span>
                </div>
                <p>{ratings.length} {ratings.length === 1 ? 'calificación' : 'calificaciones'}</p>
              </div>
            )}
          </div>

          {/* My rating */}
          <section className="detail-section rating-section">
            <h2>Tu calificación</h2>

            {hasMyRating ? (
              <div className="my-rating-display">
                <div className="my-rating-stars">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={18} fill={n <= myRating.rating ? 'currentColor' : 'none'} />
                  ))}
                  <span>{myRating.rating}.0</span>
                </div>
                {myRating.comment && <p className="my-rating-comment">"{myRating.comment}"</p>}
                <div className="my-rating-actions">
                  <button className="rating-edit-btn" onClick={() => setEditing(true)}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button className="rating-delete-btn" onClick={handleDeleteRating}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="rating-form">
                <p className="rating-hint">{myStars === 0 ? 'Toca las estrellas para calificar' : `${myStars} de 5`}</p>
                <StarPicker value={myStars} onChange={setMyStars} />
                <textarea
                  className="rating-comment-input"
                  placeholder="¿Qué te pareció? (opcional)"
                  value={myComment}
                  onChange={e => setMyComment(e.target.value)}
                  rows={2}
                />
                {saveMsg && (
                  <div className={`rating-save-banner ${saveMsg.startsWith('Error') ? 'error' : 'ok'}`}>
                    {saveMsg}
                  </div>
                )}
                <button
                  className="btn-save-rating"
                  onClick={handleSaveRating}
                  disabled={myStars === 0 || saving}
                >
                  {saving ? <span className="auth-spinner" /> : '✦ Guardar calificación'}
                </button>
              </div>
            )}

            {editing && (
              <div className="rating-form">
                <p className="rating-hint">{myStars === 0 ? 'Toca las estrellas para calificar' : `${myStars} de 5`}</p>
                <StarPicker value={myStars} onChange={setMyStars} />
                <textarea
                  className="rating-comment-input"
                  placeholder="¿Qué te pareció? (opcional)"
                  value={myComment}
                  onChange={e => setMyComment(e.target.value)}
                  rows={2}
                />
                {saveMsg && (
                  <div className={`rating-save-banner ${saveMsg.startsWith('Error') ? 'error' : 'ok'}`}>
                    {saveMsg}
                  </div>
                )}
                <div className="rating-form-actions">
                  <button className="btn-save-rating" onClick={handleSaveRating} disabled={myStars === 0 || saving}>
                    {saving ? <span className="auth-spinner" /> : 'Actualizar'}
                  </button>
                  <button className="btn-cancel-rating" onClick={() => { setEditing(false); setMyStars(myRating?.rating || 0); setMyComment(myRating?.comment || '') }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Other ratings */}
          {!ratingsLoading && othersRatings.length > 0 && (
            <section className="detail-section">
              <h2>Lo que dijeron</h2>
              <div className="ratings-list">
                {othersRatings.map(r => (
                  <div key={r.id} className="rating-card">
                    <div className="rating-card-avatar">
                      {r.profile?.avatar_url
                        ? <div className="rc-avatar" style={{ backgroundImage: `url(${r.profile.avatar_url})` }} />
                        : <div className="rc-avatar rc-avatar-placeholder"><User size={14} /></div>
                      }
                    </div>
                    <div className="rating-card-body">
                      <div className="rating-card-top">
                        <span className="rating-card-name">{r.profile?.display_name || 'Usuario'}</span>
                        <div className="rating-card-stars">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={12} fill={n <= r.rating ? 'currentColor' : 'none'} />
                          ))}
                          <span>{r.rating}.0</span>
                        </div>
                      </div>
                      {r.comment && <p className="rating-card-comment">"{r.comment}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Story */}
          {place.story && (
            <section className="detail-section">
              <h2>Nuestra historia</h2>
              <p className="detail-story">{place.story}</p>
            </section>
          )}
        </div>

        {/* Gallery sidebar */}
        {place.photos.length > 0 && (
          <aside className="detail-gallery">
            <h3>Galería</h3>
            {place.photos.map((p, i) => (
              <div key={i} className="gallery-photo" style={{ backgroundImage: `url(${p})` }} />
            ))}
            {place.tags.length > 0 && (
              <div className="detail-tags">
                {place.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}