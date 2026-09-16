export const StatusFilter = { ALL: 'all', ACTIVE: 'active', COMPLETED: 'completed' }
export const SortOption = { CREATED: 'created', DUE: 'due', PRIORITY: 'priority' }

const STATUS_LABELS = {
  [StatusFilter.ALL]: 'Toutes',
  [StatusFilter.ACTIVE]: 'Actives',
  [StatusFilter.COMPLETED]: 'Terminées',
}

export function renderFilterBar(container, state, { onChange, onClearCompleted }) {
  container.innerHTML = `
    <div class="filter-bar">
      <input
        type="search"
        class="search-input"
        placeholder="Rechercher une tâche…"
        value="${state.search}"
        aria-label="Rechercher"
      />
      <div class="filter-group" role="group" aria-label="Filtrer par statut">
        ${Object.entries(STATUS_LABELS)
          .map(
            ([value, label]) =>
              `<button type="button" class="filter-btn ${state.status === value ? 'is-active' : ''}" data-status="${value}">${label}</button>`
          )
          .join('')}
      </div>
      <select class="sort-select" aria-label="Trier par">
        <option value="created" ${state.sort === 'created' ? 'selected' : ''}>Plus récentes</option>
        <option value="due" ${state.sort === 'due' ? 'selected' : ''}>Échéance</option>
        <option value="priority" ${state.sort === 'priority' ? 'selected' : ''}>Priorité</option>
      </select>
      <button type="button" class="btn btn-ghost" data-action="clear-completed">Effacer les terminées</button>
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
