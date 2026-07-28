import { useState, useEffect, useMemo } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { Star, X, Loader2, CreditCard, ShieldCheck, Wifi, Plane, UtensilsCrossed } from "lucide-react"
import toast from "react-hot-toast"
import { hotels, Hotel, RoomType } from "../data/hotels"
import { useBookings } from "../context/BookingContext"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { calcPrice } from "../utils/pricing"
import { formatDate } from "../utils/format"
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

  const apiHotel = useMemo(() => {
    if (!apiProperty) return null
    return mapApiPropertyToHotel(apiProperty, apiRooms)
  }, [apiProperty, apiRooms])

  const hotel = apiHotel || hotels.find((h) => h.id === Number(id))
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'percentage' | 'fixed'; amount: number; code: string } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setApiLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
        const checkInDate = searchParams.get('checkIn') || today
        const checkOutDate = searchParams.get('checkOut') || tomorrow
        const guestsParam = searchParams.get("guests")
        const adultsParam = searchParams.get("adults")
        const childrenParam = searchParams.get("children")
        const roomsParamQ = searchParams.get("rooms")
        const adults = adultsParam ? Number(adultsParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[0] || "2") : 2)
        const children = childrenParam ? Number(childrenParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[1] || "0") : 0)
        const rooms = roomsParamQ ? Number(roomsParamQ) : 1
        const propRes = await api.get(`/properties/${id}/public`)
        setApiProperty(propRes.data?.data || null)
        try {
          const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
            params: { checkin_date: checkInDate, checkout_date: checkOutDate, adults, children, rooms },
          })
          setApiRooms(roomsRes.data?.data || [])
        } catch {
          setApiRooms([])
        }
      } catch {
        setApiProperty(null)
        setApiRooms([])
      } finally {
        setApiLoading(false)
      }
    }
    fetchData()
  }, [id, searchParams])

  const validPromos: Record<string, { type: 'percentage' | 'fixed'; amount: number }> = {
    SUMMER20: { type: 'percentage', amount: 20 },
    WELCOME10: { type: 'percentage', amount: 10 },
    STAY50: { type: 'fixed', amount: 50 },
    EARLY15: { type: 'percentage', amount: 15 },
  }

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    const promo = validPromos[code]
    if (promo) {
      setAppliedDiscount({ ...promo, code })
      setPromoError('')
      setPromoInput('')
    } else {
      setPromoError('Invalid promo code')
    }
  }

  const handleRemovePromo = () => {
    setAppliedDiscount(null)
  }

  const roomsParam = searchParams.get('rooms');
  const guestCountsParam = searchParams.get('guestCounts');
  const parsedRooms: Record<string, number> = roomsParam ? JSON.parse(roomsParam) : {};
  const parsedGuestCounts: Record<string, number> = guestCountsParam ? JSON.parse(guestCountsParam) : {};

  const { addBooking } = useBookings()
  const [checkIn] = useState(searchParams.get('checkIn') || '')
  const [checkOut] = useState(searchParams.get('checkOut') || '')

  const guestFirstName = searchParams.get('guestFirstName') || ''
  const guestLastName = searchParams.get('guestLastName') || ''
  const guestEmail = searchParams.get('guestEmail') || ''
  const guestPhone = searchParams.get('guestPhone') || ''
  const specialRequests = searchParams.get('specialRequests') || ''

  if (apiLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-[#2E86AB] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading reservation...</p>
      </div>
    )
  }

  if (!hotel) {
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

  const selectedRoomTypes = hotel.roomTypes.filter(rt => parsedRooms[rt.id] && parsedRooms[rt.id] > 0);

  const roomLines = selectedRoomTypes.map(rt => {
    const qty = parsedRooms[rt.id] || 0;
    const gc = parsedGuestCounts[rt.id] || 1;
    const ep = calcPrice(rt.price, rt.maxGuests, gc);
    const lineTotal = qty * ep;
    return { room: rt, qty, gc, ep, lineTotal };
  });

  const totalGuests = Object.values(parsedGuestCounts).reduce((s, c) => s + c, 0);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1
  const subtotal = roomLines.reduce((s, l) => s + l.lineTotal * nights, 0);
  const taxesAndFees = Math.round(subtotal * 0.10);
  const resortFee = Math.round(roomLines.reduce((s, l) => s + l.ep * l.qty, 0) * 0.06);

  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount = appliedDiscount.type === 'percentage'
      ? Math.round(subtotal * appliedDiscount.amount / 100)
      : appliedDiscount.amount;
  }

  const total = subtotal + taxesAndFees + resortFee - discountAmount;

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
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

          {/* ========== LEFT COLUMN — Property Summary ========== */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <img
                src={hotel.imageUrl || hotel.images[0]}
                alt={hotel.name}
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(hotel.rating) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
                  ))}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {hotel.name}
                </h2>
                <p className="text-sm text-gray-500 mb-2">{hotel.location}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-white bg-[#003580] px-2 py-1 rounded">
                    {hotel.rating.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {hotel.rating >= 4 ? "Excellent" : hotel.rating >= 3 ? "Good" : "Bad"}
                  </span>
                  <span className="text-sm text-gray-500">· {hotel.reviews} reviews</span>
                </div>
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
                    <span className="text-sm text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#d4111e] font-medium">Bonus savings</span>
                      <span className="text-sm text-[#d4111e] font-medium">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {appliedDiscount && (
                  <p className="text-xs text-gray-500 italic mt-2">
                    You're getting a reduced rate because this property is offering a discount.
                  </p>
                )}

                <div className="border-t border-gray-200 mt-4 pt-4">
                  {appliedDiscount && (
                    <p className="text-sm text-[#d4111e] line-through mb-1">${subtotal.toFixed(2)}</p>
                  )}
                  <p className="text-xl font-bold text-gray-900">Total ${Math.max(0, total).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Includes taxes and fees</p>
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <p className="text-sm font-bold text-gray-900 mb-2">Price information</p>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <CreditCard size={14} className="text-gray-500" />
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-semibold text-gray-900">Includes ${taxesAndFees.toFixed(2)} in taxes and fees</p>
                      <p>10% taxes · ${taxesAndFees.toFixed(2)}</p>
                    </div>
                  </div>
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
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo code */}
              <div className="border-t border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Do you have a promo code?</h3>
                <p className="text-xs text-gray-500 mb-2">Enter your promo code</p>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-700">{appliedDiscount.code}</span>
                      <span className="text-xs text-green-600">
                        {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `$${appliedDiscount.amount} off`}
                      </span>
                    </div>
                    <button onClick={handleRemovePromo} className="text-green-600 hover:text-green-800 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                      placeholder=""
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0071c2] transition-colors"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-5 py-2.5 rounded-lg border-2 border-[#0071c2] text-[#0071c2] text-sm font-semibold hover:bg-[#0071c2] hover:text-white transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-xs text-red-500 mt-1">{promoError}</p>
                )}
              </div>
            </div>
          </div>

          {/* ========== RIGHT COLUMN — Payment ========== */}
          <div className="order-1 lg:order-2">

            {/* Credit card needed banner */}
            <div className="bg-[#febb02]/10 border border-[#febb02]/30 rounded-xl p-5 mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">credit card needed</h3>
                <p className="text-sm text-gray-600">
                  Your payment will be handled by Hotel, so you need to enter payment details for this booking.
                </p>
              </div>
              <img
                src={hotel.imageUrl || hotel.images[0]}
                alt={hotel.name}
                className="w-16 h-16 rounded-lg object-cover shrink-0 ml-4"
              />
            </div>

            {/* Guest details */}
            {(guestFirstName || guestLastName || guestEmail) && (
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
                  {guestFirstName && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-900 font-medium">{guestFirstName} {guestLastName}</span>
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

            {/* Card form */}
            {selectedPayment && (
              <div className="space-y-5">
                {selectedPayment === "stripe" ? (
                  <p className="text-sm text-gray-500">Stripe integration is coming soon. Please select Razorpay to proceed.</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Name on card</label>
                      <input
                        type="text"
                        placeholder="Amara Osei"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0071c2] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Card number</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="4821 •••• •••• ••••"
                          maxLength={19}
                          value={cardNumber}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
                            setCardNumber(v)
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0071c2] transition-colors pr-12"
                        />
                        <CreditCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Expiry</label>
                        <input
                          type="text"
                          placeholder="08/29"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g, '')
                            if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2)
                            setCardExpiry(v)
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0071c2] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0071c2] transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <ShieldCheck size={16} className="text-gray-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Your payment information is encrypted and securely processed. We never store your full card details, ensuring a PCI-compliant and safe transaction.
                      </p>
                    </div>
                  </>
                )}
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
                disabled={!selectedPayment || paymentLoading}
                onClick={async () => {
                  if (!selectedPayment) return

                  if (selectedPayment === "stripe") {
                    toast.error("Stripe integration coming soon")
                    return
                  }

                  if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim() || !cardName.trim()) {
                    toast.error("Please fill in all card details")
                    return
                  }

                  setPaymentLoading(true)
                  await new Promise(resolve => setTimeout(resolve, 2500))

                  const roomTypeName = selectedRoomTypes.map(r => r.name).join(", ")
                  const bookingData = {
                    hotelId: hotel.id,
                    hotelName: hotel.name,
                    hotelCity: hotel.city,
                    hotelCountry: hotel.country,
                    hotelImage: hotel.imageUrl || hotel.images[0],
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
                  addBooking(bookingData)
                  const booking = {
                    id: `${Date.now().toString(36)}`,
                    ...bookingData,
                    status: "upcoming" as const,
                    createdAt: new Date().toISOString(),
                  }
                  toast.success("Payment successful!")
                  navigate("/booking-confirmation", { state: { booking } })
                  setPaymentLoading(false)
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
                {paymentLoading ? "Please do not close this page" : "Demo mode — no real charges"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
