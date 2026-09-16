export function renderStatsBar(container, tasks) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length
  const active = total - completed

  container.innerHTML = `
    <div class="stats-bar" aria-live="polite">
      <div class="stat-card is-total">
        <span class="stat-value">${total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card is-active">
        <span class="stat-value">${active}</span>
        <span class="stat-label">Active${active > 1 ? 's' : ''}</span>
      </div>
      <div class="stat-card is-completed">
        <span class="stat-value">${completed}</span>
        <span class="stat-label">Terminée${completed > 1 ? 's' : ''}</span>
      </div>
    </div>
  `
}
