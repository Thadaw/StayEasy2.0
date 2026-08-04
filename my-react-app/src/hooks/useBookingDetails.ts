import { useEffect, useState } from "react"
import { useBookings } from "../context/BookingContext"
import { useAuth } from "../context/AuthContext"
import { calculateNights } from "../utils/time"
import { buildPropertyLocation, calculatePriceBreakdown } from "../utils/bookingHelpers"
import api from "../api"
import type { Booking } from "../types/booking"

interface PropertyDetails {
  address: string
  state: string
  phone: string
  email: string
  lat: string | number | null
  lng: string | number | null
}

interface GuestProfile {
  name?: string
  email?: string
  phone?: string
  nationality?: string
}

export function useBookingDetails(id: string | undefined) {
  const { bookings } = useBookings()
  const { user } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [coverPhoto, setCoverPhoto] = useState("")
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    address: "",
    state: "",
    phone: "",
    email: "",
    lat: null,
    lng: null,
  })
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    const localMatch = bookings.find((b) => b.refNumber === id || b.id === id)

    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${localMatch?.refNumber || id}`)
        const result = data?.data || data
        setBooking(result)
        if (result?.property?.id) {
          try {
            const { data: propRes } = await api.get(`/properties/${result.property.id}/public`)
            const prop = propRes?.data
            const photos = prop?.photos
            if (photos?.cover) setCoverPhoto(photos.cover)
            if (prop) {
              setPropertyDetails({
                address: prop.address || "",
                state: prop.state || "",
                phone: prop.phone_number || "",
                email: prop.email || "",
                lat: prop.latitude || null,
                lng: prop.longitude || null,
              })
            }
          } catch {
            // property fetch failed
          }
        }
      } catch {
        // API booking not found — will fall back to local BookingContext data
      }
    }

    const fetchMeBookings = async () => {
      try {
        const { data } = await api.get("/bookings/me")
        const items = data?.data?.items ?? data?.data ?? data?.items ?? []
        if (Array.isArray(items)) {
          const targetRef = localMatch?.refNumber || id
          const match = items.find(
            (it: { ref_number?: string; id?: string }) => it.ref_number === targetRef || it.id === targetRef
          )
          if (match) {
            const guest = match.guest || match.guest_details || {}
            setGuestProfile((prev) => ({
              name: prev?.name || match.full_name || match.guest_name || guest.full_name || "",
              email: prev?.email || match.email || match.guest_email || guest.email || "",
              phone: prev?.phone || match.phone || match.guest_phone || guest.phone || "",
              nationality: prev?.nationality || match.nationality || guest.nationality || "",
            }))
          }
        }
      } catch {
        // fallback
      }
    }

    const fetchGuestProfile = async () => {
      try {
        const { data } = await api.get("/auth/guests/me")
        if (data) {
          setGuestProfile((prev) => ({
            name: prev?.name || data.full_name || "",
            email: prev?.email || data.email || "",
            phone: prev?.phone || data.phone || "",
            nationality: prev?.nationality || data.nationality || "",
          }))
        }
      } catch {
        // fallback
      }
    }

    Promise.allSettled([fetchBooking(), fetchMeBookings(), fetchGuestProfile()]).finally(() => setLoading(false))
  }, [id, bookings])

  const localBooking = bookings.find((b) => b.refNumber === id || b.id === id)

  const propertyName = booking?.property?.name || localBooking?.hotelName || ""
  const propertyCity = booking?.property?.city || localBooking?.hotelCity || ""
  const propertyCountry = booking?.property?.country || localBooking?.hotelCountry || ""
  const propertyId = booking?.property?.id || localBooking?.hotelId || ""
  const propertyLocation = buildPropertyLocation(propertyDetails.address, propertyCity, propertyDetails.state, propertyCountry)
  const currency = booking?.property?.currency || "USD"
  const nights = booking?.nights || (localBooking ? calculateNights(localBooking.checkIn, localBooking.checkOut) : 1)
  const checkIn = booking?.check_in || localBooking?.checkIn || ""
  const checkOut = booking?.check_out || localBooking?.checkOut || ""
  const adults = booking?.number_of_adults ?? localBooking?.guests ?? 0
  const children = booking?.number_of_children ?? 0
  const totalGuests = adults + children
  const rooms = booking?.rooms || []
  const roomNames = rooms.length > 0 ? rooms.map((r) => r.room_name).join(", ") : localBooking?.roomTypeName || ""
  const totalAmount = booking?.total_amount || localBooking?.totalPrice || 0
  const subtotal = booking?.subtotal || 0
  const specialOfferDiscount = booking?.special_offer_discount || 0
  const couponDiscount = booking?.coupon_discount || 0
  const paymentStatus = booking?.payment_status || (localBooking ? "paid" : null)
  const paymentGateway = booking?.payment_gateway || ""
  const refNumber = booking?.ref_number || localBooking?.refNumber || localBooking?.id || id || ""
  const createdAt = booking?.created_at || localBooking?.createdAt || new Date().toISOString()
  const bookingStatus = booking?.status || localBooking?.status || "upcoming"
  const statusLabel = bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)

  const guestName = guestProfile?.name || booking?.guest_name || user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Guest"
  const guestEmail = guestProfile?.email || booking?.guest_email || user?.email || ""
  const guestPhone = guestProfile?.phone || booking?.guest_phone || ""
  const guestNationality = guestProfile?.nationality || ""

  const coverImage = coverPhoto || localBooking?.hotelImage || ""

  const { taxAmount, basePrice } = calculatePriceBreakdown(totalAmount, subtotal, specialOfferDiscount, couponDiscount, rooms)

  return {
    booking,
    localBooking,
    loading,
    coverImage,
    propertyName,
    propertyCity,
    propertyCountry,
    propertyId,
    propertyLocation,
    propertyDetails,
    currency,
    nights,
    checkIn,
    checkOut,
    adults,
    children,
    totalGuests,
    rooms,
    roomNames,
    totalAmount,
    subtotal,
    specialOfferDiscount,
    couponDiscount,
    paymentStatus,
    paymentGateway,
    refNumber,
    createdAt,
    bookingStatus,
    statusLabel,
    guestName,
    guestEmail,
    guestPhone,
    guestNationality,
    taxAmount,
    basePrice,
  }
}
