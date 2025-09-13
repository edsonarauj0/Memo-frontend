import httpClient from '../api/axios'
import { login as loginApi, type LoginPayload, type LoginResponse } from '../api/auth'

const STORAGE_KEY = 'auth'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await loginApi(payload)
  httpClient.setAuthToken(data.token)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
  return data
}

export function getStoredAuth(): LoginResponse | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const data: LoginResponse = JSON.parse(raw)
    httpClient.setAuthToken(data.token)
    return data
  } catch {
    return null
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY)
  httpClient.setAuthToken(null)
}
