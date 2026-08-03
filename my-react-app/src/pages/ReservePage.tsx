import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { Star, X, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRazorpay } from "../hooks/useRazorpay"
import type { RazorpayPaymentResponse } from "../types/razorpay"
import { Hotel, RoomType } from "../data/hotels"
import { useBookings } from "../context/BookingContext"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { BookingLayout } from "../components/booking/BookingLayout"
import { PropertySummaryCard } from "../components/booking/PropertySummaryCard"
import { PriceSummaryCard } from "../components/booking/PriceSummaryCard"
import { PaymentMethodTabs } from "../components/booking/PaymentMethodTabs"
import { PaymentForms } from "../components/booking/PaymentForms"
import { ConfirmButton } from "../components/booking/ConfirmButton"
import { ApiProperty, ApiRoom } from "../types/api"
import { mapApiPropertyToHotel } from "../utils/propertyMapper"
import { formatDate } from "../utils/format"
import api from "../api"

type PaymentMethod = "stripe" | "razorpay" | "khalti"

interface BookingRoom {
  room_id: string; room_name: string; room_type: string; bed_type: string;
  max_adults: number; max_children: number; base_rate: number; nights: number; subtotal: number;
  photos?: { cover: string; gallery: string[] };
}

interface BookingData {
  booking_id: string; ref_number: string; status: string;
  check_in: string; check_out: string; nights: number; payment_gateway: string | null;
  property: { id: string; name: string; type: string; city: string; country: string; currency: string };
  rooms: BookingRoom[];
  total_amount: number; subtotal: number; special_offer_discount: number;
  coupon_code: string | null; coupon_discount: number;
  guest_name?: string; guest_email?: string; guest_phone?: string;
  number_of_adults?: number; number_of_children?: number;
}

const paymentOptions: { key: PaymentMethod; label: string; sub: string; logo: JSX.Element }[] = [
  {
    key: "stripe",
    label: "Stripe",
    sub: "Pay via Credit / Debit Card",
    logo: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="4" fill="#635bff" />
        <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">S</text>
      </svg>
    ),
  },
  {
    key: "razorpay",
    label: "Razorpay",
    sub: "Pay via UPI, Card, Net Banking & more",
    logo: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="4" fill="#3399ff" />
        <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">R</text>
      </svg>
    ),
  },
  {
    key: "khalti",
    label: "Khalti",
    sub: "Pay via eWallet, Cards, Net Banking",
    logo: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="4" fill="#5C2D91" />
        <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">K</text>
      </svg>
    ),
  },
]

async function confirmBookingWithRetry(refNumber: string, payload: Record<string, unknown>, maxRetries = 3): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await api.post(`/bookings/${refNumber}/confirm`, payload)
      return
    } catch (err) {
      lastError = err
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError
}

export default function ReservePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [apiProperty, setApiProperty] = useState<ApiProperty | null>(null)
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)

  const apiHotel = useMemo(() => {
    if (!apiProperty) return null
    return mapApiPropertyToHotel(apiProperty, apiRooms)
  }, [apiProperty, apiRooms])

  const hotel = apiHotel
  const CUR = apiProperty?.currency || bookingData?.property?.currency || 'USD'
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'percentage' | 'fixed'; amount: number; code: string } | null>(() => {
    const dc = searchParams.get('discountCode')
    const dt = searchParams.get('discountType') as 'percentage' | 'fixed' | null
    const da = searchParams.get('discountAmount')
    if (dc && dt && da) return { code: dc, type: dt, amount: Number(da) }
    return null
  })
  const [promoError, setPromoError] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
