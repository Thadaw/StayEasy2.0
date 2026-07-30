import { useState, useEffect, useMemo } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { Star, X, Loader2, CreditCard, ShieldCheck, Wifi, Plane, UtensilsCrossed, Smartphone, Building2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRazorpay } from "../hooks/useRazorpay"
import type { RazorpayPaymentResponse } from "../types/razorpay"
import StripeCardForm from "../components/StripeCardForm"
import { hotels, Hotel, RoomType } from "../data/hotels"
import { useBookings } from "../context/BookingContext"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { formatDate } from "../utils/format"
import { getCurrencySymbol } from "../data/worldCountries"
import api from "../api"

type PaymentMethod = "stripe" | "razorpay"

interface ApiProperty {
  id: string; tenant_id: string; name: string; type: string; description: string;
  country: string; state: string; city: string; zip_code: string; address: string;
  latitude: string | null; longitude: string | null; check_in_time: string; check_out_time: string;
  check_in_grace_period: number; check_out_grace_period: number; always_allow_check_in_out: boolean;
  number_of_floors: number; total_rooms: number; year_built: number; phone_number: string;
  email: string; currency: string; timezone: string; language: string; brand_logo_url: string;
  brand_color: string; is_active: boolean;
  system_amenities: { id: string; name: string; icon: string }[];
  custom_amenities: { icon: string | null; name: string }[];
  photos: { cover: string; gallery: string[] };
}

interface ApiRoom {
  id: string; property_id: string; floor_number: number; room_name: string;
  room_type_id: string; bed_type_id: string; max_adults: number; max_children: number;
  base_rate: string; status: string; cancellation_policy: string; cancellation_title: string;
  cancellation_description: string; photos: { cover: string; gallery: string[] };
  system_amenity_ids: string[]; custom_amenities: { icon: string | null; name: string }[];
}

function mapApiPropertyToHotel(apiProp: ApiProperty, rooms: ApiRoom[]): Hotel {
  const allAmenities = [...apiProp.system_amenities.map(a => a.name), ...apiProp.custom_amenities.map(a => a.name)]
  const totalAdults = rooms.reduce((sum, r) => sum + r.max_adults, 0)
  const totalChildren = rooms.reduce((sum, r) => sum + r.max_children, 0)
  const mappedRooms: RoomType[] = rooms.map(r => ({
    id: r.id, name: r.room_name, price: parseFloat(r.base_rate) || 0,
    maxGuests: r.max_adults + r.max_children, bedrooms: 1, beds: 1, bathrooms: 1,
    description: r.cancellation_description || "", totalRooms: 1,
    availableRooms: r.status === "AVAILABLE" ? 1 : 0, roomNumbers: [r.room_name],
    bedType: "", areaSqFt: 300, floorNumber: r.floor_number,
    maxAdults: r.max_adults, maxChildren: r.max_children,
    cancellationTitle: r.cancellation_title, customAmenities: r.custom_amenities,
    image: r.photos?.cover || "", gallery: r.photos?.gallery || [],
    bathroomAmenities: [], roomFacilities: apiProp.system_amenities.map(a => a.name),
    smokingPolicy: "No smoking", cancellationPolicy: r.cancellation_description || "",
    breakfastIncluded: false,
  }))
  return {
    id: 0, name: apiProp.name,
    location: `${apiProp.address}, ${apiProp.city}, ${apiProp.country}`,
    city: apiProp.city, country: apiProp.country,
    lat: apiProp.latitude ? parseFloat(apiProp.latitude) : 0,
    lng: apiProp.longitude ? parseFloat(apiProp.longitude) : 0,
    rating: 4.8, reviews: 0,
    price: rooms.length > 0 ? parseFloat(rooms[0].base_rate) || 0 : 0,
    imageUrl: apiProp.photos?.cover || "", images: apiProp.photos?.gallery || [],
    tag: apiProp.type, isSuperhost: false, category: apiProp.type.toLowerCase(),
    description: apiProp.description || "",
    amenities: allAmenities.length > 0 ? allAmenities : ["Free WiFi"],
    hostName: apiProp.name, hostAvatar: apiProp.brand_logo_url || "",
    hostJoined: "", hostReviews: 0,
    hostBankDetails: { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "", upiId: "" },
    bedrooms: 1, beds: 1, bathrooms: 1,
    maxGuests: totalAdults + totalChildren, maxAdults: totalAdults, maxChildren: totalChildren,
    roomTypes: mappedRooms,
  }
}

