import { t } from '../utils/i18n.js'

export const StatusFilter = { ALL: 'all', ACTIVE: 'active', COMPLETED: 'completed' }
export const SortOption = { CREATED: 'created', DUE: 'due', PRIORITY: 'priority' }

const STATUS_KEYS = {
  [StatusFilter.ALL]: 'statusAll',
  [StatusFilter.ACTIVE]: 'statusActive',
  [StatusFilter.COMPLETED]: 'statusCompleted',
}

export function renderFilterBar(container, state, { onChange, onClearCompleted }) {
  container.innerHTML = `
    <div class="filter-bar">
      <input
        type="search"
        class="search-input"
        placeholder="${t('searchPlaceholder')}"
        value="${state.search}"
        aria-label="${t('searchLabel')}"
      />
      <div class="filter-group" role="group" aria-label="${t('statusGroupLabel')}">
        ${Object.entries(STATUS_KEYS)
          .map(
            ([value, key]) =>
              `<button type="button" class="filter-btn ${state.status === value ? 'is-active' : ''}" data-status="${value}">${t(key)}</button>`
          )
          .join('')}
      </div>
      <select class="sort-select" aria-label="${t('sortLabel')}">
        <option value="created" ${state.sort === 'created' ? 'selected' : ''}>${t('sortCreated')}</option>
        <option value="due" ${state.sort === 'due' ? 'selected' : ''}>${t('sortDue')}</option>
        <option value="priority" ${state.sort === 'priority' ? 'selected' : ''}>${t('sortPriority')}</option>
      </select>
      <button type="button" class="btn btn-ghost" data-action="clear-completed">${t('clearCompleted')}</button>
    </div>
  `

  container.querySelector('.search-input').addEventListener('input', (event) => {
    onChange({ search: event.target.value })
  })

  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => onChange({ status: btn.dataset.status }))
  })

  container.querySelector('.sort-select').addEventListener('change', (event) => {
    onChange({ sort: event.target.value })
  })

  container.querySelector('[data-action="clear-completed"]').addEventListener('click', onClearCompleted)
}
