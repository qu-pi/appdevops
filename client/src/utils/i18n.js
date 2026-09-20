import { translations } from '../i18n/translations.js'

const STORAGE_KEY = 'appdevops-locale'
const SUPPORTED = ['fr', 'en']
const DEFAULT_LOCALE = 'fr'

export function getStoredLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function getEffectiveLocale() {
  const stored = getStoredLocale()
  if (SUPPORTED.includes(stored)) return stored
  const browserLocale = typeof navigator !== 'undefined' ? navigator.language : undefined
  return browserLocale?.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LOCALE
}

export function setLocale(locale) {
  document.documentElement.setAttribute('lang', locale)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Storage unavailable: language just won't persist across reloads.
  }
}

export function toggleLocale() {
  const next = getEffectiveLocale() === 'fr' ? 'en' : 'fr'
  setLocale(next)
  return next
}

export function t(key) {
  const locale = getEffectiveLocale()
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key
}
