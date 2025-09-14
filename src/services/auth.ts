import httpClient from '../api/axios'
import {
  login as loginApi,
  validateToken as validateTokenApi,
  type LoginPayload,
  type LoginResponse,
} from '../api/auth'
import { clearToken, loadToken, saveToken } from '../lib/auth'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await loginApi(payload)
  httpClient.setAuthTokens(data.accessToken, null)
  saveToken(data.accessToken)
  return data
}
export async function validateToken(): Promise<boolean> {
  try {
    const response = await validateTokenApi()
    if (response) {
      return true
    }
    clearStoredToken()
    return false
  } catch {
    // On any error (including invalid token), clear stored token
    clearStoredToken()
    return false
  }
}
export function getStoredToken(): string | null {
  const token = loadToken()
  if (token) {
    httpClient.setAuthTokens(token, null)
  }
  return token
}

export function clearStoredToken() {
  clearToken()
  httpClient.setAuthTokens(null, null)
}
