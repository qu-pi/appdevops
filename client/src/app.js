import { TaskService } from './services/taskService.js'
import { renderTaskForm } from './components/TaskForm.js'
import { renderTaskList } from './components/TaskList.js'
import { renderFilterBar, StatusFilter, SortOption } from './components/FilterBar.js'
import { renderStatsBar } from './components/StatsBar.js'
import { Priority } from './models/Task.js'
import { getEffectiveTheme, toggleTheme } from './utils/theme.js'

const SUN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>`
const MOON_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>`

const PRIORITY_ORDER = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 }

export class App {
  constructor(root) {
    this.root = root
    this.taskService = new TaskService()
    this.state = { search: '', status: StatusFilter.ALL, sort: SortOption.CREATED }
    this.loading = true
    this.error = null

    this.root.innerHTML = `
      <header class="app-header">
        <button type="button" id="theme-toggle" class="theme-toggle"></button>
        <div class="app-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4" />
            <rect x="3" y="4" width="18" height="17" rx="4" />
          </svg>
        </div>
        <h1>Mes tâches</h1>
        <p class="app-subtitle">Organisez votre journée, une tâche à la fois.</p>
      </header>
      <main class="app-main">
        <div id="error-banner" class="error-banner" hidden></div>
        <section id="task-form" class="panel" aria-label="Ajouter une tâche"></section>
        <section id="stats-bar"></section>
        <section id="filter-bar" class="panel" aria-label="Filtrer les tâches"></section>
        <section id="task-list" aria-label="Liste des tâches"></section>
      </main>
    `

    this.errorEl = this.root.querySelector('#error-banner')
    this.formEl = this.root.querySelector('#task-form')
    this.statsEl = this.root.querySelector('#stats-bar')
    this.filterEl = this.root.querySelector('#filter-bar')
    this.listEl = this.root.querySelector('#task-list')
    this.themeToggleEl = this.root.querySelector('#theme-toggle')

    this.updateThemeToggle()
    this.themeToggleEl.addEventListener('click', () => {
      toggleTheme()
      this.updateThemeToggle()
    })

    renderTaskForm(this.formEl, {
      onAdd: (data) => this.taskService.add(data).catch((err) => this.setError(err.message)),
    })

    this.taskService.subscribe(() => this.render())
    this.init()
  }

  async init() {
    try {
      await this.taskService.load()
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
    this.themeToggleEl.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre')
    this.themeToggleEl.setAttribute('title', isDark ? 'Passer en mode clair' : 'Passer en mode sombre')
  }

  setError(message) {
    this.error = message
    this.errorEl.hidden = !message
    this.errorEl.textContent = message || ''
  }

  getVisibleTasks() {
    const { search, status, sort } = this.state
    let tasks = this.taskService.getAll()

    if (status === StatusFilter.ACTIVE) tasks = tasks.filter((t) => !t.completed)
    if (status === StatusFilter.COMPLETED) tasks = tasks.filter((t) => t.completed)

    const query = search.trim().toLowerCase()
    if (query) {
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
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
    renderStatsBar(this.statsEl, this.taskService.getAll())

    renderFilterBar(this.filterEl, this.state, {
      onChange: (changes) => {
        this.state = { ...this.state, ...changes }
        this.render()
      },
      onClearCompleted: () => this.taskService.clearCompleted().catch((err) => this.setError(err.message)),
    })

    if (this.loading) {
      this.listEl.innerHTML = `<p class="empty-state">Chargement des tâches…</p>`
      return
    }

    renderTaskList(this.listEl, this.getVisibleTasks(), {
      onToggle: (id) => this.taskService.toggleComplete(id).catch((err) => this.setError(err.message)),
      onDelete: (id) => this.taskService.remove(id).catch((err) => this.setError(err.message)),
    })
  }
}
