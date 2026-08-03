import { useState, useEffect, useCallback, useMemo } from 'react'
import { ApiProperty, ApiRoom } from '../types/api'
import { Hotel } from '../data/hotels'
import { mapApiPropertyToHotel } from '../utils/propertyMapper'
import api from '../api'

interface UsePropertyOptions {
  propertyId: string | null
  checkIn?: string
  checkOut?: string
  adults?: number
  children?: number
  rooms?: number
  enabled?: boolean
}

interface UsePropertyReturn {
  apiProperty: ApiProperty | null
  apiRooms: ApiRoom[]
  hotel: Hotel | null
  currency: string
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProperty({
  propertyId,
  checkIn,
  checkOut,
  adults = 2,
  children = 0,
  rooms = 1,
  enabled = true,
}: UsePropertyOptions): UsePropertyReturn {
  const [apiProperty, setApiProperty] = useState<ApiProperty | null>(null)
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const propRes = await api.get(`/properties/${propertyId}/public`)
      setApiProperty(propRes.data?.data || null)

      try {
        const today = new Date().toISOString().split('T')[0]
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
        const roomsRes = await api.get(`/properties/${propertyId}/rooms/available-rooms`, {
          params: {
            checkin_date: checkIn || today,
            checkout_date: checkOut || tomorrow,
            adults,
            children,
            rooms,
          },
        })
        setApiRooms(roomsRes.data?.data || [])
      } catch {
        setApiRooms([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load property'
      setError(message)
      setApiProperty(null)
      setApiRooms([])
    } finally {
      setLoading(false)
    }
  }, [propertyId, checkIn, checkOut, adults, children, rooms])

  useEffect(() => {
    if (enabled && propertyId) {
      fetchProperty()
    } else {
      setLoading(false)
    }
  }, [enabled, propertyId, fetchProperty])

  const hotel = useMemo(() => {
    if (!apiProperty) return null
    return mapApiPropertyToHotel(apiProperty, apiRooms)
  }, [apiProperty, apiRooms])

  const currency = apiProperty?.currency || 'USD'

  return {
    apiProperty,
    apiRooms,
    hotel,
    currency,
    loading,
    error,
    refetch: fetchProperty,
  }
}
