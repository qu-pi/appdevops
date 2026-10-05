// VITE_API_URL historically pointed at the tasks endpoint ("/api/tasks");
// strip that suffix so existing build configs keep working for the new
// /api/auth and /api/admin routes too.
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api/tasks').replace(/\/tasks\/?$/, '')

const TOKEN_KEY = 'appdevops-token'

let onUnauthorized = () => {}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable: the session just won't survive a reload.
  }
}

// Called when an authenticated request comes back 401 (expired token,
// deleted account...), so the app can drop back to the logged-out state.
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export async function request(path, { method = 'GET', body } = {}, fallbackMessage) {
  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.ok) return res.status === 204 ? null : res.json()

  if (res.status === 401 && token) onUnauthorized()
  const data = await res.json().catch(() => null)
  throw new Error(data?.error || fallbackMessage)
}
