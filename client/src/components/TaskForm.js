import { Priority, PRIORITY_KEYS } from '../models/Task.js'
import { t } from '../utils/i18n.js'

export function renderTaskForm(container, { onAdd }) {
  container.innerHTML = `
    <form class="task-form" novalidate>
      <div class="field field-title">
        <label for="task-title">${t('formTitleLabel')}</label>
        <input id="task-title" name="title" type="text" placeholder="${t('formTitlePlaceholder')}" required maxlength="120" />
      </div>
      <div class="field">
        <label for="task-due">${t('formDueLabel')}</label>
        <input id="task-due" name="dueDate" type="date" />
      </div>
      <div class="field">
        <label for="task-priority">${t('formPriorityLabel')}</label>
        <select id="task-priority" name="priority">
          ${Object.entries(PRIORITY_KEYS)
            .map(
              ([value, key]) =>
                `<option value="${value}" ${value === Priority.MEDIUM ? 'selected' : ''}>${t(key)}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="field">
        <label for="task-category">${t('formCategoryLabel')}</label>
        <input id="task-category" name="category" type="text" placeholder="${t('formCategoryPlaceholder')}" maxlength="40" />
      </div>
      <div class="field field-description">
        <label for="task-description">${t('formDescriptionLabel')}</label>
        <textarea id="task-description" name="description" rows="2" placeholder="${t('formDescriptionPlaceholder')}" maxlength="500"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <path d="M12 5v14M5 12h14" />
        </svg>
        ${t('formSubmit')}
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
