import type { AuthSession, User } from '../types/auth'

type AuthChangedEventDetail = AuthSession | null

let inMemoryAccessToken: string | null = null
let inMemoryUser: User | null = null

export const AUTH_STORAGE_KEY = 'memo.auth.session' as const
function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

function getStorage(): Storage | null {
  if (!isBrowserEnvironment()) {
    return null
  }

  try {
    return window.localStorage
  } catch (error) {
    console.warn('Failed to access localStorage for auth session', error)
    return null
  }
}

function persistSession(session: AuthSession): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.warn('Failed to persist auth session', error)
  }
}

function removePersistedSession(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.removeItem(AUTH_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear persisted auth session', error)
  }
}

function getAccessTokenFromMemory(): string | null {
  return inMemoryAccessToken
}

function getUserFromMemory(): User | null {
  return inMemoryUser
}

function restoreSessionFromStorage(): AuthSession | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession> | null
    if (!parsed || typeof parsed !== 'object') {
      storage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.length === 0) {
      storage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    if (typeof parsed.user !== 'object' || parsed.user === null) {
      storage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return {
      accessToken: parsed.accessToken,
      user: (parsed.user ?? null) as User | null,
    }
  } catch (error) {
    console.warn('Failed to parse stored auth session', error)
    storage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function dispatchAuthChanged(session: AuthChangedEventDetail) {
  if (!isBrowserEnvironment()) {
    return
  }

  window.dispatchEvent(new CustomEvent<AuthChangedEventDetail>('auth:changed', { detail: session }))
}

export function saveAuthSession(session: AuthSession): void {
  inMemoryAccessToken = session.accessToken
  inMemoryUser = session.user
  persistSession(session)
  dispatchAuthChanged({ ...session })
}

export function loadAuthSession(): AuthSession | null {
  const accessToken = getAccessTokenFromMemory()
  if (!accessToken) {
    const restored = restoreSessionFromStorage()
    if (!restored) {
      return null
    }

    inMemoryAccessToken = restored.accessToken
    inMemoryUser = restored.user
    return { ...restored }
  }

  return {
    accessToken,
    user: getUserFromMemory(),
  }
}

export function updateAuthSession(partialSession: Partial<AuthSession>): AuthSession | null {
  if (partialSession.accessToken !== undefined) {
    inMemoryAccessToken = partialSession.accessToken ?? null
  }

  if (partialSession.user !== undefined) {
    inMemoryUser = partialSession.user ?? null
  }

  const accessToken = getAccessTokenFromMemory()
  if (!accessToken) {
    clearAuthSession()
    return null
  }

  const session: AuthSession = {
    accessToken,
    user: getUserFromMemory(),
  }

  persistSession(session)
  dispatchAuthChanged(session)
  return session
}

export function clearAuthSession(): void {
  inMemoryAccessToken = null
  inMemoryUser = null
  removePersistedSession()
  dispatchAuthChanged(null)
}
