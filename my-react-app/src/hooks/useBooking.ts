import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api'
import type { Booking } from '../types/booking'

export type { Booking, BookingRoom } from '../types/booking'

interface UseBookingOptions {
  refNumber: string | null
  enabled?: boolean
}

interface UseBookingReturn {
  booking: Booking | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBooking({ refNumber, enabled = true }: UseBookingOptions): UseBookingReturn {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(() => !enabled || !refNumber ? false : true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchBooking = useCallback(async () => {
    if (!refNumber) {
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get(`/bookings/${refNumber}`, { signal: controller.signal })
      if (!controller.signal.aborted) {
        setBooking(data?.data || data)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const message = err instanceof Error ? err.message : 'Failed to load booking'
        setError(message)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [refNumber])

  useEffect(() => {
    if (enabled && refNumber) {
      fetchBooking()
    } else {
      setLoading(false)
    }

    return () => {
      abortRef.current?.abort()
    }
  }, [enabled, refNumber, fetchBooking])

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
  }
}
