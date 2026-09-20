import { t } from '../utils/i18n.js'

export function renderStatsBar(container, tasks) {
  const total = tasks.length
  const completed = tasks.filter((task) => task.completed).length
  const active = total - completed

  container.innerHTML = `
    <div class="stats-bar" aria-live="polite">
      <div class="stat-card is-total">
        <span class="stat-value">${total}</span>
        <span class="stat-label">${t('statTotal')}</span>
      </div>
      <div class="stat-card is-active">
        <span class="stat-value">${active}</span>
        <span class="stat-label">${t(active > 1 ? 'statActivePlural' : 'statActive')}</span>
      </div>
      <div class="stat-card is-completed">
        <span class="stat-value">${completed}</span>
        <span class="stat-label">${t(completed > 1 ? 'statCompletedPlural' : 'statCompleted')}</span>
      </div>
    </div>
  `
}
