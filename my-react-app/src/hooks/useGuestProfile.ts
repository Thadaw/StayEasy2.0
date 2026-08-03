import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

interface GuestProfile {
  full_name: string
  email: string
  phone: string
  nationality: string
  id: string
  created_at: string
}

interface UseGuestProfileReturn {
  profile: GuestProfile | null
  loading: boolean
  error: string | null
}

export function useGuestProfile(): UseGuestProfileReturn {
  const { user } = useAuth()
  const [profile, setProfile] = useState<GuestProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get<GuestProfile>('/auth/guests/me')
      setProfile(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile'
      setError(message)
      // Fallback to basic user data
      setProfile({
        full_name: user.fullName || user.full_name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
        email: user.email || '',
        phone: '',
        nationality: '',
        id: '',
        created_at: '',
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
  }
}
