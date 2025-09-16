import type { AuthSession, User } from '../types/auth'

const AUTH_USER_STORAGE_KEY = 'memo:auth-user'

type AuthChangedEventDetail = AuthSession | null

let inMemoryAccessToken: string | null = null
let inMemoryUser: User | null | undefined

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readUserFromStorage(): User | null {
  if (!isBrowserEnvironment()) {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as User
  } catch (error) {
    console.error('Failed to parse stored auth user', error)
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

function persistUser(user: User | null): void {
  if (!isBrowserEnvironment()) {
    return
  }

  if (user) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  }
}

function getUserFromMemory(): User | null {
  if (inMemoryUser !== undefined) {
    return inMemoryUser
  }

  inMemoryUser = readUserFromStorage()
  return inMemoryUser
}

function dispatchAuthChanged(session: AuthChangedEventDetail) {
  if (!isBrowserEnvironment()) {
    return
  }

  window.dispatchEvent(new CustomEvent<AuthChangedEventDetail>('auth:changed', { detail: session }))
}

export function loadStoredUser(): User | null {
  return getUserFromMemory()
}

export function saveAuthSession(session: AuthSession): void {
  inMemoryAccessToken = session.accessToken
  inMemoryUser = session.user
  persistUser(session.user)
  dispatchAuthChanged({ ...session })
}

export function loadAuthSession(): AuthSession | null {
  if (!inMemoryAccessToken) {
    return null
  }

  return {
    accessToken: inMemoryAccessToken,
    user: getUserFromMemory(),
  }
}

export function updateAuthSession(partialSession: Partial<AuthSession>): AuthSession | null {
  if (partialSession.accessToken !== undefined) {
    inMemoryAccessToken = partialSession.accessToken ?? null
  }

  if (partialSession.user !== undefined) {
    inMemoryUser = partialSession.user ?? null
    persistUser(inMemoryUser)
  }

  if (!inMemoryAccessToken) {
    clearAuthSession()
    return null
  }

  const session: AuthSession = {
    accessToken: inMemoryAccessToken,
    user: getUserFromMemory(),
  }

  dispatchAuthChanged(session)
  return session
}

export function clearAuthSession(): void {
  inMemoryAccessToken = null
  inMemoryUser = null
  persistUser(null)
  dispatchAuthChanged(null)
}

export { AUTH_USER_STORAGE_KEY }
