import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setSessionLostHandler, type User } from './api'

type Auth = {
  /** undefined = ainda conferindo; null = ninguém logado. */
  user: User | null | undefined
  setUser: (u: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    setSessionLostHandler(() => setUser(null))
    api.me().then((m) => setUser(m.user)).catch(() => setUser(null))
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => {})
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}

export const firstName = (u: User) => u.name.split(' ')[0]
