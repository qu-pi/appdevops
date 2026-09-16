import { PRIORITY_LABELS } from '../models/Task.js'
import { formatDate, isOverdue } from '../utils/date.js'

export function taskItemTemplate(task) {
  const overdue = isOverdue(task.dueDate, task.completed)
  return `
    <li class="task-item priority-${task.priority} ${task.completed ? 'is-completed' : ''} ${overdue ? 'is-overdue' : ''}" data-id="${task.id}">
      <label class="task-check">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" aria-label="Marquer comme terminée" />
        <span class="checkmark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </label>
      <div class="task-body">
        <div class="task-title-row">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="badge badge-${task.priority}">${PRIORITY_LABELS[task.priority]}</span>
          ${task.category ? `<span class="badge badge-category">${escapeHtml(task.category)}</span>` : ''}
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        ${
          task.dueDate
            ? `<span class="task-due">${overdue ? '⚠️ En retard —' : '📅'} ${formatDate(task.dueDate)}</span>`
            : ''
        }
      </div>
      <div class="task-actions">
        <button type="button" class="icon-btn" data-action="delete" aria-label="Supprimer la tâche">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" />
          </svg>
        </button>
      </div>
    </li>
  `
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
