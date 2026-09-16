import { Priority, PRIORITY_LABELS } from '../models/Task.js'

export function renderTaskForm(container, { onAdd }) {
  container.innerHTML = `
    <form class="task-form" novalidate>
      <div class="field field-title">
        <label for="task-title">Titre</label>
        <input id="task-title" name="title" type="text" placeholder="Ex : Préparer la présentation" required maxlength="120" />
      </div>
      <div class="field">
        <label for="task-due">Échéance</label>
        <input id="task-due" name="dueDate" type="date" />
      </div>
      <div class="field">
        <label for="task-priority">Priorité</label>
        <select id="task-priority" name="priority">
          ${Object.entries(PRIORITY_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${value === Priority.MEDIUM ? 'selected' : ''}>${label}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="field">
        <label for="task-category">Catégorie</label>
        <input id="task-category" name="category" type="text" placeholder="Travail, Perso…" maxlength="40" />
      </div>
      <div class="field field-description">
        <label for="task-description">Description</label>
        <textarea id="task-description" name="description" rows="2" placeholder="Détails (optionnel)" maxlength="500"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ajouter la tâche
      </button>
    </form>
  `

  const form = container.querySelector('form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(form).entries())
    if (!data.title?.trim()) return
    onAdd(data)
    form.reset()
    container.querySelector('#task-title').focus()
  })
}
