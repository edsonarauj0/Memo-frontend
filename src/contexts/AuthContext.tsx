import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload } from '../api/auth'
import {
  getStoredSession,
  login as authLogin,
  logout as authLogout,
  restoreSession as restoreAuthSession,
  validateToken as validateAuthToken,
} from '../services/auth'
import type { AuthSession, User } from '../types/auth'

export interface AuthContextType {
  token: string | null
  user: User | null
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const token = session?.accessToken ?? null
  const user = session?.user ?? null

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AuthSession | null>).detail ?? null
      setSession(detail)
      setIsLoading(false)
    }

    window.addEventListener('auth:changed', handler as EventListener)
    return () => {
      window.removeEventListener('auth:changed', handler as EventListener)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      const stored = getStoredSession()
      if (stored) {
        if (isMounted) {
          setSession(stored)
          setIsLoading(false)
        }
        return
      }

      try {
        const restored = await restoreAuthSession()
        if (isMounted && restored) {
          setSession(restored)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginPayload) => {
    const data = await authLogin(credentials)
    setSession({
      accessToken: data.accessToken,
      user: data.user,
    })
    setIsLoading(false)
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setSession(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!token || isLoading) {
      return
    }

    const verifyToken = async () => {
      const isValid = await validateAuthToken()
      if (!isValid) {
        await logout()
      }
    }

    void verifyToken()
  }, [isLoading, logout, token])

  const value = useMemo<AuthContextType>(
    () => ({ token, user, login, logout, isLoading }),
    [isLoading, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
