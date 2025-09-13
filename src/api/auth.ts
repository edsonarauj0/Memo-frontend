import httpClient from './axios'

export interface LoginPayload {
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface LoginResponse {
  token: string
  user: User
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>({
    url: '/auth/login',
    data: payload,
  })
}