const [razorpayResponse, setRazorpayResponse] = useState<RazorpayPaymentResponse | null>(null)
const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null)
const [razorpayOrderLoading, setRazorpayOrderLoading] = useState(false)
const [razorpayOrderError, setRazorpayOrderError] = useState<string | null>(null)
const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null)
const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
const [stripeIntentLoading, setStripeIntentLoading] = useState(false)
const [stripeIntentError, setStripeIntentError] = useState<string | null>(null)
const [stripeIntentRetry, setStripeIntentRetry] = useState(0)
const stripeIntentFiredRef = useRef<number | null>(null)
const [stripeTransactionTime, setStripeTransactionTime] = useState<number | null>(null)
const [khaltiPaymentIntentId, setKhaltiPaymentIntentId] = useState<string | null>(null)
const [khaltiLoading, setKhaltiLoading] = useState(false)
const [khaltiError, setKhaltiError] = useState<string | null>(null)
const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [paySubMethod, setPaySubMethod] = useState<'upi' | 'card' | 'netbanking' | null>(null)

  const refNumber = searchParams.get('ref') || ''
  const { isLoaded: razorpayLoaded, openCheckout } = useRazorpay()

  useEffect(() => {
    if (!refNumber) return
    const fetchBooking = async () => {
      setApiLoading(true)
      try {
        const { data } = await api.get(`/bookings/${refNumber}`)
        const booking = data?.data || data
        setBookingData(booking)

        if (booking?.coupon_code && booking.coupon_discount > 0 && !appliedDiscount) {
          setAppliedDiscount({
            code: booking.coupon_code,
            type: 'fixed',
            amount: booking.coupon_discount,
          })
        }

        const propertyId = booking?.property?.id || id
        try {
          const propRes = await api.get(`/properties/${propertyId}/public`)
          setApiProperty(propRes.data?.data || null)
        } catch { setApiProperty(null) }
        try {
          const roomsRes = await api.get(`/properties/${propertyId}/rooms/available-rooms`, {
            params: { checkin_date: booking?.check_in, checkout_date: booking?.check_out, adults: 2, children: 0, rooms: 1 },
          })
          setApiRooms(roomsRes.data?.data || [])
        } catch {
          try {
            const allRoomsRes = await api.get(`/properties/${propertyId}/rooms`)
            setApiRooms(allRoomsRes.data?.data || [])
          } catch { setApiRooms([]) }
        }
      } catch {
        setBookingData(null)
        if (id) {
          try {
            const propRes = await api.get(`/properties/${id}/public`)
            setApiProperty(propRes.data?.data || null)
            const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
              params: { checkin_date: searchParams.get('checkIn'), checkout_date: searchParams.get('checkOut'), adults: 2, children: 0, rooms: 1 },
            })
            setApiRooms(roomsRes.data?.data || [])
          } catch {
            setApiProperty(null)
            setApiRooms([])
          }
        }
      } finally {
        setApiLoading(false)
      }
    }
    fetchBooking()
  }, [id, refNumber])

  useEffect(() => {
    if (selectedPayment !== "razorpay" || !refNumber) return
    let cancelled = false
    const createOrder = async () => {
      setRazorpayOrderLoading(true)
      setRazorpayOrderError(null)
      setRazorpayOrderId(null)
      try {
        const { data } = await api.post(`/bookings/${refNumber}/payment-intent`, { payment_gateway: "razorpay" })
        if (cancelled) return
        const orderId = data?.razorpay_order_id || data?.data?.razorpay_order_id || data?.order_id || data?.data?.order_id
        if (!orderId) {
          setRazorpayOrderError("Failed to initialize Razorpay")
          return
        }
        setRazorpayOrderId(orderId)
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : "Failed to initialize Razorpay"
        setRazorpayOrderError(msg)
      } finally {
        if (!cancelled) setRazorpayOrderLoading(false)
      }
    }
    createOrder()
    return () => { cancelled = true }
  }, [selectedPayment, refNumber])

  useEffect(() => {
    if (selectedPayment !== "stripe" || !refNumber) return
    if (stripePaymentIntentId) return
    if (stripeIntentFiredRef.current === stripeIntentRetry) return
    stripeIntentFiredRef.current = stripeIntentRetry
    let cancelled = false
    const createStripeIntent = async () => {
      setStripeIntentLoading(true)
      setStripeIntentError(null)
      try {
        const { data } = await api.post(`/bookings/${refNumber}/payment-intent`, { payment_gateway: "stripe" })
        if (cancelled) return
        const secret = data?.client_secret || data?.data?.client_secret
        if (!secret) {
          setStripeIntentError("Failed to initialize payment")
          return
        }
        setStripeClientSecret(secret)
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : "Failed to initialize payment"
        setStripeIntentError(msg)
      } finally {
        if (!cancelled) setStripeIntentLoading(false)
      }
    }
    createStripeIntent()
    return () => { cancelled = true }
  }, [selectedPayment, refNumber, stripePaymentIntentId, stripeIntentRetry])

  useEffect(() => {
    const khaltiStatus = searchParams.get('khalti_status')
    if (khaltiStatus === 'Completed') {
      const storedIntentId = localStorage.getItem('khalti_payment_intent_id')
      const returnTo = localStorage.getItem('khalti_return_to')
      localStorage.removeItem('khalti_return_to')
      if (storedIntentId) {
        setKhaltiPaymentIntentId(storedIntentId)
        toast.success("Payment successful!")
      }
      if (returnTo && returnTo !== window.location.href) {
        window.location.href = returnTo
      }
    }
  }, [searchParams])

  useEffect(() => {
    const storedIntentId = localStorage.getItem('khalti_payment_intent_id')
    if (storedIntentId && !searchParams.get('khalti_status')) {
      setKhaltiPaymentIntentId(storedIntentId)
      setSelectedPayment("khalti")
    }
  }, [])

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    if (!refNumber) {
      setPromoError('No booking reference found')
      return
    }
    try {
      const { data } = await api.post(`/bookings/${refNumber}/apply-discount`, { code })
      const discount = data?.data || data
      if (discount) {
        setAppliedDiscount({
          code,
          type: discount.type || 'percentage',
          amount: discount.amount || discount.discount || 0,
        })
        setPromoError('')
        setPromoInput('')
      } else {
        setPromoError('Invalid promo code')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid promo code'
      setPromoError(msg)
    }
  }

  const handleRemovePromo = () => {
    setAppliedDiscount(null)
  }

  const roomsParam = searchParams.get('rooms');
  const guestCountsParam = searchParams.get('guestCounts');
  const adultsParam = searchParams.get('adults');
  const childrenParam = searchParams.get('children');
  const parsedRooms: Record<string, number> = roomsParam ? JSON.parse(roomsParam) : {};
  const parsedGuestCounts: Record<string, number> = guestCountsParam ? JSON.parse(guestCountsParam) : {};

  const { addBooking } = useBookings()

  const checkIn = bookingData?.check_in || searchParams.get('checkIn') || ''
  const checkOut = bookingData?.check_out || searchParams.get('checkOut') || ''

  const guestName = searchParams.get('guestName') || ''
  const guestEmail = searchParams.get('guestEmail') || ''
  const guestPhone = searchParams.get('guestPhone') || ''
  const specialRequests = searchParams.get('specialRequests') || ''

  const hotelName = bookingData?.property?.name || hotel?.name || ''
  const hotelCity = bookingData?.property?.city || hotel?.city || ''
  const hotelCountry = bookingData?.property?.country || hotel?.country || ''

  const selectedRoomTypes = useMemo(() => {
    if (!hotel) return []
    if (bookingData?.rooms?.length) {
      return hotel.roomTypes.filter(rt => bookingData.rooms.some(br => br.room_id === rt.id))
    }
    return hotel.roomTypes.filter(rt => parsedRooms[rt.id] && parsedRooms[rt.id] > 0)
  }, [hotel, bookingData, parsedRooms])

  const roomLines = useMemo(() => {
    if (bookingData?.rooms?.length) {
      return bookingData.rooms.map(br => {
        const rt = hotel?.roomTypes.find(r => r.id === br.room_id)
        return {
          room: rt || { id: br.room_id, name: br.room_name, price: br.base_rate, maxGuests: br.max_adults + br.max_children } as RoomType,
          qty: 1, gc: br.max_adults + br.max_children, ep: br.base_rate, lineTotal: br.subtotal,
          cancellationTitle: rt?.cancellationTitle || '',
          cancellationPolicy: rt?.cancellationPolicy || '',
        }
      })
    }
    return selectedRoomTypes.map(rt => {
      const qty = parsedRooms[rt.id] || 0;
      const gc = parsedGuestCounts[rt.id] || 1;
      const ep = rt.price;
      const lineTotal = qty * ep;
      return { room: rt, qty, gc, ep, lineTotal, cancellationTitle: rt.cancellationTitle || '', cancellationPolicy: rt.cancellationPolicy || '' };
    })
  }, [bookingData, selectedRoomTypes, hotel, parsedRooms, parsedGuestCounts])

  const cancellationTitle = apiRooms[0]?.cancellation_title || ''
  const cancellationDescription = apiRooms[0]?.cancellation_description || ''

  const apiGuestCount = (bookingData?.number_of_adults || 0) + (bookingData?.number_of_children || 0)
  const totalGuests = (apiGuestCount > 0 ? apiGuestCount : null)
    || Object.values(parsedGuestCounts).reduce((s, c) => s + c, 0)
    || (adultsParam ? Number(adultsParam) : 0) + (childrenParam ? Number(childrenParam) : 0)
    || bookingData?.rooms?.reduce((s, r) => s + r.max_adults + r.max_children, 0) || 0;

  const nights = bookingData?.nights || (checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1)
  const subtotal = bookingData?.subtotal || roomLines.reduce((s, l) => s + l.lineTotal * nights, 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount = appliedDiscount.type === 'percentage'
      ? Math.round(subtotal * appliedDiscount.amount / 100)
      : appliedDiscount.amount;
  }

  const total = bookingData?.total_amount || (subtotal - discountAmount);

  const handleKhaltiPayment = async () => {
    if (!refNumber) return
    setKhaltiLoading(true)
    setKhaltiError(null)
    try {
      localStorage.setItem('khalti_return_to', window.location.href)
      const return_url = `${window.location.origin}/reserve/${id}?khalti_status=Completed`
      const { data } = await api.post(`/bookings/${refNumber}/payment-intent`, {
        payment_gateway: "khalti",
        return_url,
      })
      const result = data?.data || data
      const intentId = result?.payment_intent_id
      const paymentUrl = result?.payment_url
      if (!paymentUrl || !intentId) {
        setKhaltiError("Failed to initialize Khalti payment")
        setSelectedPayment("khalti")
        return
      }
      localStorage.setItem('khalti_payment_intent_id', intentId)
      window.location.href = paymentUrl
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize Khalti"
      setKhaltiError(msg)
      setSelectedPayment("khalti")
    } finally {
      setKhaltiLoading(false)
    }
  }

  const handleRazorpayPayment = async (options: { type: 'upi' | 'card' | 'netbanking'; upiId?: string; bank?: string }) => {
    if (!razorpayOrderId) { toast.error("Razorpay not ready"); return }
    setPaymentLoading(true)
    try {
      const razorpayOptions: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: Math.max(0, total) * 100,
        currency: "INR",
        order_id: razorpayOrderId,
        name: "StayEasy",
        description: `Booking at ${hotelName}`,
        handler: (response: RazorpayPaymentResponse) => { setRazorpayResponse(response) },
        prefill: {
          name: guestName,
          email: guestEmail,
          contact: guestPhone,
          vpa: options.upiId,
          bank: options.bank,
        },
        theme: { color: "#0071c2" },
      }

      if (options.type === 'upi') {
        razorpayOptions.config = {
          display: {
            blocks: {
              upib: {
                name: "Pay via UPI",
                instruments: [
                  { method: "upi" }
                ]
              }
            },
            sequence: ["block.upib"],
            preferences: {
              show_default_blocks: false
            }
          }
        }
      } else if (options.type === 'netbanking') {
        razorpayOptions.config = {
          display: {
            blocks: {
              nbb: {
                name: "Pay via Net Banking",
                instruments: [
                  { method: "netbanking" }
                ]
              }
            },
            sequence: ["block.nbb"],
            preferences: {
              show_default_blocks: false
            }
          }
        }
      }

      const razorpay = new (window as any).Razorpay(razorpayOptions)
      razorpay.on('payment.failed', (response: any) => { toast.error("Payment failed: " + response.error?.description || "Unknown error") })
      razorpay.open()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
    } finally { setPaymentLoading(false) }
  }

  const handleConfirmBooking = async () => {
    if (!selectedPayment) return

    if (selectedPayment === "stripe" && !stripePaymentIntentId) {
      toast.error("Please complete payment first")
      return
    }

    if (selectedPayment === "razorpay" && !razorpayResponse) {
      toast.error("Please complete payment first by clicking the Razorpay tab")
      return
    }

    if (selectedPayment === "khalti" && !khaltiPaymentIntentId) {
      toast.error("Please complete Khalti payment first")
      return
    }

    setPaymentLoading(true)
    try {
      if (selectedPayment === "razorpay" && razorpayResponse && refNumber) {
        await confirmBookingWithRetry(refNumber, {
          idempotency_key: crypto.randomUUID(),
          gateway_payload: {
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          },
        })
      }

      if (selectedPayment === "stripe" && stripePaymentIntentId && refNumber) {
        await confirmBookingWithRetry(refNumber, {
          idempotency_key: crypto.randomUUID(),
          payment_gateway: "stripe",
          gateway_payload: {
            payment_intent_id: stripePaymentIntentId,
            stripe_payment_intent_id: stripePaymentIntentId,
            client_secret: stripeClientSecret,
          },
        })
      }

      if (selectedPayment === "khalti" && khaltiPaymentIntentId && refNumber) {
        await confirmBookingWithRetry(refNumber, {
          idempotency_key: crypto.randomUUID(),
          gateway_payload: {
            payment_intent_id: khaltiPaymentIntentId,
          },
        })
      }

      const roomTypeName = roomLines.map(l => l.room.name).join(", ")
      const localBookingData = {
        hotelId: bookingData?.property?.id || hotel?.id || id,
        hotelName: hotelName,
        hotelCity: hotelCity,
        hotelCountry: hotelCountry,
        hotelImage: hotel?.imageUrl || hotel?.images?.[0] || '',
        checkIn,
        checkOut,
        roomTypeName,
        guests: totalGuests,
        totalPrice: Math.max(0, total),
        refNumber: refNumber || undefined,
        discountApplied: appliedDiscount ? {
          code: appliedDiscount.code,
          type: appliedDiscount.type,
          amount: appliedDiscount.amount,
        } : undefined,
      }

      const bookingTimestamp = selectedPayment === "stripe" && stripeTransactionTime
        ? new Date(stripeTransactionTime * 1000).toISOString()
        : new Date().toISOString()

      try {
        addBooking({ ...localBookingData, createdAt: bookingTimestamp })
      } catch {}

      const booking = {
        id: refNumber || `${Date.now().toString(36)}`,
        ...localBookingData,
        status: "upcoming" as const,
        createdAt: bookingTimestamp,
      }
      toast.success("Booking confirmed!")
      localStorage.removeItem('khalti_payment_intent_id')
      navigate(`/booking-confirmation/${refNumber || booking.id}`, {
        state: {
          propertyImages: hotel?.images || [],
          amenities: hotel?.amenities || [],
          guestName,
          guestEmail,
          guestPhone,
          totalGuests,
          rating: hotel?.rating,
          reviews: hotel?.reviews,
        }
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error("Booking confirmation failed: " + msg)
    } finally {
      setPaymentLoading(false)
    }
  }

  if (apiLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-[#2E86AB] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading reservation...</p>
      </div>
    )
  }

  if (!hotel && !bookingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p className="text-2xl">🏨</p>
        <p className="text-lg font-semibold text-gray-900">Property not found</p>
        <Link to="/" className="px-5 py-2.5 bg-[#1A3C5E] text-white rounded-full text-sm font-medium hover:opacity-90">
          Back to home
        </Link>
      </div>
    )
  }

  const propertySummaryProps = {
    hotelName,
    hotelCity,
    hotelCountry,
    hotelImage: hotel?.imageUrl || hotel?.images?.[0] || '',
    rating: hotel?.rating || 0,
    reviews: hotel?.reviews || 0,
    amenities: hotel?.amenities || [],
    checkIn,
    checkOut,
    totalGuests,
    nights,
    bookingData,
    guestName,
    guestEmail,
    guestPhone,
    roomLines,
    apiRooms,
    cancellationTitle,
    cancellationDescription,
    currency: CUR,
  }

  const priceSummaryProps = {
    roomLines,
    nights,
    currency: CUR,
    subtotal,
    discountAmount,
    total,
    appliedDiscount,
    promoInput,
    promoError,
    onPromoInputChange: (value: string) => { setPromoInput(value); setPromoError('') },
    onApplyPromo: handleApplyPromo,
    onRemovePromo: handleRemovePromo,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleApplyPromo() },
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Your Selection</span>
            </div>
            <div className="flex-1 h-[2px] bg-[#1A3C5E] mx-4 min-w-[60px] max-w-[120px]" />
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Your Details</span>
            </div>
            <div className="flex-1 h-[2px] bg-gray-200 mx-4 min-w-[60px] max-w-[120px]" />
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm text-gray-500">Finish booking</span>
            </div>
          </div>
        </div>
      </div>

      <BookingLayout
        leftColumn={
          <PropertySummaryCard
            {...propertySummaryProps}
            showPriceSummary={true}
          />
        }
        rightColumn={
          <>
            <PriceSummaryCard {...priceSummaryProps} />

            <PaymentMethodTabs
              paymentOptions={paymentOptions}
              selectedPayment={selectedPayment}
              onSelect={setSelectedPayment}
            />

            <PaymentForms
              selectedPayment={selectedPayment}
              total={total}
              currency={CUR}
              hotelName={hotelName}
              refNumber={refNumber}
              guestName={guestName}
              guestEmail={guestEmail}
              guestPhone={guestPhone}
              id={id}
              paymentLoading={paymentLoading}
              stripePaymentIntentId={stripePaymentIntentId}
              stripeClientSecret={stripeClientSecret}
              stripeIntentLoading={stripeIntentLoading}
              stripeIntentError={stripeIntentError}
              razorpayResponse={razorpayResponse}
              razorpayOrderLoading={razorpayOrderLoading}
              razorpayOrderError={razorpayOrderError}
              razorpayOrderId={razorpayOrderId}
              razorpayLoaded={razorpayLoaded}
              khaltiPaymentIntentId={khaltiPaymentIntentId}
              khaltiLoading={khaltiLoading}
              khaltiError={khaltiError}
              paySubMethod={paySubMethod}
              upiId={upiId}
              selectedBank={selectedBank}
              onSetPaySubMethod={setPaySubMethod}
              onSetUpiId={setUpiId}
              onSetSelectedBank={setSelectedBank}
              onStripeSuccess={(id, secret, createdAt) => { setStripePaymentIntentId(id); setStripeClientSecret(secret); setStripeTransactionTime(createdAt) }}
              onStripeRetry={() => { setStripeClientSecret(null); setStripeIntentRetry(n => n + 1) }}
              onRazorpayPay={handleRazorpayPayment}
              onKhaltiPay={handleKhaltiPayment}
              onSetPaymentLoading={setPaymentLoading}
              onSetKhaltiError={setKhaltiError}
              onSetKhaltiLoading={setKhaltiLoading}
            />

            <ConfirmButton
              selectedPayment={selectedPayment}
              paymentLoading={paymentLoading}
              marketingOptIn={marketingOptIn}
              razorpayResponse={razorpayResponse}
              stripePaymentIntentId={stripePaymentIntentId}
              khaltiPaymentIntentId={khaltiPaymentIntentId}
              onSetMarketingOptIn={setMarketingOptIn}
              onConfirm={handleConfirmBooking}
            />
          </>
        }
      />

      <Footer />
    </div>
  )
}
