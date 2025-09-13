/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload, User } from '../api/auth'
import {
  clearStoredAuth,
  getStoredAuth,
  login as authLogin,
} from '../services/auth'

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const stored = getStoredAuth()
    if (stored) {
      setUser(stored.user)
      setToken(stored.token)
    }
  }, [])

  const login = async (credentials: LoginPayload) => {
    const data = await authLogin(credentials)
    setUser(data.user)
    setToken(data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    clearStoredAuth()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
