// ============================================================
//  src/context/AuthContext.tsx
//  JWT auth state: login, logout, role-aware guards
// ============================================================
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { LoginResponse, UserDto } from '../types'
import { authApi } from '../api'

interface AuthContextValue {
  user: UserDto | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: LoginResponse) => void
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cmt_token'))
  const [user,  setUser]  = useState<UserDto | null>(() => {
    const raw = localStorage.getItem('cmt_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback((data: LoginResponse) => {
    localStorage.setItem('cmt_token', data.token)
    localStorage.setItem('cmt_user', JSON.stringify({
      id: data.userId, fullName: data.fullName,
      email: data.email, role: data.role,
      isActive: true, createdAt: '',
    }))
    setToken(data.token)
    setUser({ id: data.userId, fullName: data.fullName, email: data.email, role: data.role, isActive: true, createdAt: '' })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cmt_token')
    localStorage.removeItem('cmt_user')
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUser(me)
      localStorage.setItem('cmt_user', JSON.stringify(me))
    } catch {
      logout()
    }
  }, [logout])

  // On mount, validate token is still good
  useEffect(() => {
    if (token) refreshMe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === 'Admin',
      login, logout, refreshMe,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
