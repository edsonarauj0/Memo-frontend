import httpClient from '../api/axios'
import {
  login as loginApi,
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
