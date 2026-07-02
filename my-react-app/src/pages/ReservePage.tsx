import { useState } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { Star, ChevronDown, Check, Circle, Ticket, X } from "lucide-react"
import { hotels } from "../data/hotels"
import { useBookings } from "../context/BookingContext"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

type PaymentMethod = "stripe" | "razorpay"

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

const calcPrice = (basePrice: number, maxGuests: number, guestCount: number) => {
  if (maxGuests <= 1) return basePrice;
  return Math.round(basePrice * (0.85 + 0.15 * (guestCount - 1) / (maxGuests - 1)));
};

export default function ReservePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hotel = hotels.find((h) => h.id === Number(id))
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showPromo, setShowPromo] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'percentage' | 'fixed'; amount: number; code: string } | null>(null)
  const [promoError, setPromoError] = useState('')

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
      setShowPromo(false)
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
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '')

  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatShortDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p className="text-2xl">🏨</p>
        <p className="text-lg font-semibold text-[#111827]">Property not found</p>
        <Link to="/" className="px-5 py-2.5 bg-[#111827] text-white rounded-full text-sm font-medium hover:opacity-90">
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
  const dueToday = subtotal + taxesAndFees - discountAmount;
  const dueAtProperty = resortFee;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors">
          <ChevronDown size={15} className="rotate-90" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
          {/* Left — interactive content */}
          <div>
            {/* Trip details — editable */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-5">
              <h2 className="text-sm font-bold text-[#111827] mb-3">Trip details</h2>
              <div className="border border-[#E5E7EB] rounded-lg">
                <div className="grid grid-cols-2 divide-x divide-[#E5E7EB] rounded-t-lg overflow-hidden">
                  <div className="p-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#374151] mb-0.5">Check-in</label>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full text-xs bg-transparent outline-none text-[#111827]" />
                  </div>
                  <div className="p-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#374151] mb-0.5">Checkout</label>
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full text-xs bg-transparent outline-none text-[#111827]" />
                  </div>
                </div>
                <div className="border-t border-[#E5E7EB] p-2 rounded-b-lg">
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#374151] mb-0.5">Guests</label>
                  <p className="text-xs text-[#111827]">
                    {totalGuests} guest{totalGuests !== 1 ? 's' : ''} across {roomLines.length} room type{roomLines.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>


            {/* Payment Method */}
            <h2 className="text-xl font-bold text-[#111827] mb-5">Payment Method</h2>
            <div className="space-y-3">
              {paymentOptions.map(({ key, label, sub, logo }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPayment(key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPayment === key
                      ? "border-[#111827] bg-[#F9FAFB] shadow-md"
                      : "border-[#E5E7EB] hover:border-[#9CA3AF] hover:bg-[#F3F4F6]"
                  }`}
                >
                  {logo}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827]">{label}</p>
                    <p className="text-xs text-[#6B7280] truncate">{sub}</p>
                  </div>
                  {selectedPayment === key ? (
                    <span className="w-5 h-5 rounded-full bg-[#111827] flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </span>
                  ) : (
                    <Circle size={18} className="text-[#9CA3AF]" />
                  )}
                </button>
              ))}
            </div>

            {selectedPayment && (
              <div className="mt-6 p-5 bg-white border border-[#E5E7EB] rounded-xl">
                <p className="text-sm font-semibold text-[#111827] mb-3">
                  {selectedPayment === "stripe" && "Pay with Stripe"}
                  {selectedPayment === "razorpay" && "Pay with Razorpay"}
                </p>
                <div className="space-y-3">
                  <input type="text" placeholder="Card number" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#111827] transition-colors text-[#111827]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="MM/YY" className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#111827] transition-colors text-[#111827]" />
                    <input type="text" placeholder="CVC" className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#111827] transition-colors text-[#111827]" />
                  </div>
                  <input type="text" placeholder="Cardholder name" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#111827] transition-colors text-[#111827]" />
                </div>
                {selectedPayment === "razorpay" && (
                  <p className="text-xs text-[#6B7280] mt-3">Razorpay also supports UPI, Net Banking, and Wallets.</p>
                )}
              </div>
            )}
          </div>

          {/* Right — Booking Summary Card */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {/* 1. Hotel Information */}
              <div className="pb-[18px] border-b border-[#E5E7EB]">
                <div className="flex gap-4">
                  <img src={hotel.images[0]} alt={hotel.name} className="w-16 h-16 rounded-[10px] object-cover shrink-0" />
                  <div className="flex flex-col gap-[4px] min-w-0">
                    <h3 className="text-lg font-bold text-[#111827] truncate leading-tight">{hotel.name} – {hotel.city}</h3>
                    <p className="text-[13px] text-[#6B7280]">{roomLines.map(l => `${l.qty}× ${l.room.name}`).join(', ')}</p>
                    <div className="flex items-center gap-1">
                      <Star size={11} className="fill-[#111827] stroke-[#111827]" />
                      <span className="text-[13px] font-medium text-[#111827]">{hotel.rating}</span>
                      <span className="text-[13px] text-[#6B7280]">({hotel.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Cancellation Policy */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                <p className="text-[13px] text-[#4B5563] leading-5">
                  Cancel before check-in on {checkIn ? formatDate(checkIn) : 'check-in date'} for a partial refund.
                </p>
                <button className="text-[13px] font-medium text-[#111827] underline mt-1 cursor-pointer">Full policy</button>
              </div>

              {/* 3. Dates */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                <span className="text-[13px] font-medium text-[#374151]">Dates</span>
                <p className="text-[14px] text-[#111827] mt-1">
                  {checkIn && checkOut
                    ? `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}, ${new Date(checkOut).getFullYear()}`
                    : 'Select dates'}
                </p>
              </div>

              {/* 4. Guests */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                <span className="text-[13px] font-medium text-[#374151]">Guests</span>
                <div className="mt-1 space-y-1">
                  {roomLines.map(l => (
                    <p key={l.room.id} className="text-[14px] text-[#111827]">
                      {l.room.name}: {l.gc} guest{l.gc > 1 ? 's' : ''}
                    </p>
                  ))}
                </div>
              </div>

              {/* 5. Location */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                <p className="text-[13px] font-medium text-[#374151] mb-1">Location</p>
                <p className="text-[14px] text-[#4B5563]">{hotel.location}</p>
                <p className="text-[14px] text-[#4B5563]">{hotel.city}, {hotel.country}</p>
              </div>

              {/* 6. Price Details */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-semibold text-[#111827]">Price details</p>
                  <button
                    onClick={() => setShowBreakdown(v => !v)}
                    className="text-[13px] font-medium text-[#111827] underline cursor-pointer"
                  >
                    {showBreakdown ? 'Hide breakdown' : 'Price breakdown'}
                  </button>
                </div>
                <div className="space-y-1">
                  {roomLines.map(l => (
                    <div key={l.room.id} className="flex justify-between items-center text-[14px]">
                      <span className="text-[#4B5563]">${l.ep} × {l.qty} × {nights} night{nights > 1 ? 's' : ''} ({l.room.name})</span>
                      <span className="text-[#111827]">${(l.lineTotal * nights).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {showBreakdown && (
                  <div className="mt-3 space-y-[10px] pt-3 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center text-[14px]">
                      <span className="text-[#4B5563]">Taxes and fees (10%)</span>
                      <span className="text-[#111827]">${taxesAndFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[14px]">
                      <span className="text-[#4B5563]">Resort fee</span>
                      <span className="text-[#111827]">${resortFee.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Promo / Discount Code */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Ticket size={14} className="text-[#16a34a]" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#16a34a]">{appliedDiscount.code}</p>
                        <p className="text-[11px] text-[#15803d]">
                          {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `$${appliedDiscount.amount} off`}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleRemovePromo} className="p-1 rounded-full hover:bg-[#dcfce7] cursor-pointer">
                      <X size={14} className="text-[#16a34a]" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowPromo(v => !v)}
                      className="flex items-center gap-2 text-[13px] font-medium text-[#111827] hover:text-[#2E86AB] transition-colors cursor-pointer"
                    >
                      <Ticket size={14} />
                      {showPromo ? 'Cancel' : 'Have a promo code?'}
                    </button>
                    {showPromo && (
                      <div className="mt-3 flex gap-2">
                        <input
                          value={promoInput}
                          onChange={e => { setPromoInput(e.target.value); setPromoError('') }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                          placeholder="Enter code"
                          className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#111827] transition-colors text-[#111827]"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-black transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-[12px] text-[#e94560] mt-1">{promoError}</p>
                    )}
                  </>
                )}
              </div>

              {/* 8. Total */}
              <div className="py-[18px] border-b border-[#E5E7EB]">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-[#111827]">Total USD</span>
                  <span className="text-base font-bold text-[#111827]">${Math.max(0, total).toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[12px] text-[#16a34a]">Discount applied</span>
                    <span className="text-[12px] text-[#16a34a]">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* 9. Due Today */}
              <div className="pt-[18px]">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-semibold text-[#111827]">Due today</span>
                  <span className="text-[15px] font-semibold text-[#111827]">${Math.max(0, dueToday).toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[12px] text-[#16a34a]">Discount applied</span>
                    <span className="text-[12px] text-[#16a34a]">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[13px] text-[#6B7280]">Due to host at property</span>
                  <span className="text-[13px] text-[#6B7280]">${dueAtProperty.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Confirm button below card */}
            <button
              disabled={!selectedPayment}
              onClick={() => {
                const roomTypeName = selectedRoomTypes.map(r => r.name).join(', ')
                const bookingData = {
                  hotelId: hotel.id,
                  hotelName: hotel.name,
                  hotelCity: hotel.city,
                  hotelCountry: hotel.country,
                  hotelImage: hotel.images[0],
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
                  status: 'upcoming' as const,
                  createdAt: new Date().toISOString(),
                }
                navigate('/booking-confirmation', { state: { booking } })
              }}
              className="w-full mt-6 py-3.5 rounded-xl bg-[#111827] text-white font-semibold text-sm hover:bg-black transition-all disabled:bg-[#D1D5DB] disabled:cursor-not-allowed"
            >
              {selectedPayment ? "Confirm reservation" : "Select a payment method"}
            </button>
            <p className="text-center text-xs text-[#6B7280] mt-3">You won't be charged yet</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
