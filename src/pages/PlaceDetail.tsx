import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MapPin, Star, RotateCcw, Calendar, DollarSign, Pencil, Trash2, User, RefreshCw, Check, X, ImagePlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePlaces } from '../context/PlacesContext'
import { useAuth } from '../context/AuthContext'
import { typeLabel, formatDate, priceLabel } from '../lib/utils'
import { TypeSelector } from '../components/TypeSelector'
import type { Rating, Revisit, PlaceType } from '../types'
import '../components/shared.css'
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
  const { places, getRatings, upsertRating, deleteRating, deletePlace, updatePlace, getRevisits, addRevisit, deleteRevisit } = usePlaces()
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

  // Revisits
  const [revisits, setRevisits] = useState<Revisit[]>([])
  const [showRevisitForm, setShowRevisitForm] = useState(false)
  const [revisitDate, setRevisitDate] = useState(new Date().toISOString().split('T')[0])
  const [revisitNote, setRevisitNote] = useState('')
  const [revisitPhoto, setRevisitPhoto] = useState<File | null>(null)
  const [revisitPhotoPreview, setRevisitPhotoPreview] = useState<string | null>(null)
  const [savingRevisit, setSavingRevisit] = useState(false)
  const [revisitMsg, setRevisitMsg] = useState<string | null>(null)
  const revisitPhotoRef = useRef<HTMLInputElement>(null)

  // Editar lugar
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    type: '' as PlaceType,
    city: '',
    country: '',
    visit_date: '',
    story: '',
    tags: '',
    price_level: 2,
    would_return: null as boolean | null,
    lat: null as number | null,
    lng: null as number | null,
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Eliminar lugar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setRatingsLoading(true)
    Promise.all([getRatings(id), getRevisits(id)]).then(([ratingData, revisitData]) => {
      setRatings(ratingData)
      const mine = ratingData.find(r => r.user_id === user?.id)
      if (mine) {
        setMyStars(mine.rating)
        setMyComment(mine.comment || '')
      }
      setRevisits(revisitData)
      setRatingsLoading(false)
    })
  }, [id])

  const handleRevisitPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setRevisitMsg('La foto supera 10 MB.'); return }
    setRevisitPhoto(file)
    setRevisitPhotoPreview(URL.createObjectURL(file))
  }

  const handleSaveRevisit = async () => {
    if (!id || !revisitDate) return
    setSavingRevisit(true)
    setRevisitMsg(null)

    let photoUrl: string | null = null
    if (revisitPhoto) {
      const ext = revisitPhoto.name.split('.').pop()
      const path = `revisits/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('place-photos')
        .upload(path, revisitPhoto)
      if (!uploadError) {
        const { data } = supabase.storage.from('place-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }
    }

    const { error } = await addRevisit(id, revisitDate, revisitNote || null, photoUrl)
    if (error) {
      setRevisitMsg('Error: ' + error)
    } else {
      const updated = await getRevisits(id)
      setRevisits(updated)
      setShowRevisitForm(false)
      setRevisitNote('')
      setRevisitDate(new Date().toISOString().split('T')[0])
      setRevisitPhoto(null)
      setRevisitPhotoPreview(null)
    }
    setSavingRevisit(false)
  }

  const handleDeleteRevisit = async (revisitId: string) => {
    await deleteRevisit(revisitId)
    setRevisits(prev => prev.filter(r => r.id !== revisitId))
  }

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

  const openEdit = () => {
    setEditForm({
      name: place?.name ?? '',
      type: place?.type ?? '',
      city: place?.city ?? '',
      country: place?.country ?? '',
      visit_date: place?.visit_date ?? '',
      story: place?.story ?? '',
      tags: place?.tags?.join(', ') ?? '',
      price_level: place?.price_level ?? 2,
      would_return: place?.would_return ?? null,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
    })
    setEditError(null)
    setShowEditPanel(true)
  }

  const handleSaveEdit = async () => {
    if (!id || !editForm.name || !editForm.type || !editForm.city) {
      setEditError('Nombre, categoría y ciudad son obligatorios.')
      return
    }
    setSavingEdit(true)
    setEditError(null)
    try {
      await updatePlace(id, {
        name: editForm.name,
        type: editForm.type,
        city: editForm.city,
        country: editForm.country,
        visit_date: editForm.visit_date || null,
        story: editForm.story || null,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        price_level: editForm.price_level,
        would_return: editForm.would_return,
        lat: editForm.lat,
        lng: editForm.lng,
      })
      setShowEditPanel(false)
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar.')
    }
    setSavingEdit(false)
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
      {place.created_by === user?.id && (
        <div className="detail-owner-actions">
          <button
            className="detail-edit-place-btn"
            onClick={openEdit}
            title="Editar este lugar"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            className="detail-delete-place-btn"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            title="Eliminar esta huella"
          >
            <Trash2 size={15} />
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      )}

      <div className="detail-hero" style={{ backgroundImage: `url(${photo})` }}>
        <div className="detail-hero-overlay" />
      </div>

      {/* Edit panel */}
      {showEditPanel && (
        <div className="edit-panel">
          <div className="edit-panel-inner">
            <div className="edit-panel-head">
              <h2 className="edit-panel-title">Editar lugar</h2>
              <button className="edit-panel-close" onClick={() => setShowEditPanel(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="edit-fields">
              <div className="edit-row">
                <div className="edit-group edit-group-lg">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="edit-group">
                <label>Categoría</label>
                <TypeSelector
                  value={editForm.type}
                  onChange={v => setEditForm(p => ({ ...p, type: v }))}
                  existingTypes={[...new Set(places.map(pl => pl.type).filter(Boolean))]}
                />
              </div>

              <div className="edit-row">
                <div className="edit-group">
                  <label>Ciudad</label>
                  <input type="text" value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="edit-group">
                  <label>País</label>
                  <input type="text" value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} />
                </div>
                <div className="edit-group">
                  <label>Fecha de visita</label>
                  <input type="date" value={editForm.visit_date} onChange={e => setEditForm(p => ({ ...p, visit_date: e.target.value }))} />
                </div>
              </div>

              <div className="edit-row">
                <div className="edit-group">
                  <label>Precio</label>
                  <div className="price-selector">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} type="button" className={`price-btn ${editForm.price_level === n ? 'active' : ''}`} onClick={() => setEditForm(p => ({ ...p, price_level: n }))}>
                        {'$'.repeat(n)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="edit-group">
                  <label>¿Volverían?</label>
                  <div className="toggle-group">
                    <button type="button" className={`toggle-btn ${editForm.would_return === true ? 'active' : ''}`} onClick={() => setEditForm(p => ({ ...p, would_return: true }))}>Sí</button>
                    <button type="button" className={`toggle-btn ${editForm.would_return === null ? 'active' : ''}`} onClick={() => setEditForm(p => ({ ...p, would_return: null }))}>Tal vez</button>
                    <button type="button" className={`toggle-btn ${editForm.would_return === false ? 'active' : ''}`} onClick={() => setEditForm(p => ({ ...p, would_return: false }))}>No</button>
                  </div>
                </div>
              </div>

              <div className="edit-group">
                <label>Historia</label>
                <textarea rows={3} value={editForm.story} onChange={e => setEditForm(p => ({ ...p, story: e.target.value }))} placeholder="¿Qué recuerdan de este lugar?" />
              </div>

              <div className="edit-group">
                <label>Etiquetas <span className="edit-hint">(separadas por coma)</span></label>
                <input type="text" value={editForm.tags} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} placeholder="romántico, favorito, tranquilo" />
              </div>

              <div className="edit-row">
                <div className="edit-group">
                  <label>Latitud <span className="edit-hint">(opcional)</span></label>
                  <input type="number" step="any" value={editForm.lat ?? ''} onChange={e => setEditForm(p => ({ ...p, lat: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="4.7110" />
                </div>
                <div className="edit-group">
                  <label>Longitud <span className="edit-hint">(opcional)</span></label>
                  <input type="number" step="any" value={editForm.lng ?? ''} onChange={e => setEditForm(p => ({ ...p, lng: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="-74.0721" />
                </div>
              </div>
            </div>

            {editError && <div className="rating-save-banner error">{editError}</div>}

            <div className="edit-panel-footer">
              <button className="btn-save-rating" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <span className="auth-spinner" /> : <><Check size={15} /> Guardar cambios</>}
              </button>
              <button className="btn-cancel-rating" onClick={() => setShowEditPanel(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

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

          {/* Revisits */}
          {!place.is_planned && (
            <section className="detail-section revisit-section">
              <div className="revisit-header">
                <div>
                  <h2>Volvimos</h2>
                  <p className="revisit-sub">
                    {revisits.length === 0
                      ? 'Aún no han vuelto a este lugar.'
                      : `Han vuelto ${revisits.length} ${revisits.length === 1 ? 'vez' : 'veces'}.`}
                  </p>
                </div>
                {!showRevisitForm && (
                  <button className="btn-revisit" onClick={() => setShowRevisitForm(true)}>
                    <RefreshCw size={14} /> Marcar revisita
                  </button>
                )}
              </div>

              {showRevisitForm && (
                <div className="revisit-form">
                  <div className="revisit-form-row">
                    <div className="revisit-form-group">
                      <label>Fecha de la visita</label>
                      <input
                        type="date"
                        value={revisitDate}
                        onChange={e => setRevisitDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="revisit-form-group">
                    <label>Nota <span className="revisit-optional">(opcional)</span></label>
                    <input
                      type="text"
                      placeholder="¿Qué recuerdan de esta vez?"
                      value={revisitNote}
                      onChange={e => setRevisitNote(e.target.value)}
                    />
                  </div>
                  <div className="revisit-form-group">
                    <label>Foto <span className="revisit-optional">(opcional)</span></label>
                    {revisitPhotoPreview ? (
                      <div className="revisit-photo-preview">
                        <div className="revisit-photo-thumb" style={{ backgroundImage: `url(${revisitPhotoPreview})` }} />
                        <button
                          type="button"
                          className="revisit-photo-remove"
                          onClick={() => { setRevisitPhoto(null); setRevisitPhotoPreview(null) }}
                        >
                          <X size={13} /> Quitar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="revisit-photo-btn"
                        onClick={() => revisitPhotoRef.current?.click()}
                      >
                        <ImagePlus size={15} /> Agregar foto
                      </button>
                    )}
                    <input
                      ref={revisitPhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={handleRevisitPhoto}
                      hidden
                    />
                  </div>
                  {revisitMsg && (
                    <div className="rating-save-banner error">{revisitMsg}</div>
                  )}
                  <div className="revisit-form-actions">
                    <button
                      className="btn-save-rating"
                      onClick={handleSaveRevisit}
                      disabled={!revisitDate || savingRevisit}
                    >
                      {savingRevisit ? <span className="auth-spinner" /> : '✦ Guardar'}
                    </button>
                    <button
                      className="btn-cancel-rating"
                      onClick={() => {
                        setShowRevisitForm(false)
                        setRevisitMsg(null)
                        setRevisitPhoto(null)
                        setRevisitPhotoPreview(null)
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {revisits.length > 0 && (
                <div className="revisit-list">
                  {revisits.map(r => (
                    <div key={r.id} className="revisit-item">
                      <div className="revisit-dot" />
                      <div className="revisit-content">
                        <div className="revisit-meta">
                          <span className="revisit-date">{formatDate(r.visit_date)}</span>
                          {r.profile && (
                            <span className="revisit-who">{r.profile.display_name}</span>
                          )}
                          <button
                            className="revisit-delete"
                            onClick={() => handleDeleteRevisit(r.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        {r.note && <p className="revisit-note">"{r.note}"</p>}
                        {r.photo_url && (
                          <div className="revisit-photo-display" style={{ backgroundImage: `url(${r.photo_url})` }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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