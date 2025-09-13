import httpClient from '../api/axios'
import {
  login as loginApi,
  type LoginPayload,
  type LoginResponse,
} from '../api/auth'
import { clearAuth, loadAuth, saveAuth } from '../lib/auth'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await loginApi(payload)
  httpClient.setAuthTokens(data.accessToken, data.refreshToken)
  saveAuth(data)
  return data
}

export function getStoredAuth(): LoginResponse | null {
  const data = loadAuth()
  if (data) {
    httpClient.setAuthTokens(data.accessToken, data.refreshToken)
  }
  return data
}

export function clearStoredAuth() {
  clearAuth()
  httpClient.setAuthTokens(null, null)
}
