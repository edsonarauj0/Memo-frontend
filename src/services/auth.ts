import httpClient from '../api/axios'
import {
  login as loginApi,
  logout as logoutApi,
  validateToken as validateTokenApi,
  type LoginPayload,
  type LoginResponse,
} from '../api/auth'
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '../lib/auth'
import type { AuthSession } from '../types/auth'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await loginApi(payload)
  httpClient.setAuthTokens(data.accessToken, data.refreshToken)
  saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  })
  return data
}

export async function logout(): Promise<void> {
  const session = loadAuthSession()

  try {
    if (session?.refreshToken) {
      await logoutApi(session.refreshToken)
    }
  } catch (error) {
    console.warn('Failed to invalidate refresh token during logout', error)
  } finally {
    clearAuthSession()
    httpClient.setAuthTokens(null, null)
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
    httpClient.setAuthTokens(session.accessToken, session.refreshToken)
  }
  return session
}
