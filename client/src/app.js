import { TaskService } from './services/taskService.js'
import { AuthService } from './services/authService.js'
import { AdminService } from './services/adminService.js'
import { renderTaskForm } from './components/TaskForm.js'
import { renderTaskList } from './components/TaskList.js'
import { renderFilterBar, StatusFilter, SortOption } from './components/FilterBar.js'
import { renderStatsBar } from './components/StatsBar.js'
import { renderUserMenu } from './components/UserMenu.js'
import { renderAdminPanel } from './components/AdminPanel.js'
import { openAuthModal, AuthMode } from './components/AuthModal.js'
import { Priority } from './models/Task.js'
import { getEffectiveTheme, toggleTheme } from './utils/theme.js'
import { getEffectiveLocale, toggleLocale, t } from './utils/i18n.js'

const SUN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>`
const MOON_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>`

const View = { TASKS: 'tasks', ADMIN: 'admin' }

const PRIORITY_ORDER = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 }

export class App {
  constructor(root) {
    this.root = root
    this.taskService = new TaskService()
    this.authService = new AuthService()
    this.adminService = new AdminService()
    this.state = { search: '', status: StatusFilter.ALL, sort: SortOption.CREATED }
    this.view = View.TASKS
    this.loading = true
    this.adminLoading = false
    this.error = null
    // Task typed by a visitor before logging in, created right after login.
    this.pendingTask = null

    document.documentElement.setAttribute('lang', getEffectiveLocale())

    this.root.innerHTML = `
      <header class="app-header">
        <div class="header-actions">
          <div id="user-menu" class="user-menu"></div>
          <button type="button" id="lang-toggle" class="lang-toggle"></button>
          <button type="button" id="theme-toggle" class="theme-toggle"></button>
        </div>
        <div class="app-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4" />
            <rect x="3" y="4" width="18" height="17" rx="4" />
          </svg>
        </div>
        <h1 id="app-title"></h1>
        <p class="app-subtitle" id="app-subtitle"></p>
      </header>
      <main class="app-main">
        <div id="error-banner" class="error-banner" hidden></div>
        <section id="task-form" class="panel"></section>
        <section id="stats-bar"></section>
        <section id="filter-bar" class="panel"></section>
        <section id="task-list"></section>
        <section id="admin-panel" hidden></section>
      </main>
      <dialog id="auth-dialog" class="auth-dialog"></dialog>
    `

    this.errorEl = this.root.querySelector('#error-banner')
    this.formEl = this.root.querySelector('#task-form')
    this.statsEl = this.root.querySelector('#stats-bar')
    this.filterEl = this.root.querySelector('#filter-bar')
    this.listEl = this.root.querySelector('#task-list')
    this.titleEl = this.root.querySelector('#app-title')
    this.subtitleEl = this.root.querySelector('#app-subtitle')
    this.themeToggleEl = this.root.querySelector('#theme-toggle')
    this.langToggleEl = this.root.querySelector('#lang-toggle')
    this.userMenuEl = this.root.querySelector('#user-menu')
    this.adminEl = this.root.querySelector('#admin-panel')
    this.authDialogEl = this.root.querySelector('#auth-dialog')
    this.taskSections = [this.formEl, this.statsEl, this.filterEl, this.listEl]

    this.themeToggleEl.addEventListener('click', () => {
      toggleTheme()
      this.updateThemeToggle()
    })

    this.langToggleEl.addEventListener('click', () => {
      toggleLocale()
      this.renderStaticText()
      this.render()
    })

    this.renderStaticText()

    this.taskService.subscribe(() => this.render())
    this.authService.subscribe((user) => this.onAuthChange(user))
    this.init()
  }

  renderStaticText() {
    document.title = t('pageTitle')
    this.titleEl.textContent = t('appTitle')
    this.subtitleEl.textContent = t('appSubtitle')
    this.formEl.setAttribute('aria-label', t('addTaskLabel'))
    this.filterEl.setAttribute('aria-label', t('filterTaskLabel'))
    this.listEl.setAttribute('aria-label', t('taskListLabel'))

    this.updateThemeToggle()
    this.updateLangToggle()

    renderTaskForm(this.formEl, {
      onAdd: (data) => {
        if (!this.authService.isLoggedIn()) {
          this.pendingTask = data
          this.openAuth(t('authReasonAddTask'))
          return false
        }
        this.taskService.add(data).catch((err) => this.setError(err.message))
      },
    })
  }

  openAuth(reason = '', mode = AuthMode.LOGIN) {
    if (this.authDialogEl.open) return
    openAuthModal(this.authDialogEl, {
      mode,
      reason,
      onSubmit: ({ mode, email, password }) =>
        mode === AuthMode.REGISTER ? this.authService.register(email, password) : this.authService.login(email, password),
      onClose: () => {
        // Abandoned login: don't create the task later behind the user's back.
        if (!this.authService.isLoggedIn()) this.pendingTask = null
      },
    })
  }

  async onAuthChange(user) {
    this.setError(null)
    this.view = View.TASKS

    if (!user) {
      this.pendingTask = null
      this.taskService.reset()
      return
    }

    this.loading = true
    this.render()
    try {
      if (this.pendingTask) {
        const task = this.pendingTask
        this.pendingTask = null
        // Re-render the form so the task typed before login is cleared.
        this.renderStaticText()
        await this.taskService.add(task)
      } else {
        await this.taskService.load()
      }
    } catch (err) {
      this.setError(err.message)
    } finally {
      this.loading = false
      this.render()
    }
  }

