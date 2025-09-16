import type { AuthSession, User } from '../types/auth'

const AUTH_USER_STORAGE_KEY = 'memo:auth-user'
const AUTH_TOKEN_STORAGE_KEY = 'memo:auth-token'

type AuthChangedEventDetail = AuthSession | null

let inMemoryAccessToken: string | null | undefined
let inMemoryUser: User | null | undefined

function isBrowserEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  )
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

function readTokenFromStorage(): string | null {
  if (!isBrowserEnvironment()) {
    return null
  }

  return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null
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

function persistToken(token: string | null): void {
  if (!isBrowserEnvironment()) {
    return
  }

  if (token) {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  } else {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }
}

function getUserFromMemory(): User | null {
  if (inMemoryUser !== undefined) {
    return inMemoryUser
  }

  inMemoryUser = readUserFromStorage()
  return inMemoryUser
}

function getAccessTokenFromMemory(): string | null {
  if (inMemoryAccessToken !== undefined) {
    return inMemoryAccessToken
  }

  inMemoryAccessToken = readTokenFromStorage()
  return inMemoryAccessToken
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
  persistToken(session.accessToken)
  persistUser(session.user)
  dispatchAuthChanged({ ...session })
}

export function loadAuthSession(): AuthSession | null {
  const accessToken = getAccessTokenFromMemory()
  if (!accessToken) {
    return null
  }

  return {
    accessToken,
    user: getUserFromMemory(),
  }
}

export function updateAuthSession(partialSession: Partial<AuthSession>): AuthSession | null {
  if (partialSession.accessToken !== undefined) {
    inMemoryAccessToken = partialSession.accessToken ?? null
    persistToken(inMemoryAccessToken)
  }

  if (partialSession.user !== undefined) {
    inMemoryUser = partialSession.user ?? null
    persistUser(inMemoryUser)
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

  dispatchAuthChanged(session)
  return session
}

export function clearAuthSession(): void {
  inMemoryAccessToken = null
  inMemoryUser = null
  persistToken(null)
  persistUser(null)
  dispatchAuthChanged(null)
}

export { AUTH_USER_STORAGE_KEY }
