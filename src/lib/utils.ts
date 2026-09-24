export function typeLabel(type: string): string {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function priceLabel(level: number): string {
  return '$'.repeat(Math.max(1, Math.min(4, level)))
}

export function formatDate(dateStr: string, locale = 'es-CO'): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function priorityLabel(p: string | null): string {
  if (p === 'alta') return 'Alta'
  if (p === 'media') return 'Media'
  if (p === 'baja') return 'Baja'
  return ''
}
