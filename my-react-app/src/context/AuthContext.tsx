import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { AxiosError } from 'axios'
import api from '../api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, userType?: 'host' | 'guest') => Promise<void>
  credentialLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(u: User): User {
  const name = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
  const parts = name.split(' ')
  return {
    ...u,
    firstName: u.firstName || u.first_name || parts[0] || '',
    lastName: u.lastName || u.last_name || parts.slice(1).join(' ') || '',
    name,
    avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=2E86AB&textColor=ffffff`,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const userType = localStorage.getItem('userType') || 'guest'
      const endpoint = userType === 'host' ? '/auth/users/me' : '/auth/guests/me'
      const { data } = await api.get<User>(endpoint)
      setUser(mapUser(data))
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (newToken: string, userType?: 'host' | 'guest') => {
    localStorage.setItem('token', newToken)
    if (userType) localStorage.setItem('userType', userType)
    setToken(newToken)
    await fetchUser()
  }

  const credentialLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const form = new FormData()
      form.append('username', email)
      form.append('password', password)
      const res = await api.post('auth/users/login', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await login(res.data.access_token)
      return { success: true }
    } catch (err) {
      let msg = 'Incorrect email or password.'
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as Record<string, unknown>
        if (typeof data.detail === 'string') msg = data.detail
        else if (typeof data.message === 'string') msg = data.message
      }
      return { success: false, error: msg }
    }
  }

  const signup = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post('/auth/users/register', {
        full_name: fullName,
        email,
        password,
      })
      return { success: true }
    } catch (err) {
      let msg = 'Could not create account. Please try again.'
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as Record<string, unknown>
        if (typeof data.detail === 'string') msg = data.detail
        else if (typeof data.message === 'string') msg = data.message
      }
      return { success: false, error: msg }
    }
  }

  const refreshUser = async () => {
    if (!token) return
    const userType = localStorage.getItem('userType') || 'guest'
    const endpoint = userType === 'host' ? '/auth/users/me' : '/auth/guests/me'
    try {
      const { data } = await api.get<User>(endpoint)
      setUser(mapUser(data))
    } catch {
      // ignore
    }
  }

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const userType = localStorage.getItem('userType') || 'guest'
      const endpoint = userType === 'host' ? '/auth/users/me' : '/auth/guests/me'
      const { data: updated } = await api.patch<User>(endpoint, data)
      setUser(mapUser(updated))
      return { success: true }
    } catch (err) {
      let msg = 'Failed to update profile.'
      if (err instanceof AxiosError && err.response?.data) {
        const d = err.response.data as Record<string, unknown>
        if (typeof d.detail === 'string') msg = d.detail
        else if (typeof d.message === 'string') msg = d.message
      }
      return { success: false, error: msg }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, credentialLogin, signup, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
