import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload, User } from '../api/auth'
import {
  clearStoredToken,
  getStoredToken,
  login as authLogin,
  validateToken,
} from '../services/auth'

export interface AuthContextType {
  token: string | null
  user: User | null
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail
      setToken(detail)
    }
    window.addEventListener('auth:changed', handler as EventListener)
    return () => {
      window.removeEventListener('auth:changed', handler as EventListener)
    }
  }, [])

  useEffect(() => {
    const verify = async () => {
      if (token) {
        const isValid = await validateToken()
        if (!isValid) {
          setToken(null)
        }
      }
    }
    void verify()
  }, [token])

  const login = async (credentials: LoginPayload) => {
    const data = await authLogin(credentials)
    setToken(data.accessToken)
    setUser(data.user)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    clearStoredToken()
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}