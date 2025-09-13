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
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshResponse {
  accessToken: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>({
    url: '/auth/login',
    data: payload,
  })
}

export async function refresh(
  refreshToken: string,
): Promise<RefreshResponse> {
  return httpClient.post<RefreshResponse>({
    url: '/auth/refresh',
    data: { refreshToken },
  })
}
