import { useState, useEffect } from 'react'
import api from '../api'
import type { Booking } from '../types/booking'

export type { Booking, BookingRoom } from '../types/booking'

interface UseBookingOptions {
  refNumber: string | null
}

export function useBooking({ refNumber }: UseBookingOptions) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!refNumber) {
      setLoading(false)
      return
    }

    setLoading(true)

    api.get(`/bookings/${refNumber}`)
      .then(res => {
        setBooking(res.data?.data || res.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [refNumber])

  return { booking, loading }
}
