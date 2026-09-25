import { useState } from 'react'
import { Plus, X, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useNotas } from '../context/NotasContext'
import { useAuth } from '../context/AuthContext'
import type { Note } from '../types'
import './Notas.css'

function formatNoteDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

interface NoteFormState {
  title: string
  content: string
  note_date: string
}

const emptyForm: NoteFormState = { title: '', content: '', note_date: '' }

export function Notas() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotas()
  const { user } = useAuth()

  const [panelOpen, setPanelOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [form, setForm] = useState<NoteFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openCreate = () => {
    setEditingNote(null)
    setForm(emptyForm)
    setError(null)
    setPanelOpen(true)
  }

  const openEdit = (note: Note) => {
    setEditingNote(note)
    setForm({
      title: note.title,
      content: note.content,
      note_date: note.note_date || '',
    })
    setError(null)
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setEditingNote(null)
    setForm(emptyForm)
    setError(null)
  }

  const handleSave = async () => {
    setError(null)
    if (!form.title.trim()) { setError('El título es obligatorio.'); return }
    if (!form.content.trim()) { setError('El contenido no puede estar vacío.'); return }

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      note_date: form.note_date || null,
      created_by: user?.id ?? null,
    }

    let result: { error: string | null }
    if (editingNote) {
      result = await updateNote(editingNote.id, payload)
    } else {
      result = await addNote(payload)
    }

    setSaving(false)
    if (result.error) { setError(result.error); return }
    closePanel()
  }

  const handleDelete = async (id: string) => {
    await deleteNote(id)
    setConfirmDelete(null)
    if (editingNote?.id === id) closePanel()
  }

  const set = (key: keyof NoteFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="notas-page">
      <div className="notas-inner">
        <div className="notas-header">
          <div>
            <span className="notas-eyebrow">Memorias escritas</span>
            <h1 className="notas-title">Notas de viaje</h1>
          </div>
          <button className="btn-new-note" onClick={openCreate}>
            <Plus size={16} /> Nueva nota
          </button>
        </div>

        {loading ? (
          <div className="notas-grid">
            {[1, 2, 3].map(i => <div key={i} className="note-skeleton" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="notas-empty">
            <BookOpen size={32} />
            <p>Todavía no hay notas escritas. Las ideas, recuerdos y reflexiones de sus viajes pueden vivir aquí.</p>
            <button className="btn-new-note" onClick={openCreate}>
              <Plus size={15} /> Escribir la primera nota
            </button>
          </div>
        ) : (
          <div className="notas-grid">
            {notes.map(note => (
              <article key={note.id} className="note-card">
                <div className="note-card-top">
                  {note.note_date && (
                    <span className="note-date">{formatNoteDate(note.note_date)}</span>
                  )}
                  {note.profile && (
                    <div className="note-author">
                      {note.profile.avatar_url
                        ? <div className="note-avatar" style={{ backgroundImage: `url(${note.profile.avatar_url})` }} />
                        : <div className="note-avatar note-avatar-placeholder">
                            {note.profile.display_name?.[0]?.toUpperCase() || '?'}
                          </div>
                      }
                      <span>{note.profile.display_name}</span>
                    </div>
                  )}
                </div>

                <h2 className="note-title">{note.title}</h2>
                <p className="note-excerpt">{note.content}</p>

                {note.created_by === user?.id && (
                  <div className="note-actions">
                    <button className="note-btn-edit" onClick={() => openEdit(note)}>
                      <Pencil size={13} /> Editar
                    </button>
                    {confirmDelete === note.id ? (
                      <div className="note-confirm-delete">
                        <span>¿Eliminar?</span>
                        <button onClick={() => handleDelete(note.id)}>Sí</button>
                        <button onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button className="note-btn-delete" onClick={() => setConfirmDelete(note.id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Panel */}
      {panelOpen && (
        <div className="note-panel-overlay" onClick={closePanel}>
          <div className="note-panel" onClick={e => e.stopPropagation()}>
            <div className="note-panel-head">
              <h3>{editingNote ? 'Editar nota' : 'Nueva nota'}</h3>
              <button className="note-panel-close" onClick={closePanel}><X size={18} /></button>
            </div>

            <div className="note-panel-body">
              <div className="note-field">
                <label>Fecha <span className="hint">(opcional)</span></label>
                <input type="date" value={form.note_date} onChange={set('note_date')} />
              </div>
              <div className="note-field">
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ej. La noche que nos perdimos en el centro"
                  value={form.title}
                  onChange={set('title')}
                />
              </div>
              <div className="note-field">
                <label>Contenido</label>
                <textarea
                  rows={10}
                  placeholder="Escribe lo que quieras recordar..."
                  value={form.content}
                  onChange={set('content')}
                />
              </div>

              {error && <p className="note-error">{error}</p>}
            </div>

            <div className="note-panel-footer">
              {editingNote && editingNote.created_by === user?.id && (
                confirmDelete === editingNote.id ? (
                  <div className="note-confirm-delete">
                    <span>¿Eliminar esta nota?</span>
                    <button onClick={() => handleDelete(editingNote.id)}>Sí, eliminar</button>
                    <button onClick={() => setConfirmDelete(null)}>Cancelar</button>
                  </div>
                ) : (
                  <button className="note-btn-delete-panel" onClick={() => setConfirmDelete(editingNote.id)}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                )
              )}
              <button className="note-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <span className="auth-spinner" style={{ borderTopColor: 'var(--ivory)' }} /> : '✦ Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
