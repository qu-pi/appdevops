import { t } from '../utils/i18n.js'

export const AuthMode = { LOGIN: 'login', REGISTER: 'register' }

// Renders the login / sign-up form inside a native <dialog>. `onSubmit`
// returns a promise: the dialog closes when it resolves, and shows the
// error message inline when it rejects.
export function openAuthModal(dialog, { mode = AuthMode.LOGIN, reason = '', onSubmit, onClose }) {
  let currentMode = mode

  function render() {
    const isLogin = currentMode === AuthMode.LOGIN
    dialog.innerHTML = `
      <form class="auth-form" novalidate>
        <button type="button" class="icon-btn auth-close" data-action="close" aria-label="${t('authClose')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
        <h2>${t(isLogin ? 'authLoginTitle' : 'authRegisterTitle')}</h2>
        ${reason ? `<p class="auth-reason">${reason}</p>` : ''}
        <div class="auth-tabs" role="tablist">
          <button type="button" role="tab" class="filter-btn ${isLogin ? 'is-active' : ''}" aria-selected="${isLogin}" data-mode="${AuthMode.LOGIN}">${t('authLoginTab')}</button>
          <button type="button" role="tab" class="filter-btn ${isLogin ? '' : 'is-active'}" aria-selected="${!isLogin}" data-mode="${AuthMode.REGISTER}">${t('authRegisterTab')}</button>
        </div>
        <div class="field">
          <label for="auth-email">${t('authEmail')}</label>
          <input id="auth-email" name="email" type="email" autocomplete="email" required maxlength="255" />
        </div>
        <div class="field">
          <label for="auth-password">${t('authPassword')}</label>
          <input id="auth-password" name="password" type="password" required minlength="8" maxlength="128"
            autocomplete="${isLogin ? 'current-password' : 'new-password'}" />
          ${isLogin ? '' : `<small class="field-hint">${t('authPasswordHint')}</small>`}
        </div>
        <p class="auth-error" role="alert" hidden></p>
        <button type="submit" class="btn btn-primary auth-submit">${t(isLogin ? 'authLoginSubmit' : 'authRegisterSubmit')}</button>
      </form>
    `

    const form = dialog.querySelector('form')
    const errorEl = dialog.querySelector('.auth-error')
    const submitBtn = dialog.querySelector('.auth-submit')

    dialog.querySelector('[data-action="close"]').addEventListener('click', () => dialog.close())
    dialog.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode
        render()
      })
    })

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const { email, password } = Object.fromEntries(new FormData(form).entries())
      if (!email.trim() || !password) {
        errorEl.textContent = t('authMissingFields')
        errorEl.hidden = false
        return
      }

      submitBtn.disabled = true
      errorEl.hidden = true
      try {
        await onSubmit({ mode: currentMode, email: email.trim(), password })
        dialog.close()
      } catch (err) {
        errorEl.textContent = err.message
        errorEl.hidden = false
        submitBtn.disabled = false
      }
    })

    dialog.querySelector('#auth-email').focus()
  }

  dialog.addEventListener('close', () => onClose?.(), { once: true })
  render()
  if (!dialog.open) dialog.showModal()
  dialog.querySelector('#auth-email').focus()
}
