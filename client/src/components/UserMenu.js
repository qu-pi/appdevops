import { t } from '../utils/i18n.js'
import { escapeHtml } from '../utils/html.js'

export function renderUserMenu(container, { user, isAdmin, view, onLogin, onLogout, onToggleAdmin }) {
  if (!user) {
    container.innerHTML = `<button type="button" class="header-btn is-primary" data-action="login">${t('login')}</button>`
    container.querySelector('[data-action="login"]').addEventListener('click', onLogin)
    return
  }

  container.innerHTML = `
    <span class="user-chip" title="${escapeHtml(user.email)}">
      ${isAdmin ? `<span class="badge badge-admin">${t('roleAdmin')}</span>` : ''}
      <span class="user-email">${escapeHtml(user.email)}</span>
    </span>
    ${
      isAdmin
        ? `<button type="button" class="header-btn" data-action="admin">${t(view === 'admin' ? 'backToTasks' : 'adminPanel')}</button>`
        : ''
    }
    <button type="button" class="header-btn" data-action="logout">${t('logout')}</button>
  `

  container.querySelector('[data-action="logout"]').addEventListener('click', onLogout)
  container.querySelector('[data-action="admin"]')?.addEventListener('click', onToggleAdmin)
}
