export const TOKEN_STORAGE_KEY = 'token'

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: token }))
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }))
}
