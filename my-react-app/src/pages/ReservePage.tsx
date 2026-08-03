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
import { BookingStepper } from "../components/booking/BookingStepper"
import { PropertySummaryCard } from "../components/booking/PropertySummaryCard"
import { PriceSummaryCard } from "../components/booking/PriceSummaryCard"
import { PaymentMethodTabs } from "../components/booking/PaymentMethodTabs"
import { PaymentForms } from "../components/booking/PaymentForms"
import { ConfirmButton } from "../components/booking/ConfirmButton"
import { ApiProperty, ApiRoom } from "../types/api"
import { mapPropertyToHotel } from "../utils/propertyMapper"
import { formatDate } from "../utils/format"
import { parseJSON } from "../utils/helpers"
import { calculateNights } from "../utils/time"
import api from "../api"
import type { PaymentMethod, Booking } from "../types/booking"

type BookingData = Booking

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
  const [property, setProperty] = useState<ApiProperty | null>(null)
  const [availableRooms, setAvailableRooms] = useState<ApiRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [booking, setBookingData] = useState<BookingData | null>(null)

  const hotel = useMemo(() => {
    if (!property) return null
    return mapPropertyToHotel(property, availableRooms)
  }, [property, availableRooms])

  const currency = property?.currency || booking?.property?.currency || 'USD'
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
  const [razorpayState, setRazorpayState] = useState({
    response: null as RazorpayPaymentResponse | null,
    orderId: null as string | null,
    loading: false,
    error: null as string | null,
  })
  const [stripeState, setStripeState] = useState({
    paymentIntentId: null as string | null,
    clientSecret: null as string | null,
    loading: false,
    error: null as string | null,
    retry: 0,
    transactionTime: null as number | null,
  })
  const stripeIntentFiredRef = useRef<number | null>(null)
  const [khaltiState, setKhaltiState] = useState({
    paymentIntentId: null as string | null,
    loading: false,
    error: null as string | null,
  })
