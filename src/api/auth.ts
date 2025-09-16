import httpClient from './axios'
import type { User } from '../types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken?: string | null
  user: User
}

export interface RefreshResponse {
  accessToken: string
  refreshToken?: string | null
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>({
    url: '/auth/login',
    data: payload,
  })
}

export async function refreshSession(): Promise<RefreshResponse> {
  return httpClient.post<RefreshResponse>({
    url: '/auth/auth/refresh',
  })
}

export async function logout(): Promise<void> {
  return httpClient.post<void>({
    url: '/auth/logout',
  })
}

export async function validateToken(): Promise<boolean> {
  return httpClient.get<boolean>({
    url: '/auth/validate',
  })
}
