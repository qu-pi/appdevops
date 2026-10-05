import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from './authService.js'
import { TaskService } from './taskService.js'
import { getToken, setToken } from './api.js'

function jsonResponse(body, status = 200) {
  return { ok: status < 400, status, json: async () => body }
}

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

const user = { id: 'u1', email: 'a@b.co', role: 'user' }

describe('AuthService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    global.localStorage = memoryStorage()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete global.localStorage
  })

  it('logs in, stores the token and notifies subscribers', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ token: 'tok', user }))
    const auth = new AuthService()
    const listener = vi.fn()
    auth.subscribe(listener)

    await auth.login('a@b.co', 'password123')

    expect(getToken()).toBe('tok')
    expect(auth.user).toEqual(user)
    expect(listener).toHaveBeenCalledWith(user)
  })

  it('sends the token on later requests', async () => {
    setToken('tok')
    global.fetch.mockResolvedValue(jsonResponse([]))

    await new TaskService().load()

    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok')
  })

  it('restores a valid session on init and drops an invalid one', async () => {
    setToken('tok')
    global.fetch.mockResolvedValueOnce(jsonResponse(user))
    const auth = new AuthService()
    await auth.init()
    expect(auth.isLoggedIn()).toBe(true)

    global.fetch.mockResolvedValueOnce(jsonResponse({ error: 'Authentification requise.' }, 401))
    const expired = new AuthService()
    await expired.init()
    expect(expired.isLoggedIn()).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('logs out when an authenticated request is rejected', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({ token: 'tok', user }))
    const auth = new AuthService()
    await auth.login('a@b.co', 'password123')

    global.fetch.mockResolvedValueOnce(jsonResponse({ error: 'Authentification requise.' }, 401))
    await expect(new TaskService().load()).rejects.toThrow()

    expect(auth.isLoggedIn()).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('shows the server message on a failed login', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ error: 'Email ou mot de passe incorrect.' }, 401))
    const auth = new AuthService()

    await expect(auth.login('a@b.co', 'bad-password')).rejects.toThrow('Email ou mot de passe incorrect.')
    expect(auth.isLoggedIn()).toBe(false)
  })
})
