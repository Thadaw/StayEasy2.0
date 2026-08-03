import { useState, useEffect, useCallback } from 'react'
import api from '../api'

export interface BookingRoom {
  room_id: string
  room_name: string
  room_type: string
  bed_type: string
  max_adults: number
  max_children: number
  base_rate: number
  nights: number
  subtotal: number
  photo?: string
  photos?: { cover?: string }
  cancellation_title?: string
  cancellation_description?: string
}

export interface Booking {
  booking_id: string
  ref_number: string
  status: string
  check_in: string
  check_out: string
  nights: number
  adults: number
  children: number
  total_guests: number
  payment_gateway: string | null
  payment_status: string | null
  property: {
    id: string
    name: string
    type: string
    city: string
    country: string
    currency: string
  }
  rooms: BookingRoom[]
  total_amount: number
  subtotal: number
  special_offer_discount: number
  special_offer_applied?: unknown[]
  coupon_code: string | null
  coupon_discount: number
  soft_lock_expires_at?: string
  created_at?: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  number_of_adults?: number
  number_of_children?: number
  photos?: { cover: string; gallery: string[] }
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = useCallback(async () => {
    if (!refNumber) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get(`/bookings/${refNumber}`)
      setBooking(data?.data || data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load booking'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [refNumber])

  useEffect(() => {
    if (enabled && refNumber) {
      fetchBooking()
    } else {
      setLoading(false)
    }
  }, [enabled, refNumber, fetchBooking])

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
  }
}
