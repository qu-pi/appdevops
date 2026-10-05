import { t, getEffectiveLocale } from '../utils/i18n.js'
import { escapeHtml } from '../utils/html.js'
import { formatDate } from '../utils/date.js'
import { PRIORITY_KEYS } from '../models/Task.js'

const DELETE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" /></svg>`

function statCard(value, labelKey, modifier = '') {
  return `
    <div class="stat-card ${modifier}">
      <span class="stat-value">${value}</span>
      <span class="stat-label">${t(labelKey)}</span>
    </div>
  `
}

function shortDate(iso) {
  return formatDate(iso.slice(0, 10), getEffectiveLocale())
}

export function renderAdminPanel(container, { stats, users, tasks, currentUserId, loading }, { onDeleteUser, onDeleteTask }) {
  if (loading || !stats) {
    container.innerHTML = `<p class="empty-state">${t('loading')}</p>`
    return
  }

  container.innerHTML = `
    <div class="admin-panel">
      <div class="stats-bar admin-stats" aria-live="polite">
        ${statCard(stats.users, 'adminStatUsers', 'is-total')}
        ${statCard(stats.tasks, 'adminStatTasks', 'is-total')}
        ${statCard(stats.activeTasks, 'statActivePlural', 'is-active')}
        ${statCard(stats.completedTasks, 'statCompletedPlural', 'is-completed')}
      </div>

      <section class="panel">
        <h2 class="panel-title">${t('adminUsersTitle')} <span class="panel-count">${users.length}</span></h2>
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>${t('authEmail')}</th>
                <th>${t('adminRole')}</th>
                <th>${t('adminTasks')}</th>
                <th>${t('adminCreated')}</th>
                <th><span class="visually-hidden">${t('adminActions')}</span></th>
              </tr>
            </thead>
            <tbody>
              ${users
                .map(
                  (user) => `
                <tr data-id="${user.id}">
                  <td class="cell-strong">${escapeHtml(user.email)}</td>
                  <td>${user.role === 'admin' ? `<span class="badge badge-admin">${t('roleAdmin')}</span>` : t('roleUser')}</td>
                  <td>${user.completedCount} / ${user.taskCount}</td>
                  <td>${shortDate(user.createdAt)}</td>
                  <td class="cell-actions">
                    ${
                      user.id === currentUserId
                        ? ''
                        : `<button type="button" class="icon-btn" data-action="delete-user" aria-label="${t('adminDeleteUser')}" title="${t('adminDeleteUser')}">${DELETE_ICON}</button>`
                    }
                  </td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">${t('adminTasksTitle')} <span class="panel-count">${tasks.length}</span></h2>
        ${
          tasks.length === 0
            ? `<p class="admin-empty">${t('emptyState')}</p>`
            : `
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>${t('formTitleLabel')}</th>
                <th>${t('adminOwner')}</th>
                <th>${t('formPriorityLabel')}</th>
                <th>${t('adminStatus')}</th>
                <th><span class="visually-hidden">${t('adminActions')}</span></th>
              </tr>
            </thead>
            <tbody>
              ${tasks
                .map(
                  (task) => `
                <tr data-id="${task.id}">
                  <td class="cell-strong">${escapeHtml(task.title)}</td>
                  <td>${task.ownerEmail ? escapeHtml(task.ownerEmail) : `<em>${t('adminNoOwner')}</em>`}</td>
                  <td><span class="badge badge-${task.priority}">${t(PRIORITY_KEYS[task.priority])}</span></td>
                  <td>${t(task.completed ? 'statCompleted' : 'statActive')}</td>
                  <td class="cell-actions">
                    <button type="button" class="icon-btn" data-action="delete-task" aria-label="${t('deleteLabel')}" title="${t('deleteLabel')}">${DELETE_ICON}</button>
                  </td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>`
        }
      </section>
    </div>
  `

  container.querySelectorAll('[data-action="delete-user"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id
      onDeleteUser(users.find((user) => user.id === id))
    })
  })

  container.querySelectorAll('[data-action="delete-task"]').forEach((btn) => {
    btn.addEventListener('click', () => onDeleteTask(btn.closest('tr').dataset.id))
  })
}
