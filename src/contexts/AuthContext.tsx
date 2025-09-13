/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload } from '../api/auth'
import {
  clearStoredToken,
  getStoredToken,
  login as authLogin,
} from '../services/auth'

export interface AuthContextType {
  token: string | null
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  useEffect(() => {
    // Removido o redirecionamento automático para login
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail
      setToken(detail)
      }
    window.addEventListener('auth:changed', handler as EventListener)
    return () => {
      window.removeEventListener('auth:changed', handler as EventListener)
    }
  }, [])

  const login = async (credentials: LoginPayload) => {
    const data = await authLogin(credentials)
    setToken(data.accessToken)
  }

  const logout = () => {
    setToken(null)
    clearStoredToken()
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