  async toggleAdminView() {
    this.view = this.view === View.ADMIN ? View.TASKS : View.ADMIN
    this.render()
    if (this.view === View.ADMIN) return this.refreshAdmin()
    // The admin may have deleted some of their own tasks from the panel.
    await this.taskService.load().catch((err) => this.setError(err.message))
  }

  async refreshAdmin(action = () => this.adminService.load()) {
    this.adminLoading = !this.adminService.stats
    this.render()
    try {
      await action()
      this.setError(null)
    } catch (err) {
      this.setError(err.message)
    } finally {
      this.adminLoading = false
      this.render()
    }
  }

  requireLogin(action) {
    if (this.authService.isLoggedIn()) return action()
    this.openAuth()
  }

  updateLangToggle() {
    this.langToggleEl.textContent = t('langToggle')
    this.langToggleEl.setAttribute('aria-label', t('langToggleLabel'))
    this.langToggleEl.setAttribute('title', t('langToggleLabel'))
  }

  async init() {
    try {
      await this.authService.init()
      if (this.authService.isLoggedIn()) await this.taskService.load()
      this.setError(null)
    } catch (err) {
      this.setError(err.message)
    } finally {
      this.loading = false
      this.render()
    }
  }

  updateThemeToggle() {
    const isDark = getEffectiveTheme() === 'dark'
    this.themeToggleEl.innerHTML = isDark ? SUN_ICON : MOON_ICON
    const label = t(isDark ? 'themeToLight' : 'themeToDark')
    this.themeToggleEl.setAttribute('aria-label', label)
    this.themeToggleEl.setAttribute('title', label)
  }

  setError(message) {
    this.error = message
    this.errorEl.hidden = !message
    this.errorEl.textContent = message || ''
  }

  getVisibleTasks() {
    const { search, status, sort } = this.state
    let tasks = this.taskService.getAll()

    if (status === StatusFilter.ACTIVE) tasks = tasks.filter((task) => !task.completed)
    if (status === StatusFilter.COMPLETED) tasks = tasks.filter((task) => task.completed)

    const query = search.trim().toLowerCase()
    if (query) {
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query)
      )
    }

    tasks = [...tasks].sort((a, b) => {
      if (sort === SortOption.DUE) {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      if (sort === SortOption.PRIORITY) {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      }
      return b.createdAt.localeCompare(a.createdAt)
    })

    return tasks
  }

  render() {
    const user = this.authService.user
    const showAdmin = this.view === View.ADMIN && this.authService.isAdmin()

    renderUserMenu(this.userMenuEl, {
      user,
      isAdmin: this.authService.isAdmin(),
      view: this.view,
      onLogin: () => this.openAuth(),
      onLogout: () => this.authService.logout(),
      onToggleAdmin: () => this.toggleAdminView(),
    })

    this.taskSections.forEach((el) => (el.hidden = showAdmin))
    this.adminEl.hidden = !showAdmin

    if (showAdmin) {
      renderAdminPanel(
        this.adminEl,
        { ...this.adminService, currentUserId: user.id, loading: this.adminLoading },
        {
          onDeleteUser: (target) => {
            if (!window.confirm(t('adminDeleteUserConfirm').replace('{email}', target.email))) return
            this.refreshAdmin(() => this.adminService.removeUser(target.id))
          },
          onDeleteTask: (id) => this.refreshAdmin(() => this.adminService.removeTask(id)),
        },
      )
      return
    }

    renderStatsBar(this.statsEl, this.taskService.getAll())

    renderFilterBar(this.filterEl, this.state, {
      onChange: (changes) => {
        this.state = { ...this.state, ...changes }
        this.render()
      },
      onClearCompleted: () =>
        this.requireLogin(() => this.taskService.clearCompleted().catch((err) => this.setError(err.message))),
      onClearAll: () =>
        this.requireLogin(() => {
          if (!window.confirm(t('clearAllConfirm'))) return
          this.taskService.clearAll().catch((err) => this.setError(err.message))
        }),
    })

    if (this.loading) {
      this.listEl.innerHTML = `<p class="empty-state">${t('loading')}</p>`
      return
    }

    if (!user) {
      this.listEl.innerHTML = `
        <div class="empty-state guest-state">
          <p>${t('guestMessage')}</p>
          <div class="guest-actions">
            <button type="button" class="btn btn-primary" data-action="login">${t('login')}</button>
            <button type="button" class="btn btn-secondary" data-action="register">${t('authRegisterTab')}</button>
          </div>
        </div>
      `
      this.listEl.querySelector('[data-action="login"]').addEventListener('click', () => this.openAuth())
      this.listEl
        .querySelector('[data-action="register"]')
        .addEventListener('click', () => this.openAuth('', AuthMode.REGISTER))
      return
    }

    renderTaskList(this.listEl, this.getVisibleTasks(), {
      onToggle: (id) => this.taskService.toggleComplete(id).catch((err) => this.setError(err.message)),
      onDelete: (id) => this.taskService.remove(id).catch((err) => this.setError(err.message)),
    })
  }
}
