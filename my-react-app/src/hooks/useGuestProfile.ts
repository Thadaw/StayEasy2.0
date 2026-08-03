import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import type { GuestProfile } from '../types/booking'

export type { GuestProfile } from '../types/booking'

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
  const abortRef = useRef<AbortController | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get('/auth/guests/me', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setProfile(data)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
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
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    fetchProfile()

    return () => {
      abortRef.current?.abort()
    }
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
  }
}
