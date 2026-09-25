import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DEFAULT_PLACE_TYPES } from '../types'
import type { PlaceType } from '../types'

export function TypeSelector({ value, onChange, existingTypes }: {
  value: PlaceType
  onChange: (v: PlaceType) => void
  existingTypes: PlaceType[]
}) {
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const allTypes = [...new Set([...DEFAULT_PLACE_TYPES, ...existingTypes])]

  const handleCustomSubmit = () => {
    const val = custom.trim().toLowerCase()
    if (!val) return
    onChange(val)
    setCustom('')
    setShowCustom(false)
  }

  return (
    <div className="type-selector">
      <div className="type-chips">
        {allTypes.map(t => (
          <button
            key={t}
            type="button"
            className={`type-chip ${value === t ? 'active' : ''}`}
            onClick={() => onChange(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button
          type="button"
          className={`type-chip type-chip-add ${showCustom ? 'active' : ''}`}
          onClick={() => { setShowCustom(v => !v); setCustom('') }}
          title="Agregar tipo personalizado"
        >
          <Plus size={13} /> Otro
        </button>
      </div>
      {showCustom && (
        <div className="type-custom-row">
          <input
            type="text"
            className="type-custom-input"
            placeholder="Ej. mirador, galería, parque…"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit() } }}
            autoFocus
          />
          <button type="button" className="type-custom-confirm" onClick={handleCustomSubmit} disabled={!custom.trim()}>
            Agregar
          </button>
        </div>
      )}
      {value && !allTypes.includes(value) && (
        <p className="type-selected-custom">Tipo: <strong>{value}</strong></p>
      )}
    </div>
  )
}
