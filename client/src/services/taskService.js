import { t } from '../utils/i18n.js'
import { request } from './api.js'

export class TaskService {
  #tasks = []
  #listeners = new Set()

  subscribe(listener) {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  #emit() {
    this.#listeners.forEach((listener) => listener(this.#tasks))
  }

  getAll() {
    return [...this.#tasks]
  }

  // Forget the current user's tasks (on logout) without hitting the API.
  reset() {
    this.#tasks = []
    this.#emit()
  }

  async load() {
    this.#tasks = await request('/tasks', {}, t('errLoad'))
    this.#emit()
  }

  async add(data) {
    await request('/tasks', { method: 'POST', body: data }, t('errAdd'))
    await this.load()
  }

  async update(id, changes) {
    await request(`/tasks/${id}`, { method: 'PATCH', body: changes }, t('errUpdate'))
    await this.load()
  }

  async toggleComplete(id) {
    const task = this.#tasks.find((t) => t.id === id)
    if (!task) return
    await this.update(id, { completed: !task.completed })
  }

  async remove(id) {
    await request(`/tasks/${id}`, { method: 'DELETE' }, t('errDelete'))
    await this.load()
  }

  async clearCompleted() {
    await request('/tasks/completed', { method: 'DELETE' }, t('errClear'))
    await this.load()
  }

  async clearAll() {
    await request('/tasks/all', { method: 'DELETE' }, t('errClearAll'))
    await this.load()
  }
}
