import { taskItemTemplate } from './TaskItem.js'
import { t } from '../utils/i18n.js'

export function renderTaskList(container, tasks, { onToggle, onDelete }) {
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
        <p>${t('emptyState')}</p>
      </div>
    `
    return
  }

  container.innerHTML = `<ul class="task-list">${tasks.map(taskItemTemplate).join('')}</ul>`

  container.querySelectorAll('[data-action="toggle"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      const id = event.target.closest('.task-item').dataset.id
      onToggle(id)
    })
  })

  container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const id = event.target.closest('.task-item').dataset.id
      onDelete(id)
    })
  })
}
