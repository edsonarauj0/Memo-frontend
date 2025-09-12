import { api } from './axios'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post('/login', payload)
  return data
}