const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [paySubMethod, setPaySubMethod] = useState<'upi' | 'card' | 'netbanking' | null>(null)

  const refNumber = searchParams.get('ref') || ''
  const { isLoaded: razorpayLoaded, openCheckout } = useRazorpay()

  useEffect(() => {
    if (!refNumber) return
    const fetchBooking = async () => {
      setLoading(true)
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
          setProperty(propRes.data?.data || null)
        } catch { setProperty(null) }
        try {
          const roomsRes = await api.get(`/properties/${propertyId}/rooms/available-rooms`, {
            params: { checkin_date: booking?.check_in, checkout_date: booking?.check_out, adults: 2, children: 0, rooms: 1 },
          })
          setAvailableRooms(roomsRes.data?.data || [])
        } catch {
          try {
            const allRoomsRes = await api.get(`/properties/${propertyId}/rooms`)
            setAvailableRooms(allRoomsRes.data?.data || [])
          } catch { setAvailableRooms([]) }
        }
      } catch {
        setBookingData(null)
        if (id) {
          try {
            const propRes = await api.get(`/properties/${id}/public`)
            setProperty(propRes.data?.data || null)
            const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
              params: { checkin_date: searchParams.get('checkIn'), checkout_date: searchParams.get('checkOut'), adults: 2, children: 0, rooms: 1 },
            })
            setAvailableRooms(roomsRes.data?.data || [])
          } catch {
            setProperty(null)
            setAvailableRooms([])
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [id, refNumber])

  useEffect(() => {
    if (selectedPayment !== "razorpay" || !refNumber) return
    let cancelled = false
    const createOrder = async () => {
      setRazorpayState(prev => ({ ...prev, loading: true, error: null, orderId: null }))
      try {
        const { data } = await api.post(`/bookings/${refNumber}/payment-intent`, { payment_gateway: "razorpay" })
        if (cancelled) return
        const orderId = data?.razorpay_order_id || data?.data?.razorpay_order_id || data?.order_id || data?.data?.order_id
        if (!orderId) {
          setRazorpayState(prev => ({ ...prev, error: "Failed to initialize Razorpay" }))
          return
        }
        setRazorpayState(prev => ({ ...prev, orderId }))
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : "Failed to initialize Razorpay"
        setRazorpayState(prev => ({ ...prev, error: msg }))
      } finally {
        if (!cancelled) setRazorpayState(prev => ({ ...prev, loading: false }))
      }
    }
    createOrder()
    return () => { cancelled = true }
  }, [selectedPayment, refNumber])

  useEffect(() => {
    if (selectedPayment !== "stripe" || !refNumber) return
    if (stripeState.paymentIntentId) return
    if (stripeIntentFiredRef.current === stripeState.retry) return
    stripeIntentFiredRef.current = stripeState.retry
    let cancelled = false
    const createStripeIntent = async () => {
      setStripeState(prev => ({ ...prev, loading: true, error: null }))
      try {
        const { data } = await api.post(`/bookings/${refNumber}/payment-intent`, { payment_gateway: "stripe" })
        if (cancelled) return
        const secret = data?.client_secret || data?.data?.client_secret
        if (!secret) {
          setStripeState(prev => ({ ...prev, error: "Failed to initialize payment" }))
          return
        }
        setStripeState(prev => ({ ...prev, clientSecret: secret }))
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : "Failed to initialize payment"
        setStripeState(prev => ({ ...prev, error: msg }))
      } finally {
        if (!cancelled) setStripeState(prev => ({ ...prev, loading: false }))
      }
    }
    createStripeIntent()
    return () => { cancelled = true }
  }, [selectedPayment, refNumber, stripeState.paymentIntentId, stripeState.retry])

  useEffect(() => {
    const khaltiStatus = searchParams.get('khalti_status')
    if (khaltiStatus === 'Completed') {
      const storedIntentId = localStorage.getItem('khalti_payment_intent_id')
      const returnTo = localStorage.getItem('khalti_return_to')
      localStorage.removeItem('khalti_return_to')
      if (storedIntentId) {
        setKhaltiState(prev => ({ ...prev, paymentIntentId: storedIntentId }))
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
      setKhaltiState(prev => ({ ...prev, paymentIntentId: storedIntentId }))
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
  const selectedRooms: Record<string, number> = parseJSON(roomsParam || '', {});
  const guestAllocation: Record<string, number> = parseJSON(guestCountsParam || '', {});

  const { addBooking } = useBookings()

  const checkIn = booking?.check_in || searchParams.get('checkIn') || ''
  const checkOut = booking?.check_out || searchParams.get('checkOut') || ''

  const guestName = searchParams.get('guestName') || ''
  const guestEmail = searchParams.get('guestEmail') || ''
  const guestPhone = searchParams.get('guestPhone') || ''
  const specialRequests = searchParams.get('specialRequests') || ''

  const hotelName = booking?.property?.name || hotel?.name || ''
  const hotelCity = booking?.property?.city || hotel?.city || ''
  const hotelCountry = booking?.property?.country || hotel?.country || ''

  const selectedRoomTypes = useMemo(() => {
    if (!hotel) return []
    if (booking?.rooms?.length) {
      return hotel.roomTypes.filter(rt => booking.rooms.some(br => br.room_id === rt.id))
    }
    return hotel.roomTypes.filter(rt => selectedRooms[rt.id] && selectedRooms[rt.id] > 0)
  }, [hotel, booking, selectedRooms])

  const roomLines = useMemo(() => {
    if (booking?.rooms?.length) {
      return booking.rooms.map(br => {
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
      const qty = selectedRooms[rt.id] || 0;
      const gc = guestAllocation[rt.id] || 1;
      const ep = rt.price;
      const lineTotal = qty * ep;
      return { room: rt, qty, gc, ep, lineTotal, cancellationTitle: rt.cancellationTitle || '', cancellationPolicy: rt.cancellationPolicy || '' };
    })
  }, [booking, selectedRoomTypes, hotel, selectedRooms, guestAllocation])

  const cancellationTitle = availableRooms[0]?.cancellation_title || ''
  const cancellationDescription = availableRooms[0]?.cancellation_description || ''

  const guestCount = (booking?.number_of_adults || 0) + (booking?.number_of_children || 0)
  const totalGuests = (guestCount > 0 ? guestCount : null)
    || Object.values(guestAllocation).reduce((s, c) => s + c, 0)
    || (adultsParam ? Number(adultsParam) : 0) + (childrenParam ? Number(childrenParam) : 0)
    || booking?.rooms?.reduce((s, r) => s + r.max_adults + r.max_children, 0) || 0;

  const nights = booking?.nights || calculateNights(checkIn, checkOut)
  const subtotal = booking?.subtotal || roomLines.reduce((s, l) => s + l.lineTotal * nights, 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount = appliedDiscount.type === 'percentage'
      ? Math.round(subtotal * appliedDiscount.amount / 100)
      : appliedDiscount.amount;
  }

  const total = booking?.total_amount || (subtotal - discountAmount);

  const handleKhaltiPayment = async () => {
    if (!refNumber) return
    setKhaltiState(prev => ({ ...prev, loading: true, error: null }))
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
        setKhaltiState(prev => ({ ...prev, error: "Failed to initialize Khalti payment" }))
        setSelectedPayment("khalti")
        return
      }
      localStorage.setItem('khalti_payment_intent_id', intentId)
      window.location.href = paymentUrl
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize Khalti"
      setKhaltiState(prev => ({ ...prev, error: msg }))
      setSelectedPayment("khalti")
    } finally {
      setKhaltiState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleRazorpayPayment = async (options: { type: 'upi' | 'card' | 'netbanking'; upiId?: string; bank?: string }) => {
    if (!razorpayState.orderId) { toast.error("Razorpay not ready"); return }
    setPaymentLoading(true)
    try {
      const razorpayOptions: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: Math.max(0, total) * 100,
        currency: "INR",
        order_id: razorpayState.orderId,
        name: "StayEasy",
        description: `Booking at ${hotelName}`,
        handler: (response: RazorpayPaymentResponse) => { setRazorpayState(prev => ({ ...prev, response })) },
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

    if (selectedPayment === "stripe" && !stripeState.paymentIntentId) {
      toast.error("Please complete payment first")
      return
    }

    if (selectedPayment === "razorpay" && !razorpayState.response) {
      toast.error("Please complete payment first by clicking the Razorpay tab")
      return
    }

    if (selectedPayment === "khalti" && !khaltiState.paymentIntentId) {
      toast.error("Please complete Khalti payment first")
      return
    }

    setPaymentLoading(true)
    try {
      if (selectedPayment === "razorpay" && razorpayState.response && refNumber) {
        await confirmBookingWithRetry(refNumber, {
          idempotency_key: crypto.randomUUID(),
          gateway_payload: {
            razorpay_order_id: razorpayState.response.razorpay_order_id,
            razorpay_payment_id: razorpayState.response.razorpay_payment_id,
            razorpay_signature: razorpayState.response.razorpay_signature,
          },
        })
      }

      if (selectedPayment === "stripe" && stripeState.paymentIntentId && refNumber) {
        await confirmBookingWithRetry(refNumber, {
          idempotency_key: crypto.randomUUID(),
          payment_gateway: "stripe",
          gateway_payload: {
            payment_intent_id: stripeState.paymentIntentId,
            stripe_payment_intent_id: stripeState.paymentIntentId,
            client_secret: stripeState.clientSecret,
          },
        })
      }

      if (selectedPayment === "khalti" && khaltiState.paymentIntentId && refNumber) {
        await confirmBookingWithRetry(refNumber, {
          idempotency_key: crypto.randomUUID(),
          gateway_payload: {
            payment_intent_id: khaltiState.paymentIntentId,
          },
        })
      }

      const roomTypeName = roomLines.map(l => l.room.name).join(", ")
      const localBookingData = {
        hotelId: booking?.property?.id || hotel?.id || id,
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

      const bookingTimestamp = selectedPayment === "stripe" && stripeState.transactionTime
        ? new Date(stripeState.transactionTime * 1000).toISOString()
        : new Date().toISOString()

      try {
        addBooking({ ...localBookingData, createdAt: bookingTimestamp })
      } catch {}

      const newBooking = {
        id: refNumber || `${Date.now().toString(36)}`,
        ...localBookingData,
        status: "upcoming" as const,
        createdAt: bookingTimestamp,
      }
      toast.success("Booking confirmed!")
      localStorage.removeItem('khalti_payment_intent_id')
      navigate(`/booking-confirmation/${refNumber || newBooking.id}`, {
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-[#2E86AB] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading reservation...</p>
      </div>
    )
  }

  if (!hotel && !booking) {
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
    booking,
    guestName,
    guestEmail,
    guestPhone,
    roomLines,
    availableRooms,
    cancellationTitle,
    cancellationDescription,
    currency: currency,
  }

  const priceSummaryProps = {
    roomLines,
    nights,
    currency: currency,
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

      <BookingStepper currentStep={2} />

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
              currency={currency}
              hotelName={hotelName}
              refNumber={refNumber}
              guestName={guestName}
              guestEmail={guestEmail}
              guestPhone={guestPhone}
              paymentLoading={paymentLoading}
              stripePaymentIntentId={stripeState.paymentIntentId}
              stripeClientSecret={stripeState.clientSecret}
              stripeIntentLoading={stripeState.loading}
              stripeIntentError={stripeState.error}
              razorpayResponse={razorpayState.response}
              razorpayOrderLoading={razorpayState.loading}
              razorpayOrderError={razorpayState.error}
              razorpayOrderId={razorpayState.orderId}
              razorpayLoaded={razorpayLoaded}
              khaltiPaymentIntentId={khaltiState.paymentIntentId}
              khaltiLoading={khaltiState.loading}
              khaltiError={khaltiState.error}
              paySubMethod={paySubMethod}
              upiId={upiId}
              selectedBank={selectedBank}
              onSetPaySubMethod={setPaySubMethod}
              onSetUpiId={setUpiId}
              onSetSelectedBank={setSelectedBank}
              onStripeSuccess={(id, secret, createdAt) => { setStripeState(prev => ({ ...prev, paymentIntentId: id, clientSecret: secret, transactionTime: createdAt })) }}
              onStripeRetry={() => { setStripeState(prev => ({ ...prev, clientSecret: null, retry: prev.retry + 1 })) }}
              onRazorpayPay={handleRazorpayPayment}
              onSetKhaltiError={(error) => setKhaltiState(prev => ({ ...prev, error }))}
              onSetKhaltiLoading={(loading) => setKhaltiState(prev => ({ ...prev, loading }))}
            />

            <ConfirmButton
              selectedPayment={selectedPayment}
              paymentLoading={paymentLoading}
              marketingOptIn={marketingOptIn}
              razorpayResponse={razorpayState.response}
              stripePaymentIntentId={stripeState.paymentIntentId}
              khaltiPaymentIntentId={khaltiState.paymentIntentId}
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
