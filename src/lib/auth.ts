import type { AuthSession, User } from '../types/auth'

type AuthChangedEventDetail = AuthSession | null

let inMemoryAccessToken: string | null = null
let inMemoryUser: User | null = null

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

function getAccessTokenFromMemory(): string | null {
  return inMemoryAccessToken
}

function getUserFromMemory(): User | null {
  return inMemoryUser
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

  dispatchAuthChanged(session)
  return session
}

export function clearAuthSession(): void {
  inMemoryAccessToken = null
  inMemoryUser = null
  dispatchAuthChanged(null)
}
