import httpClient from '../api/axios'
import {
  login as loginApi,
  logout as logoutApi,
  refreshSession as refreshSessionApi,
  validateToken as validateTokenApi,
  type LoginPayload,
  type LoginResponse,
} from '../api/auth'
import {
  clearAuthSession,
  loadAuthSession,
  loadStoredUser,
  saveAuthSession,
} from '../lib/auth'
import type { AuthSession } from '../types/auth'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await loginApi(payload)
  httpClient.setAuthTokens(data.accessToken)
  saveAuthSession({
    accessToken: data.accessToken,
    user: data.user,
  })
  return data
}

export async function logout(): Promise<void> {
  try {
    await logoutApi()
  } catch (error) {
    console.warn('Failed to invalidate session during logout', error)
  } finally {
    clearAuthSession()
    httpClient.setAuthTokens(null)
  }
}

export async function validateToken(): Promise<boolean> {
  try {
    return await validateTokenApi()
  } catch {
    return false
  }
}

export function getStoredSession(): AuthSession | null {
  const session = loadAuthSession()
  if (session?.accessToken) {
    httpClient.setAuthTokens(session.accessToken)
  }
  return session
}

export async function restoreSession(): Promise<AuthSession | null> {
  const user = loadStoredUser()
  if (!user) {
    return null
  }

  try {
    const data = await refreshSessionApi()
    if (!data.accessToken) {
      return null
    }

    httpClient.setAuthTokens(data.accessToken)
    const session: AuthSession = {
      accessToken: data.accessToken,
      user,
    }
    saveAuthSession(session)
    return session
  } catch (error) {
    console.warn('Failed to restore auth session', error)
    clearAuthSession()
    httpClient.setAuthTokens(null)
    return null
  }
}
