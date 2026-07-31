import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { Booking } from '../types'

interface BookingContextValue {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void
  cancelBooking: (id: string) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

function getStorageKey(userId?: number): string {
  return userId ? `bookings_${userId}` : 'bookings_guest'
}

function loadBookings(userId?: number): Booking[] {
  try {
    const data = localStorage.getItem(getStorageKey(userId))
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveBookings(bookings: Booking[], userId?: number) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(bookings))
}

function autoCompletePastBookings(bookings: Booking[]): Booking[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return bookings.map(b => {
    if (b.status === 'upcoming' && new Date(b.checkOut) < today) {
      return { ...b, status: 'completed' as const }
    }
    return b
  })
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const loaded = loadBookings(user?.id)
    return autoCompletePastBookings(loaded)
  })

  useEffect(() => {
    const loaded = loadBookings(user?.id)
    setBookings(autoCompletePastBookings(loaded))
  }, [user?.id])

  useEffect(() => {
    saveBookings(bookings, user?.id)
  }, [bookings, user?.id])

  const addBooking = useCallback(
    (data: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
      const newBooking: Booking = {
        ...data,
        id: data.refNumber || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      }
      setBookings(prev => {
        const updated = autoCompletePastBookings([newBooking, ...prev])
        return updated
      })
    },
    []
  )

  const cancelBooking = useCallback(
    (id: string) => {
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'cancelled' as const } : b))
      )
    },
    []
  )

  return (
    <BookingContext.Provider value={{ bookings, addBooking, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings must be inside BookingProvider')
  return ctx
}
