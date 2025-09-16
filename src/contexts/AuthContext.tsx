import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload } from '../api/auth'
import {
  getStoredSession,
  login as authLogin,
  logout as authLogout,
  validateToken as validateAuthToken,
} from '../services/auth'
import type { AuthSession, User } from '../types/auth'

export interface AuthContextType {
  token: string | null
  user: User | null
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const token = session?.accessToken ?? null
  const user = session?.user ?? null

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AuthSession | null>).detail ?? null
      setSession(detail)
    }

    window.addEventListener('auth:changed', handler as EventListener)
    return () => {
      window.removeEventListener('auth:changed', handler as EventListener)
    }
  }, [])

  const login = useCallback(async (credentials: LoginPayload) => {
    const data = await authLogin(credentials)
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    })
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setSession(null)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    const verifyToken = async () => {
      const isValid = await validateAuthToken()
      if (!isValid) {
        await logout()
      }
    }

    void verifyToken()
  }, [logout, token])

  const value = useMemo<AuthContextType>(
    () => ({ token, user, login, logout }),
    [login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
