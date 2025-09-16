import type { AuthSession } from '../types/auth'

const AUTH_STORAGE_KEY = 'memo:auth-session'

type AuthChangedEventDetail = AuthSession | null

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readSessionFromStorage(): AuthSession | null {
  if (!isBrowserEnvironment()) {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch (error) {
    console.error('Failed to parse stored auth session', error)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function dispatchAuthChanged(session: AuthChangedEventDetail) {
  if (!isBrowserEnvironment()) {
    return
  }

  window.dispatchEvent(new CustomEvent<AuthChangedEventDetail>('auth:changed', { detail: session }))
}

function writeSessionToStorage(session: AuthSession | null) {
  if (!isBrowserEnvironment()) {
    return
  }

  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  dispatchAuthChanged(session)
}

export function saveAuthSession(session: AuthSession): void {
  writeSessionToStorage(session)
}

export function loadAuthSession(): AuthSession | null {
  return readSessionFromStorage()
}

export function updateAuthSession(partialSession: Partial<AuthSession>): AuthSession | null {
  const currentSession = readSessionFromStorage()

  if (!currentSession) {
    if (!partialSession.accessToken || !partialSession.refreshToken) {
      return null
    }

    const nextSession: AuthSession = {
      accessToken: partialSession.accessToken,
      refreshToken: partialSession.refreshToken,
      user: partialSession.user ?? null,
    }

    writeSessionToStorage(nextSession)
    return nextSession
  }

  const nextSession: AuthSession = {
    accessToken: partialSession.accessToken ?? currentSession.accessToken,
    refreshToken: partialSession.refreshToken ?? currentSession.refreshToken,
    user: partialSession.user ?? currentSession.user,
  }

  if (!nextSession.accessToken || !nextSession.refreshToken) {
    writeSessionToStorage(null)
    return null
  }

  writeSessionToStorage(nextSession)
  return nextSession
}

export function clearAuthSession(): void {
  writeSessionToStorage(null)
}

export { AUTH_STORAGE_KEY }
