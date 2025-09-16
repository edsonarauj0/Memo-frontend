import httpClient from './axios'
import type { User } from '../types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

interface RefreshPayload {
  refreshToken: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>({
    url: '/auth/login',
    data: payload,
  })
}

export async function refreshSession(refreshToken: string): Promise<LoginResponse> {
  const payload: RefreshPayload = { refreshToken }
  return httpClient.post<LoginResponse>({
    url: '/auth/auth/refresh',
    data: payload,
  })
}

export async function logout(refreshToken: string): Promise<void> {
  return httpClient.post<void>({
    url: '/auth/logout',
    data: { refreshToken },
  })
}

export async function validateToken(): Promise<boolean> {
  return httpClient.get<boolean>({
    url: '/auth/validate',
  })
}
