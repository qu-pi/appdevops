const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/tasks'

async function handle(res, fallbackMessage) {
  if (res.ok) return res.status === 204 ? null : res.json()
  const body = await res.json().catch(() => null)
  throw new Error(body?.error || fallbackMessage)
}

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

  async load() {
    const res = await fetch(API_URL)
    this.#tasks = await handle(res, 'Impossible de charger les tâches.')
    this.#emit()
  }

  async add(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await handle(res, "Impossible d'ajouter la tâche.")
    await this.load()
  }

  async update(id, changes) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    await handle(res, 'Impossible de modifier la tâche.')
    await this.load()
  }

  async toggleComplete(id) {
    const task = this.#tasks.find((t) => t.id === id)
    if (!task) return
    await this.update(id, { completed: !task.completed })
  }

  async remove(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
    await handle(res, 'Impossible de supprimer la tâche.')
    await this.load()
  }

  async clearCompleted() {
    const res = await fetch(`${API_URL}/completed`, { method: 'DELETE' })
    await handle(res, 'Impossible d\'effacer les tâches terminées.')
    await this.load()
  }
}