interface BookingRoom {
  room_id: string; room_name: string; room_type: string; bed_type: string;
  max_adults: number; max_children: number; base_rate: number; nights: number; subtotal: number;
}

interface BookingData {
  booking_id: string; ref_number: string; status: string;
  check_in: string; check_out: string; nights: number; payment_gateway: string | null;
  property: { id: string; name: string; type: string; city: string; country: string; currency: string };
  rooms: BookingRoom[];
  total_amount: number; subtotal: number; special_offer_discount: number;
  coupon_code: string | null; coupon_discount: number;
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
]

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

  const hotel = apiHotel || hotels.find((h) => h.id === Number(id))
  const CUR = getCurrencySymbol(apiProperty?.currency || bookingData?.property?.currency || 'USD')
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
        } catch { setApiRooms([]) }
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
        return { room: rt || { id: br.room_id, name: br.room_name, price: br.base_rate, maxGuests: br.max_adults + br.max_children } as RoomType, qty: 1, gc: br.max_adults + br.max_children, ep: br.base_rate, lineTotal: br.subtotal }
      })
    }
    return selectedRoomTypes.map(rt => {
      const qty = parsedRooms[rt.id] || 0;
      const gc = parsedGuestCounts[rt.id] || 1;
      const ep = rt.price;
      const lineTotal = qty * ep;
      return { room: rt, qty, gc, ep, lineTotal };
    })
  }, [bookingData, selectedRoomTypes, hotel, parsedRooms, parsedGuestCounts])

  const totalGuests = Object.values(parsedGuestCounts).reduce((s, c) => s + c, 0)
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

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">

        {/* ========== MOBILE LAYOUT ========== */}
        <div className="lg:hidden space-y-5">
          {/* Hotel Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <img
              src={hotel?.imageUrl || hotel?.images?.[0] || ''}
              alt={hotelName}
              className="w-full h-56 object-cover"
            />
            <div className="p-5">
              <div className="flex items-center gap-1 mb-2">
                {hotel && Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(hotel.rating) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
                ))}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {hotelName}
              </h2>
              <p className="text-sm text-gray-500 mb-2">{hotelCity}{hotelCountry ? `, ${hotelCountry}` : ''}</p>
              {hotel && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-white bg-[#003580] px-2 py-1 rounded">
                    {hotel.rating.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {hotel.rating >= 4 ? "Excellent" : hotel.rating >= 3 ? "Good" : "Bad"}
                  </span>
                  <span className="text-sm text-gray-500">· {hotel.reviews} reviews</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <Wifi size={12} /> Free WiFi
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <Plane size={12} /> Airport shuttle
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <UtensilsCrossed size={12} /> Restaurant
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Your booking details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Check-in</p>
                  <p className="text-sm font-bold text-gray-900">{checkIn ? formatDate(checkIn) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Check-out</p>
                  <p className="text-sm font-bold text-gray-900">{checkOut ? formatDate(checkOut) : '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Guests</p>
                  <p className="text-sm font-bold text-gray-900">
                    {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Stays</p>
                  <p className="text-sm font-bold text-gray-900">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Your price summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Original price</span>
                  <span className="text-sm text-gray-900">{CUR}{subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#d4111e] font-medium">Bonus savings</span>
                    <span className="text-sm text-[#d4111e] font-medium">-{CUR}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {appliedDiscount && (
                <p className="text-xs text-gray-500 italic mt-2">
                  You're getting a reduced rate because this property is offering a discount.
                </p>
              )}

              <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                {roomLines.map((l, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{l.room.name} × {nights} night{nights !== 1 ? 's' : ''}</span>
                    <span className="text-gray-900">{CUR}{(l.lineTotal * nights).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Discount code</p>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-700">{appliedDiscount.code}</span>
                      <span className="text-xs text-green-600">
                        {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `${CUR}${appliedDiscount.amount} off`}
                      </span>
                    </div>
                    <button onClick={handleRemovePromo} className="text-green-600 hover:text-green-800 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Enter code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0071c2] transition-colors"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-lg border-2 border-[#0071c2] text-[#0071c2] text-sm font-semibold hover:bg-[#0071c2] hover:text-white transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-xs text-red-500 mt-1">{promoError}</p>
                )}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                {appliedDiscount && (
                  <p className="text-sm text-[#d4111e] line-through mb-1">{CUR}{subtotal.toFixed(2)}</p>
                )}
                <p className="text-xl font-bold text-gray-900">Total {CUR}{Math.max(0, total).toFixed(2)}</p>
                <p className="text-xs text-gray-500">Taxes & fees included</p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-2">How much will it cost to cancel?</h3>
              <p className="text-sm text-[#008009] font-medium mb-1">
                Free cancellation before {checkIn ? formatDate(checkIn) : "check-in date"}
              </p>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>After 12:00 AM on {checkIn ? formatDate(checkIn) : "check-in"}</span>
                <span className="font-medium">{CUR}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Guest details */}
          {(guestName || guestEmail) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Guest details</h3>
                <button
                  onClick={() => navigate(-1)}
                  className="text-xs font-semibold text-[#0071c2] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {guestName && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-gray-900 font-medium">{guestName}</span>
                  </div>
                )}
                {guestEmail && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900">{guestEmail}</span>
                  </div>
                )}
                {guestPhone && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Phone:</span>
                    <span className="text-gray-900">{guestPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Payment Method</h3>
            <div className="flex border-b border-gray-200 mb-6">
              {paymentOptions.map(({ key, label, logo }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPayment(key)}
                  className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                    selectedPayment === key
                      ? "border-[#0071c2] text-[#0071c2]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">{logo} {label}</span>
                </button>
              ))}
            </div>

            {selectedPayment === "stripe" && !stripePaymentIntentId && (
              <StripeCardForm
                refNumber={refNumber}
                amount={total}
                hotelName={hotelName}
                guestName={guestName}
                guestEmail={guestEmail}
                guestPhone={guestPhone}
                onSuccess={(id, secret) => { setStripePaymentIntentId(id); setStripeClientSecret(secret) }}
              />
            )}

            {selectedPayment === "razorpay" && !razorpayResponse && (
              <div className="space-y-4">
                {razorpayOrderLoading && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={16} className="animate-spin text-[#0071c2]" />
                    <span className="text-sm text-gray-500">Initializing Razorpay...</span>
                  </div>
                )}
                {razorpayOrderError && (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{razorpayOrderError}</p>
                  </div>
                )}

                {!razorpayOrderLoading && !razorpayOrderError && razorpayOrderId && (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaySubMethod(paySubMethod === 'upi' ? null : 'upi')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paySubMethod === 'upi'
                        ? 'border-[#0071c2] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Smartphone size={20} className={paySubMethod === 'upi' ? 'text-[#0071c2]' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${paySubMethod === 'upi' ? 'text-[#0071c2]' : 'text-gray-600'}`}>UPI</span>
                  </button>
                  <button
                    onClick={() => setPaySubMethod(paySubMethod === 'card' ? null : 'card')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paySubMethod === 'card'
                        ? 'border-[#0071c2] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <CreditCard size={20} className={paySubMethod === 'card' ? 'text-[#0071c2]' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${paySubMethod === 'card' ? 'text-[#0071c2]' : 'text-gray-600'}`}>Card</span>
                  </button>
                  <button
                    onClick={() => setPaySubMethod(paySubMethod === 'netbanking' ? null : 'netbanking')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paySubMethod === 'netbanking'
                        ? 'border-[#0071c2] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Building2 size={20} className={paySubMethod === 'netbanking' ? 'text-[#0071c2]' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${paySubMethod === 'netbanking' ? 'text-[#0071c2]' : 'text-gray-600'}`}>Net Banking</span>
                  </button>
                </div>
                )}

                {paySubMethod === 'upi' && (
                  <div className="space-y-3">
                    <input
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0071c2] transition-colors"
                    />
                    <button
                      disabled={!upiId || paymentLoading || !razorpayOrderId}
                      onClick={async () => {
                        if (!razorpayOrderId) { toast.error("Razorpay not ready"); return }
                        setPaymentLoading(true)
                        try {
                          const options = {
                            key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                            amount: Math.max(0, total) * 100,
                            currency: "INR",
                            order_id: razorpayOrderId,
                            name: "StayEasy",
                            description: `Booking for ${hotelName}`,
                            handler: (response: RazorpayPaymentResponse) => { setRazorpayResponse(response) },
                            prefill: { contact: guestPhone, email: guestEmail },
                            theme: { color: "#0071c2" },
                          }
                          const razorpay = new (window as any).Razorpay(options)
                          razorpay.on('payment.failed', (response: any) => { toast.error("Payment failed: " + response.error?.description || "Unknown error") })
                          razorpay.open()
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Unknown error"
                          if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
                        } finally { setPaymentLoading(false) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay {CUR}{Math.max(0, total).toFixed(2)} via UPI</>}
                    </button>
                  </div>
                )}

                {paySubMethod === 'card' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">You will be redirected to Razorpay to complete payment.</p>
                    <button
                      disabled={paymentLoading || !razorpayOrderId}
                      onClick={async () => {
                        if (!razorpayOrderId) { toast.error("Razorpay not ready"); return }
                        setPaymentLoading(true)
                        try {
                          const options = {
                            key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                            amount: Math.max(0, total) * 100,
                            currency: "INR",
                            order_id: razorpayOrderId,
                            name: "StayEasy",
                            description: `Booking for ${hotelName}`,
                            handler: (response: RazorpayPaymentResponse) => { setRazorpayResponse(response) },
                            prefill: { contact: guestPhone, email: guestEmail },
                            theme: { color: "#0071c2" },
                          }
                          const razorpay = new (window as any).Razorpay(options)
                          razorpay.on('payment.failed', (response: any) => { toast.error("Payment failed: " + response.error?.description || "Unknown error") })
                          razorpay.open()
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Unknown error"
                          if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
                        } finally { setPaymentLoading(false) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay {CUR}{Math.max(0, total).toFixed(2)} via Card</>}
                    </button>
                  </div>
                )}

                {paySubMethod === 'netbanking' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {["SBI", "HDFC", "ICICI", "Axis"].map(b => (
                        <button
                          key={b}
                          onClick={() => setSelectedBank(b)}
                          className={`py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                            selectedBank === b
                              ? 'border-[#0071c2] bg-blue-50 text-[#0071c2] font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={!selectedBank || paymentLoading || !razorpayOrderId}
                      onClick={async () => {
                        if (!razorpayOrderId) { toast.error("Razorpay not ready"); return }
                        setPaymentLoading(true)
                        try {
                          const options = {
                            key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
                            amount: Math.max(0, total) * 100,
                            currency: "INR",
                            order_id: razorpayOrderId,
                            name: "StayEasy",
                            description: `Booking for ${hotelName}`,
                            handler: (response: RazorpayPaymentResponse) => { setRazorpayResponse(response) },
                            prefill: { contact: guestPhone, email: guestEmail },
                            theme: { color: "#0071c2" },
                          }
                          const razorpay = new (window as any).Razorpay(options)
                          razorpay.on('payment.failed', (response: any) => { toast.error("Payment failed: " + response.error?.description || "Unknown error") })
                          razorpay.open()
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Unknown error"
                          if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
                        } finally { setPaymentLoading(false) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay {CUR}{Math.max(0, total).toFixed(2)} via Net Banking</>}
                    </button>
                  </div>
                )}

                {!razorpayOrderLoading && !razorpayOrderError && razorpayOrderId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Secure Payment via Razorpay</p>
                    <p className="text-xs text-gray-600">Your payment info is encrypted. We never store card details.</p>
                  </div>
                </div>
                )}
              </div>
            )}

            {razorpayResponse && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Payment completed!</p>
                  <p className="text-xs text-green-600 mt-1">Click "Complete booking" below to confirm your reservation.</p>
                </div>
              </div>
            )}

            {stripePaymentIntentId && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Payment completed!</p>
                  <p className="text-xs text-green-600 mt-1">Click "Complete booking" below to confirm your reservation.</p>
                </div>
              </div>
            )}
          </div>

          {/* Confirm button */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={e => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0071c2] cursor-pointer"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                I agree to receiving marketing emails from StayEasy.com, including promotions, personalized recommendations, rewards, travel experiences, and updates about StayEasy.com's products and services.
              </span>
            </label>

            <button
              disabled={!selectedPayment || paymentLoading || (selectedPayment === "razorpay" && !razorpayResponse) || (selectedPayment === "stripe" && !stripePaymentIntentId)}
              onClick={async () => {
                if (!selectedPayment) return

                if (selectedPayment === "stripe" && !stripePaymentIntentId) {
                  toast.error("Please complete payment first")
                  return
                }

                if (selectedPayment === "razorpay" && !razorpayResponse) {
                  toast.error("Please complete payment first by clicking the Razorpay tab")
                  return
                }

                setPaymentLoading(true)
                try {
                  if (selectedPayment === "razorpay" && razorpayResponse && refNumber) {
                    await api.post(`/bookings/${refNumber}/confirm`, {
                      idempotency_key: crypto.randomUUID(),
                      gateway_payload: {
                        razorpay_order_id: razorpayResponse.razorpay_order_id,
                        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                        razorpay_signature: razorpayResponse.razorpay_signature,
                      },
                    })
                  }

                  if (selectedPayment === "stripe" && stripePaymentIntentId && refNumber) {
                    await api.post(`/bookings/${refNumber}/confirm`, {
                      idempotency_key: crypto.randomUUID(),
                      payment_gateway: "stripe",
                      gateway_payload: {
                        payment_intent_id: stripePaymentIntentId,
                        stripe_payment_intent_id: stripePaymentIntentId,
                        client_secret: stripeClientSecret,
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
                    discountApplied: appliedDiscount ? {
                      code: appliedDiscount.code,
                      type: appliedDiscount.type,
                      amount: appliedDiscount.amount,
                    } : undefined,
                  }

                  try {
                    addBooking(localBookingData)
                  } catch {}

                  const booking = {
                    id: refNumber || `${Date.now().toString(36)}`,
                    ...localBookingData,
                    status: "upcoming" as const,
                    createdAt: new Date().toISOString(),
                  }
                  toast.success("Booking confirmed!")
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
              }}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1A3C5E" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#163552"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1A3C5E"}
            >
              {paymentLoading ? "Processing..." : "Complete booking"}
            </button>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-8 items-start">

          {/* LEFT COLUMN — Property Summary */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <img
                src={hotel?.imageUrl || hotel?.images?.[0] || ''}
                alt={hotelName}
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  {hotel && Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(hotel.rating) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
                  ))}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {hotelName}
                </h2>
                <p className="text-sm text-gray-500 mb-2">{hotelCity}{hotelCountry ? `, ${hotelCountry}` : ''}</p>
                {hotel && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-white bg-[#003580] px-2 py-1 rounded">
                      {hotel.rating.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {hotel.rating >= 4 ? "Excellent" : hotel.rating >= 3 ? "Good" : "Bad"}
                    </span>
                    <span className="text-sm text-gray-500">· {hotel.reviews} reviews</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Wifi size={12} /> Free WiFi
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Plane size={12} /> Airport shuttle
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <UtensilsCrossed size={12} /> Restaurant
                  </span>
                </div>
              </div>

              {/* Your booking details */}
              <div className="border-t border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Your booking details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Check-in</p>
                    <p className="text-sm font-bold text-gray-900">
                      {checkIn ? `${formatDate(checkIn)}` : "Select dates"}
                    </p>
                    <p className="text-xs text-gray-400">From 2:00 PM</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Check-out</p>
                    <p className="text-sm font-bold text-gray-900">
                      {checkOut ? `${formatDate(checkOut)}` : "Select dates"}
                    </p>
                    <p className="text-xs text-gray-400">Until 12:00 PM</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Guests</p>
                    <p className="text-sm font-bold text-gray-900">
                      {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Stays</p>
                    <p className="text-sm font-bold text-gray-900">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your price summary */}
              <div className="border-t border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Your price summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Original price</span>
                    <span className="text-sm text-gray-900">{CUR}{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#d4111e] font-medium">Bonus savings</span>
                      <span className="text-sm text-[#d4111e] font-medium">-{CUR}{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {appliedDiscount && (
                  <p className="text-xs text-gray-500 italic mt-2">
                    You're getting a reduced rate because this property is offering a discount.
                  </p>
                )}

                {/* Price breakdown */}
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                  {roomLines.map((l, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{l.room.name} × {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span className="text-gray-900">{CUR}{(l.lineTotal * nights).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Discount code */}
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Discount code</p>
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-700">{appliedDiscount.code}</span>
                        <span className="text-xs text-green-600">
                          {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `${CUR}${appliedDiscount.amount} off`}
                        </span>
                      </div>
                      <button onClick={handleRemovePromo} className="text-green-600 hover:text-green-800 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                        placeholder="Enter code"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0071c2] transition-colors"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-4 py-2 rounded-lg border-2 border-[#0071c2] text-[#0071c2] text-sm font-semibold hover:bg-[#0071c2] hover:text-white transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-500 mt-1">{promoError}</p>
                  )}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  {appliedDiscount && (
                    <p className="text-sm text-[#d4111e] line-through mb-1">{CUR}{subtotal.toFixed(2)}</p>
                  )}
                  <p className="text-xl font-bold text-gray-900">Total {CUR}{Math.max(0, total).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Taxes & fees included</p>
                </div>
              </div>

              {/* Cancellation */}
              <div className="border-t border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2">How much will it cost to cancel?</h3>
                <p className="text-sm text-[#008009] font-medium mb-1">
                  Free cancellation before {checkIn ? formatDate(checkIn) : "check-in date"}
                </p>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>After 12:00 AM on {checkIn ? formatDate(checkIn) : "check-in"}</span>
                  <span className="font-medium">{CUR}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Payment */}
          <div>

            {/* Credit card needed banner */}
            <div className="bg-[#febb02]/10 border border-[#febb02]/30 rounded-xl p-5 mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">credit card needed</h3>
                <p className="text-sm text-gray-600">
                  Your payment will be handled by Hotel, so you need to enter payment details for this booking.
                </p>
              </div>
              <img
                src={hotel?.imageUrl || hotel?.images?.[0] || ''}
                alt={hotelName}
                className="w-16 h-16 rounded-lg object-cover shrink-0 ml-4"
              />
            </div>

            {/* Guest details */}
            {(guestName || guestEmail) && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Guest details</h3>
                  <button
                    onClick={() => navigate(-1)}
                    className="text-xs font-semibold text-[#0071c2] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {guestName && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-900 font-medium">{guestName}</span>
                    </div>
                  )}
                  {guestEmail && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900">{guestEmail}</span>
                    </div>
                  )}
                  {guestPhone && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-900">{guestPhone}</span>
                    </div>
                  )}
                  {specialRequests && (
                    <div className="mt-2">
                      <span className="text-gray-500">Special requests:</span>
                      <p className="text-gray-900 mt-1 text-xs leading-relaxed">{specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment method tabs */}
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Payment Method</h3>
            <div className="flex border-b border-gray-200 mb-6">
              {paymentOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPayment(key)}
                  className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                    selectedPayment === key
                      ? "border-[#0071c2] text-[#0071c2]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Payment form */}
            {selectedPayment === "stripe" && !stripePaymentIntentId && (
              <div className="mb-6">
                <StripeCardForm
                  refNumber={refNumber}
                  amount={total}
                  hotelName={hotelName}
                  guestName={guestName}
                  guestEmail={guestEmail}
                  guestPhone={guestPhone}
                  onSuccess={(id, secret) => { setStripePaymentIntentId(id); setStripeClientSecret(secret) }}
                />
              </div>
            )}

            {selectedPayment === "razorpay" && !razorpayResponse && (
              <div className="space-y-4 mb-6">
                {razorpayOrderLoading && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={16} className="animate-spin text-[#0071c2]" />
                    <span className="text-sm text-gray-500">Initializing Razorpay...</span>
                  </div>
                )}
                {razorpayOrderError && (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{razorpayOrderError}</p>
                  </div>
                )}
                {!razorpayOrderLoading && !razorpayOrderError && razorpayOrderId && (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaySubMethod('upi')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paySubMethod === 'upi'
                        ? 'border-[#0071c2] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paySubMethod === 'upi' ? 'bg-[#0071c2] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Smartphone size={18} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">UPI</span>
                    <span className="text-[10px] text-gray-500">GPay, PhonePe, etc.</span>
                  </button>

                  <button
                    onClick={() => setPaySubMethod('card')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paySubMethod === 'card'
                        ? 'border-[#0071c2] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paySubMethod === 'card' ? 'bg-[#0071c2] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <CreditCard size={18} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">Card</span>
                    <span className="text-[10px] text-gray-500">Debit / Credit</span>
                  </button>

                  <button
                    onClick={() => setPaySubMethod('netbanking')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paySubMethod === 'netbanking'
                        ? 'border-[#0071c2] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paySubMethod === 'netbanking' ? 'bg-[#0071c2] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Building2 size={18} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">Net Banking</span>
                    <span className="text-[10px] text-gray-500">All major banks</span>
                  </button>
                </div>
                )}

                {/* UPI input */}
                {paySubMethod === 'upi' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <label className="block text-xs font-semibold text-gray-700">Enter your UPI ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0071c2] transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">Supported: Google Pay, PhonePe, Paytm, BHIM, etc.</p>
                    <button
                      disabled={!upiId.trim() || paymentLoading || !razorpayOrderId}
                      onClick={async () => {
                        if (!upiId.trim() || !razorpayOrderId) return
                        setPaymentLoading(true)
                        try {
                          const paymentRes = await openCheckout({
                            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                            amount: Math.round(total * 100),
                            currency: "INR",
                            name: "StayEasy",
                            description: `Booking at ${hotelName}`,
                            order_id: razorpayOrderId,
                            config: {
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
                            },
                            prefill: {
                              name: guestName,
                              email: guestEmail,
                              contact: guestPhone,
                              vpa: upiId.trim(),
                            },
                            theme: { color: "#0071c2" },
                          })
                          setRazorpayResponse(paymentRes)
                          toast.success("Payment successful!")
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Unknown error"
                          if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
                        } finally { setPaymentLoading(false) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay {CUR}{Math.max(0, total).toFixed(2)} via UPI</>}
                    </button>
                  </div>
                )}

                {/* Card */}
                {paySubMethod === 'card' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-gray-600">You'll be redirected to Razorpay's secure card checkout.</p>
                    <div className="flex items-center gap-2">
                      {['Visa', 'Mastercard', 'RuPay', 'Amex'].map(b => (
                        <span key={b} className="text-[10px] font-medium bg-white border border-gray-200 rounded px-2 py-1 text-gray-600">{b}</span>
                      ))}
                    </div>
                    <button
                      disabled={paymentLoading || !razorpayOrderId}
                      onClick={async () => {
                        if (!razorpayOrderId) return
                        setPaymentLoading(true)
                        try {
                          const paymentRes = await openCheckout({
                            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                            amount: Math.round(total * 100),
                            currency: "INR",
                            name: "StayEasy",
                            description: `Booking at ${hotelName}`,
                            order_id: razorpayOrderId,
                            prefill: {
                              name: guestName,
                              email: guestEmail,
                              contact: guestPhone,
                            },
                            theme: {
                              color: "#0071c2",
                            },
                          })
                          setRazorpayResponse(paymentRes)
                          toast.success("Payment successful!")
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Unknown error"
                          if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
                        } finally { setPaymentLoading(false) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay {CUR}{Math.max(0, total).toFixed(2)} via Card</>}
                    </button>
                  </div>
                )}

                {/* Net Banking */}
                {paySubMethod === 'netbanking' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <label className="block text-xs font-semibold text-gray-700">Select your bank</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { code: "HDFC", name: "HDFC Bank" },
                        { code: "ICICI", name: "ICICI Bank" },
                        { code: "SBIN", name: "SBI" },
                        { code: "KKBK", name: "Kotak Bank" },
                        { code: "UTIB", name: "Axis Bank" },
                        { code: "PUNB", name: "PNB" },
                        { code: "IDFB", name: "IDFC First" },
                        { code: "YESB", name: "Yes Bank" },
                      ].map(bank => (
                        <button
                          key={bank.code}
                          onClick={() => setSelectedBank(bank.code)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer text-xs ${
                            selectedBank === bank.code
                              ? 'border-[#0071c2] bg-blue-50 text-[#0071c2] font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {selectedBank === bank.code && <CheckCircle2 size={14} className="text-[#0071c2] shrink-0" />}
                          {bank.name}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={!selectedBank || paymentLoading || !razorpayOrderId}
                      onClick={async () => {
                        if (!selectedBank || !razorpayOrderId) return
                        setPaymentLoading(true)
                        try {
                          const paymentRes = await openCheckout({
                            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                            amount: Math.round(total * 100),
                            currency: "INR",
                            name: "StayEasy",
                            description: `Booking at ${hotelName}`,
                            order_id: razorpayOrderId,
                            config: {
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
                            },
                            prefill: {
                              name: guestName,
                              email: guestEmail,
                              contact: guestPhone,
                              bank: selectedBank,
                            },
                            theme: { color: "#0071c2" },
                          })
                          setRazorpayResponse(paymentRes)
                          toast.success("Payment successful!")
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Unknown error"
                          if (msg !== "Payment cancelled") toast.error("Payment failed: " + msg)
                        } finally { setPaymentLoading(false) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay {CUR}{Math.max(0, total).toFixed(2)} via Net Banking</>}
                    </button>
                  </div>
                )}

                {!paySubMethod && !razorpayResponse && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Secure Payment via Razorpay</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Select a payment method above to proceed. All transactions are encrypted and PCI-compliant.
                      </p>
                    </div>
                  </div>
                )}

                {!razorpayLoaded && (
                  <p className="text-xs text-gray-400 text-center">Loading Razorpay...</p>
                )}
              </div>
            )}

            {/* Payment success */}
            {razorpayResponse && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Payment completed!</p>
                  <p className="text-xs text-green-600 mt-1">Click "Complete booking" below to confirm your reservation.</p>
                </div>
              </div>
            )}

            {stripePaymentIntentId && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Payment completed!</p>
                  <p className="text-xs text-green-600 mt-1">Click "Complete booking" below to confirm your reservation.</p>
                </div>
              </div>
            )}

            {/* Marketing checkbox + Complete booking */}
            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0071c2] cursor-pointer"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to receiving marketing emails from StayEasy.com, including promotions, personalized recommendations, rewards, travel experiences, and updates about StayEasy.com's products and services.
                </span>
              </label>

              <button
                disabled={!selectedPayment || paymentLoading || (selectedPayment === "razorpay" && !razorpayResponse) || (selectedPayment === "stripe" && !stripePaymentIntentId)}
                onClick={async () => {
                  if (!selectedPayment) return

                  if (selectedPayment === "stripe" && !stripePaymentIntentId) {
                    toast.error("Please complete payment first")
                    return
                  }

                  if (selectedPayment === "razorpay" && !razorpayResponse) {
                    toast.error("Please complete payment first by clicking the Razorpay tab")
                    return
                  }

                  setPaymentLoading(true)
                  try {
                    if (selectedPayment === "razorpay" && razorpayResponse && refNumber) {
                      await api.post(`/bookings/${refNumber}/confirm`, {
                        idempotency_key: crypto.randomUUID(),
                        gateway_payload: {
                          razorpay_order_id: razorpayResponse.razorpay_order_id,
                          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                          razorpay_signature: razorpayResponse.razorpay_signature,
                        },
                      })
                    }

                    if (selectedPayment === "stripe" && stripePaymentIntentId && refNumber) {
                      await api.post(`/bookings/${refNumber}/confirm`, {
                        idempotency_key: crypto.randomUUID(),
                        payment_gateway: "stripe",
                        gateway_payload: {
                          payment_intent_id: stripePaymentIntentId,
                          stripe_payment_intent_id: stripePaymentIntentId,
                          client_secret: stripeClientSecret,
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
                      discountApplied: appliedDiscount ? {
                        code: appliedDiscount.code,
                        type: appliedDiscount.type,
                        amount: appliedDiscount.amount,
                      } : undefined,
                    }
                    addBooking(localBookingData)
                    const booking = {
                      id: refNumber || `${Date.now().toString(36)}`,
                      ...localBookingData,
                      status: "upcoming" as const,
                      createdAt: new Date().toISOString(),
                    }
                    toast.success("Booking confirmed!")
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
                }}
                className="w-full py-3.5 rounded-xl bg-[#0071c2] text-white font-semibold text-sm hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Complete booking
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                {paymentLoading ? "Please do not close this page" : "Secure payment via Razorpay"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
