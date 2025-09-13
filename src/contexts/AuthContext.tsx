/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload, User } from '../api/auth'
import {
  clearStoredAuth,
  getStoredAuth,
  login as authLogin,
} from '../services/auth'
import type { LoginResponse } from '../api/auth'

export interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    const stored = getStoredAuth()
    if (stored) {
      setUser(stored.user)
      setAccessToken(stored.accessToken)
      setRefreshToken(stored.refreshToken)
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<LoginResponse | null>).detail
      if (detail) {
        setUser(detail.user)
        setAccessToken(detail.accessToken)
        setRefreshToken(detail.refreshToken)
      } else {
        setUser(null)
        setAccessToken(null)
        setRefreshToken(null)
      }
    }
    window.addEventListener('auth:changed', handler as EventListener)
    return () => {
      window.removeEventListener('auth:changed', handler as EventListener)
    }
  }, [])

  const login = async (credentials: LoginPayload) => {
    const data = await authLogin(credentials)
    setUser(data.user)
    setAccessToken(data.accessToken)
    setRefreshToken(data.refreshToken)
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    clearStoredAuth()
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
