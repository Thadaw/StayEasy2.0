import { useNavigate } from 'react-router-dom'
import { Star, Wifi, Plane, UtensilsCrossed, BedDouble } from 'lucide-react'
import { formatDate } from '../../utils/format'

interface RoomLine {
  room: {
    id: string
    name: string
    price: number
    maxGuests: number
    bedType?: string
    roomTypeName?: string
    cancellationTitle?: string
    cancellationPolicy?: string
  }
  qty: number
  gc: number
  ep: number
  lineTotal: number
  cancellationTitle?: string
  cancellationPolicy?: string
}

interface ApiRoom {
  id: string
  room_name: string
  room_type_id?: string
  max_adults: number
  max_children: number
  photos?: { cover: string; gallery: string[] }
}

interface PropertySummaryCardProps {
  hotelName: string
  hotelCity: string
  hotelCountry: string
  hotelImage?: string
  rating: number
  reviews: number
  amenities: string[]
  checkIn: string
  checkOut: string
  totalGuests: number
  nights: number
  bookingData?: {
    number_of_adults?: number
    number_of_children?: number
  } | null
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  roomLines: RoomLine[]
  apiRooms: ApiRoom[]
  cancellationTitle?: string
  cancellationDescription?: string
  currency: string
  showPriceSummary?: boolean
  subtotal?: number
  discountAmount?: number
  total?: number
  appliedDiscount?: {
    code: string
    type: 'percentage' | 'fixed'
    amount: number
  } | null
  promoInput?: string
  promoError?: string
  onPromoInputChange?: (value: string) => void
  onApplyPromo?: () => void
  onRemovePromo?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function PropertySummaryCard({
  hotelName,
  hotelCity,
  hotelCountry,
  hotelImage,
  rating,
  reviews,
  amenities,
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
  currency,
  showPriceSummary = false,
  subtotal = 0,
  discountAmount = 0,
  total = 0,
  appliedDiscount,
  promoInput = '',
  promoError = '',
  onPromoInputChange,
  onApplyPromo,
  onRemovePromo,
  onKeyDown,
}: PropertySummaryCardProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <img
        src={hotelImage || ''}
        alt={hotelName}
        className="w-full h-56 object-cover"
      />
      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} className={i < Math.floor(rating) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
          ))}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          {hotelName}
        </h2>
        <p className="text-sm text-gray-500 mb-2">{hotelCity}{hotelCountry ? `, ${hotelCountry}` : ''}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-white bg-[#003580] px-2 py-1 rounded">
            {rating.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {rating >= 4 ? "Excellent" : rating >= 3 ? "Good" : "Bad"}
          </span>
          <span className="text-sm text-gray-500">· {reviews} reviews</span>
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

      <div className="border-t border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Your booking details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Check-in</p>
            <p className="text-sm font-bold text-gray-900">{checkIn ? formatDate(checkIn) : '—'}</p>
            <p className="text-xs text-gray-400 hidden lg:block">From 2:00 PM</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Check-out</p>
            <p className="text-sm font-bold text-gray-900">{checkOut ? formatDate(checkOut) : '—'}</p>
            <p className="text-xs text-gray-400 hidden lg:block">Until 12:00 PM</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Guests</p>
            <p className="text-sm font-bold text-gray-900">
              {bookingData?.number_of_adults != null
                ? `${bookingData.number_of_adults} adult${bookingData.number_of_adults !== 1 ? 's' : ''}${(bookingData.number_of_children || 0) > 0 ? `, ${bookingData.number_of_children} child${bookingData.number_of_children !== 1 ? 'ren' : ''}` : ''}`
                : `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`}
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

      {roomLines.length > 0 && (
        <div className="border-t border-gray-200 p-5 hidden lg:block">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Room details</h3>
          <div className="space-y-3">
            {roomLines.map((rl, i) => {
              const apiRoom = apiRooms.find(r => r.id === rl.room.id || r.room_name === rl.room.name)
              const cover = apiRoom?.photos?.cover || ''
              return (
                <div key={i} className="flex items-start gap-3">
                  {cover ? (
                    <img src={cover} alt={rl.room.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <BedDouble size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{rl.room.name}</p>
                    <p className="text-xs text-gray-500">{rl.room.roomTypeName || rl.room.bedType || ''}</p>
                    <p className="text-xs text-gray-400">
                      {rl.gc} guest{rl.gc !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{currency}{rl.ep.toFixed(2)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(guestName || guestEmail) && (
        <div className="border-t border-gray-200 p-5">
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

      {showPriceSummary && (
        <div className="border-t border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Your price summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Original price</span>
              <span className="text-sm text-gray-900">{currency}{subtotal.toFixed(2)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#d4111e] font-medium">Bonus savings</span>
                <span className="text-sm text-[#d4111e] font-medium">-{currency}{discountAmount.toFixed(2)}</span>
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
                <span className="text-gray-900">{currency}{(l.lineTotal * nights).toFixed(2)}</span>
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
                    {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `${currency}${appliedDiscount.amount} off`}
                  </span>
                </div>
                <button onClick={onRemovePromo} className="text-green-600 hover:text-green-800 cursor-pointer">
                  ×
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={e => onPromoInputChange?.(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Enter code"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0071c2] transition-colors"
                />
                <button
                  onClick={onApplyPromo}
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
              <p className="text-sm text-[#d4111e] line-through mb-1">{currency}{subtotal.toFixed(2)}</p>
            )}
            <p className="text-xl font-bold text-gray-900">Total {currency}{Math.max(0, total).toFixed(2)}</p>
            <p className="text-xs text-gray-500">Taxes & fees included</p>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-2">How much will it cost to cancel?</h3>
        {cancellationTitle || cancellationDescription ? (
          <>
            {cancellationTitle && (
              <p className="text-sm text-[#008009] font-medium mb-1">{cancellationTitle}</p>
            )}
            {cancellationDescription && (
              <p className="text-xs text-gray-600 leading-relaxed">{cancellationDescription}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-[#008009] font-medium mb-1">
            Free cancellation before {checkIn ? formatDate(checkIn) : "check-in date"}
          </p>
        )}
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>After 12:00 AM on {checkIn ? formatDate(checkIn) : "check-in"}</span>
          <span className="font-medium">{currency}{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
