import type { LoginResponse } from '../api/auth'

export const AUTH_STORAGE_KEY = 'auth'

export function saveAuth(data: LoginResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: data }))
}

export function loadAuth(): LoginResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LoginResponse
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }))
}

export function updateAccessToken(accessToken: string) {
  const stored = loadAuth()
  if (!stored) return
  const updated = { ...stored, accessToken }
  saveAuth(updated)
}
