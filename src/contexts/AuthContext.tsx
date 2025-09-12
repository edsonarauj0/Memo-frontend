/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface AuthContextType {
  user: unknown
  login: (userData: unknown) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<unknown>(null)

  const login = (userData: unknown) => setUser(userData)
  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
