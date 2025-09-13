import httpClient from './axios'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  return httpClient.post<{ token: string }>({
    url: '/login',
    data: payload,
  })
}
