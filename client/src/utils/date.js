export function formatDate(isoDate) {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isOverdue(isoDate, completed) {
  if (!isoDate || completed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${isoDate}T00:00:00`) < today
}
