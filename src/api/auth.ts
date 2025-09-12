import { httpClient } from './httpClient'

const API_URL = 'http://8080/api' // ajuste para a URL real

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  return httpClient(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
