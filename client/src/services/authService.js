import { t } from '../utils/i18n.js'
import { getToken, request, setToken, setUnauthorizedHandler } from './api.js'

export class AuthService {
  #user = null
  #listeners = new Set()

  constructor() {
    setUnauthorizedHandler(() => this.logout())
  }

  subscribe(listener) {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  #emit() {
    this.#listeners.forEach((listener) => listener(this.#user))
  }

  get user() {
    return this.#user
  }

  isLoggedIn() {
    return this.#user !== null
  }

  isAdmin() {
    return this.#user?.role === 'admin'
  }

  // Restores the session from a stored token, if it's still valid.
  async init() {
    if (!getToken()) return
    try {
      this.#user = await request('/auth/me', {}, t('errSession'))
    } catch {
      setToken(null)
      this.#user = null
    }
  }

  async login(email, password) {
    this.#setSession(await request('/auth/login', { method: 'POST', body: { email, password } }, t('errLogin')))
  }

  async register(email, password) {
    this.#setSession(await request('/auth/register', { method: 'POST', body: { email, password } }, t('errRegister')))
  }

  logout() {
    if (!this.#user && !getToken()) return
    setToken(null)
    this.#user = null
    this.#emit()
  }

  #setSession({ token, user }) {
    setToken(token)
    this.#user = user
    this.#emit()
  }
}
