import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Copy, Download, Share2, QrCode, MapPin, ShieldCheck, CircleAlert, ArrowRight, Wifi, Plane, UtensilsCrossed, Star } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import api from '../api'
import toast from 'react-hot-toast'

interface ConfirmationRoom {
  room_id: string; room_name: string; room_type: string; bed_type: string;
  max_adults: number; max_children: number; base_rate: number; nights: number; subtotal: number;
}

interface ConfirmationBooking {
  booking_id: string; ref_number: string; status: string;
  check_in: string; check_out: string; nights: number;
  adults: number; children: number; total_guests: number;
  payment_gateway: string | null; payment_status: string | null;
  property: { id: string; name: string; type: string; city: string; country: string; currency: string };
  rooms: ConfirmationRoom[];
  total_amount: number; subtotal: number; special_offer_discount: number;
  coupon_code: string | null; coupon_discount: number;
}

interface ConfirmationState {
  propertyImages?: string[]
  amenities?: string[]
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  totalGuests?: number
  rating?: number
  reviews?: number
}

function buildQrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function BookingConfirmationPage() {
  const { refNumber } = useParams<{ refNumber: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateData = (location.state as ConfirmationState | null) || null
  const [booking, setBooking] = useState<ConfirmationBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    if (!refNumber) { setLoading(false); return }
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${refNumber}`)
        setBooking(data?.data || data)
      } catch {
        toast.error('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [refNumber])

  const confirmationCode = booking?.ref_number || 'STY-000000'
  const propertyName = booking?.property?.name || ''
  const propertyCity = booking?.property?.city || ''
  const propertyCountry = booking?.property?.country || ''
  const roomNames = booking?.rooms?.map(r => r.room_name).join(', ') || ''
  const CUR = booking?.property?.currency || 'USD'
  const totalGuests = stateData?.totalGuests || (booking?.adults || 0) + (booking?.children || 0) || booking?.total_guests || booking?.rooms?.reduce((s, r) => s + r.max_adults + r.max_children, 0) || 0

  const shareText = propertyName
    ? `StayEasy booking confirmed for ${propertyName}. Confirmation code: ${confirmationCode}. Check-in ${fmtDate(booking?.check_in || '')}.`
    : ''

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(confirmationCode)
      setCopied(true)
      setShareMessage('Confirmation code copied to clipboard.')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setShareMessage('Clipboard access is not available in this browser.')
    }
  }

  const handleShare = async () => {
    const shareData = { title: 'StayEasy booking confirmed', text: shareText, url: window.location.href }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareMessage('Booking details shared successfully.')
      } else {
        await navigator.clipboard.writeText(shareText)
        setShareMessage('Sharing is not available here, so the details were copied instead.')
      }
    } catch {
      setShareMessage('Sharing was cancelled.')
    }
  }

  const handleDownloadReceipt = () => {
    if (!booking) return
    const receiptDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const receiptTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const receiptNo = `RCP-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 20px; }
          .receipt { background: white; max-width: 500px; width: 100%; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #1a1a1a; }
          .tagline { font-size: 11px; color: #666; margin-top: 2px; text-align: center; }
          .divider { border: none; border-top: 2px dashed #ccc; margin: 15px 0; }
          .title { text-align: center; font-size: 16px; font-weight: 700; letter-spacing: 2px; margin: 15px 0; }
          .row { display: flex; padding: 6px 0; }
          .label { width: 140px; font-size: 13px; color: #333; }
          .colon { width: 15px; font-size: 13px; color: #333; }
          .value { flex: 1; font-size: 13px; font-weight: 600; color: #1a1a1a; }
          .total-row { display: flex; padding: 10px 0; margin-top: 10px; }
          .total-label { width: 140px; font-size: 16px; font-weight: 700; color: #1a1a1a; }
          .total-colon { width: 15px; font-size: 16px; font-weight: 700; color: #1a1a1a; }
          .total-value { flex: 1; font-size: 18px; font-weight: 700; color: #1a1a1a; }
          .thank-you { text-align: center; margin: 20px 0; font-size: 12px; color: #333; line-height: 1.6; }
          .important { text-align: center; margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .important-title { font-size: 13px; font-weight: 700; margin-bottom: 5px; }
          .important-text { font-size: 11px; color: #555; line-height: 1.5; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; line-height: 1.6; }
          .tear { text-align: center; margin-top: 15px; font-size: 20px; color: #ccc; letter-spacing: 3px; }
          @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <img src="${window.location.origin}/logo1.png" alt="StayEasy" style="height: 50px;">
            <span style="font-size: 28px; font-weight: 800; color: #1a1a1a;">StayEasy</span>
          </div>
          <div class="tagline">Make Every Stay Effortless</div>
          <hr class="divider">
          <div class="title">STAYEASY BOOKING RECEIPT</div>
          <hr class="divider">
          
          <div class="row">
            <span class="label">Confirmation Code</span>
            <span class="colon">:</span>
            <span class="value">${confirmationCode}</span>
          </div>
          <div class="row">
            <span class="label">Booking Date</span>
            <span class="colon">:</span>
            <span class="value">${receiptDate}  ${receiptTime}</span>
          </div>
          <div class="row">
            <span class="label">Receipt No.</span>
            <span class="colon">:</span>
            <span class="value">${receiptNo}</span>
          </div>
          
          <hr class="divider">
          
          <div class="row">
            <span class="label">Hotel</span>
            <span class="colon">:</span>
            <span class="value">${propertyName}</span>
          </div>
          <div class="row">
            <span class="label">Location</span>
            <span class="colon">:</span>
            <span class="value">${propertyCity}, ${propertyCountry}</span>
          </div>
          <div class="row">
            <span class="label">Check-in</span>
            <span class="colon">:</span>
            <span class="value">${fmtDate(booking.check_in)}</span>
          </div>
          <div class="row">
            <span class="label">Check-out</span>
            <span class="colon">:</span>
            <span class="value">${fmtDate(booking.check_out)}</span>
          </div>
          <div class="row">
            <span class="label">Rooms</span>
            <span class="colon">:</span>
            <span class="value">${roomNames}</span>
          </div>
          <div class="row">
            <span class="label">Guests</span>
            <span class="colon">:</span>
            <span class="value">${totalGuests}</span>
          </div>
          
          <hr class="divider">

          ${booking.rooms.map((r) => `
          <div style="margin-bottom: 12px;">
            <div class="row">
              <span class="label">Room</span>
              <span class="colon">:</span>
              <span class="value">${r.room_name}</span>
            </div>
            <div class="row">
              <span class="label" style="padding-left: 15px;">Type</span>
              <span class="colon">:</span>
              <span class="value">${r.room_type}</span>
            </div>
            <div class="row">
              <span class="label" style="padding-left: 15px;">Bed</span>
              <span class="colon">:</span>
              <span class="value">${r.bed_type}</span>
            </div>
            <div class="row">
              <span class="label" style="padding-left: 15px;">Guests</span>
              <span class="colon">:</span>
              <span class="value">Max ${r.max_adults} adults${r.max_children > 0 ? `, ${r.max_children} children` : ''}</span>
            </div>
            <div class="row">
              <span class="label" style="padding-left: 15px;">Rate</span>
              <span class="colon">:</span>
              <span class="value">${CUR}${r.base_rate.toFixed(2)} × ${r.nights} night${r.nights > 1 ? 's' : ''}</span>
            </div>
            <div class="row">
              <span class="label" style="padding-left: 15px;">Subtotal</span>
              <span class="colon">:</span>
              <span class="value">${CUR}${r.subtotal.toFixed(2)}</span>
            </div>
          </div>
          `).join('')}

          ${booking.special_offer_discount > 0 ? `
          <div class="row">
            <span class="label">Special Offer</span>
            <span class="colon">:</span>
            <span class="value" style="color: #16a34a;">-${CUR}${booking.special_offer_discount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${booking.coupon_code ? `
          <div class="row">
            <span class="label">Coupon (${booking.coupon_code})</span>
            <span class="colon">:</span>
            <span class="value" style="color: #16a34a;">-${CUR}${booking.coupon_discount.toFixed(2)}</span>
          </div>
          ` : ''}
          
          <hr class="divider">
          
          <div class="total-row">
            <span class="total-label">Total Paid</span>
            <span class="total-colon">:</span>
            <span class="total-value">${CUR}${booking.total_amount.toFixed(2)}</span>
          </div>
          
          <hr class="divider">
          
          <div class="thank-you">
            Thank you for booking with StayEasy!<br>
            We wish you a pleasant stay.
          </div>
          
          <hr class="divider">
          
          <div class="important">
            <div class="important-title">IMPORTANT</div>
            <div class="important-text">Please carry a valid ID and<br>arrive at least 15 minutes early.</div>
          </div>
          
          <hr class="divider">
          
          <div class="footer">
            StayEasy Customer Support<br>
            support@stayeasy.com | +977 9800000000
          </div>
          
          <div class="tear">~~~~~~~~~~~~~~~~~~~~~</div>
        </div>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
    setShareMessage('Receipt downloaded successfully.')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-[#2E86AB] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading confirmation...</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p className="text-2xl">📋</p>
        <p className="text-lg font-semibold text-gray-900">Booking not found</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-[#1A3C5E] text-white rounded-full text-sm font-medium hover:opacity-90">
          Back to home
        </button>
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
            <div className="flex-1 h-[2px] bg-[#1A3C5E] mx-4 min-w-[60px] max-w-[120px]" />
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Finish booking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
        {/* Mobile: Confirmation + Rooms + Guests first */}
        <div className="lg:hidden space-y-5">
          {/* Success banner */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-white p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                <CheckCircle2 size={16} /> Booking confirmed
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Your stay is confirmed
              </h1>
              <p className="mt-2 text-sm text-gray-600">Everything is ready for your trip. Keep this confirmation handy.</p>

              <div className="mt-5 flex justify-center">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-3 shadow-sm text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Confirmation code</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 tracking-[0.18em]">{confirmationCode}</p>
                </div>
              </div>
            </div>

            {stateData?.propertyImages?.[0] && (
              <img src={stateData.propertyImages[0]} alt={propertyName} className="w-full h-56 object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-center gap-1 mb-2">
                {stateData?.rating && Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(stateData.rating!) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
                ))}
                {stateData?.rating && (
                  <span className="text-sm font-semibold text-gray-900 ml-1">{stateData.rating.toFixed(1)}</span>
                )}
                {stateData?.reviews != null && stateData.reviews > 0 && (
                  <span className="text-sm text-gray-500">· {stateData.reviews} reviews</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin size={16} />
                <span className="text-sm font-bold">{propertyName}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{propertyCity}, {propertyCountry}</p>

              {stateData?.amenities && stateData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {stateData.amenities.slice(0, 4).map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                      {a.toLowerCase().includes('wifi') && <Wifi size={11} />}
                      {a.toLowerCase().includes('airport') && <Plane size={11} />}
                      {a.toLowerCase().includes('restaurant') && <UtensilsCrossed size={11} />}
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Room details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">Room details</h2>
            <div className="space-y-3">
              {booking.rooms.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-[#f0f6ff] flex items-center justify-center text-[#0071c2] font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{r.room_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.room_type} · {r.bed_type}</p>
                    <p className="text-xs text-gray-500">Max {r.max_adults} adults{r.max_children > 0 ? `, ${r.max_children} children` : ''}</p>
                    <p className="text-xs text-gray-500">{CUR}{r.base_rate.toFixed(2)}/night × {r.nights} night{r.nights > 1 ? 's' : ''}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{CUR}{r.subtotal.toFixed(2)}</p>
                    <p className="text-[11px] text-gray-500">{r.nights} night{r.nights > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest details */}
          {(stateData?.guestName || stateData?.guestEmail) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-3">Guest details</h2>
              <div className="space-y-2 text-sm">
                {stateData.guestName && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-gray-900 font-medium">{stateData.guestName}</span>
                  </div>
                )}
                {stateData.guestEmail && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900">{stateData.guestEmail}</span>
                  </div>
                )}
                {stateData.guestPhone && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Phone:</span>
                    <span className="text-gray-900">{stateData.guestPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Booking Summary */}
        <div className="lg:hidden my-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#f0f6ff] flex items-center justify-center text-[#0071c2] font-bold text-sm shrink-0">
                  {propertyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">{propertyName}</h3>
                  <p className="text-sm text-gray-500">{roomNames}</p>
                  <p className="text-sm text-gray-500">{propertyCity}, {propertyCountry}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Confirmation code</p>
              <p className="text-sm font-bold text-gray-900 tracking-[0.16em]">{confirmationCode}</p>
            </div>

            <div className="px-5 py-4 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Dates</p>
              <p className="text-sm font-semibold text-gray-900">
                {fmtShort(booking.check_in)} – {fmtShort(booking.check_out)}, {new Date(booking.check_out).getFullYear()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{booking.nights} night{booking.nights > 1 ? 's' : ''}</p>
            </div>

            <div className="px-5 py-4 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Guests</p>
              <p className="text-sm font-semibold text-gray-900">{totalGuests} guest{totalGuests > 1 ? 's' : ''}</p>
            </div>

            <div className="px-5 py-4 border-b border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-3">Price details</p>
              {booking.coupon_code && booking.coupon_discount > 0 && (
                <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-green-700">{booking.coupon_code}</span>
                    <span className="font-bold text-green-700">-{CUR}{booking.coupon_discount.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-green-600">Coupon applied to this reservation.</p>
                </div>
              )}
              {booking.special_offer_discount > 0 && (
                <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-green-700">Special offer</span>
                    <span className="font-bold text-green-700">-{CUR}{booking.special_offer_discount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2 text-sm">
                {booking.rooms?.map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600">{r.room_name} × {r.nights} night{r.nights > 1 ? 's' : ''}</span>
                    <span className="font-medium text-gray-900">{CUR}{r.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total paid</span>
                <span className="text-lg font-bold text-gray-900">{CUR}{booking.total_amount.toFixed(2)}</span>
              </div>
              {booking.payment_status && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${booking.payment_status === 'completed' ? 'bg-green-500' : booking.payment_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium text-gray-600 capitalize">Payment {booking.payment_status}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button onClick={handleCopyCode} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition">
                  <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition">
                  <Share2 size={14} /> Share
                </button>
                <button onClick={handleDownloadReceipt} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition">
                  <Download size={14} /> Receipt
                </button>
              </div>
              {shareMessage && <p className="mt-3 text-sm text-[#0071c2]">{shareMessage}</p>}
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-900">
                  <QrCode size={15} />
                  <h3 className="text-sm font-bold">Reservation QR</h3>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <img src={buildQrUrl(shareText || confirmationCode)} alt="Reservation QR code" className="h-36 w-36 rounded-xl" />
                  <p className="mt-3 text-center text-xs text-gray-500">Scan to view booking details.</p>
                </div>
              </div>
              <button onClick={() => navigate('/profile/bookings')} className="mt-5 w-full py-3 rounded-xl bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition flex items-center justify-center gap-2">
                Done <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: Important info + Cancellation */}
        <div className="lg:hidden space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-900">
              <CircleAlert size={16} />
              <h2 className="text-base font-bold">Important info</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Please carry a valid government-issued ID at check-in.</li>
              <li>• Arrive at least 15 minutes before your scheduled check-in time.</li>
              <li>• The front desk is available 24/7 for late arrivals and requests.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-900">
              <ShieldCheck size={16} />
              <h2 className="text-base font-bold">Cancellation policy</h2>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Free cancellation is available up to 24 hours before check-in. Cancellations made within 24 hours may be refunded as partial credit, depending on the property policy.
            </p>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-8 items-start">

          {/* LEFT COLUMN — Confirmation Details */}
          <div className="space-y-5">
            {/* Success banner */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-white p-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  <CheckCircle2 size={16} /> Booking confirmed
                </div>
                <h1 className="mt-4 text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Your stay is confirmed
                </h1>
                <p className="mt-2 text-sm text-gray-600">Everything is ready for your trip. Keep this confirmation handy.</p>

                <div className="mt-5 flex justify-center">
                  <div className="rounded-xl border border-gray-200 bg-white px-6 py-3 shadow-sm text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Confirmation code</p>
                    <p className="mt-1 text-xl font-bold text-gray-900 tracking-[0.18em]">{confirmationCode}</p>
                  </div>
                </div>
              </div>

              {stateData?.propertyImages?.[0] && (
                <img src={stateData.propertyImages[0]} alt={propertyName} className="w-full h-56 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  {stateData?.rating && Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(stateData.rating!) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
                  ))}
                  {stateData?.rating && (
                    <span className="text-sm font-semibold text-gray-900 ml-1">{stateData.rating.toFixed(1)}</span>
                  )}
                  {stateData?.reviews != null && stateData.reviews > 0 && (
                    <span className="text-sm text-gray-500">· {stateData.reviews} reviews</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin size={16} />
                  <span className="text-sm font-bold">{propertyName}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{propertyCity}, {propertyCountry}</p>

                {stateData?.amenities && stateData.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {stateData.amenities.slice(0, 4).map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                        {a.toLowerCase().includes('wifi') && <Wifi size={11} />}
                        {a.toLowerCase().includes('airport') && <Plane size={11} />}
                        {a.toLowerCase().includes('restaurant') && <UtensilsCrossed size={11} />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Room details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-3">Room details</h2>
              <div className="space-y-3">
                {booking.rooms.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-[#f0f6ff] flex items-center justify-center text-[#0071c2] font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{r.room_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.room_type} · {r.bed_type}</p>
                      <p className="text-xs text-gray-500">Max {r.max_adults} adults{r.max_children > 0 ? `, ${r.max_children} children` : ''}</p>
                      <p className="text-xs text-gray-500">{CUR}{r.base_rate.toFixed(2)}/night × {r.nights} night{r.nights > 1 ? 's' : ''}</p>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{CUR}{r.subtotal.toFixed(2)}</p>
                      <p className="text-[11px] text-gray-500">{r.nights} night{r.nights > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest details */}
            {(stateData?.guestName || stateData?.guestEmail) && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3">Guest details</h2>
                <div className="space-y-2 text-sm">
                  {stateData.guestName && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-900 font-medium">{stateData.guestName}</span>
                    </div>
                  )}
                  {stateData.guestEmail && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900">{stateData.guestEmail}</span>
                    </div>
                  )}
                  {stateData.guestPhone && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-900">{stateData.guestPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Important info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-gray-900">
                <CircleAlert size={16} />
                <h2 className="text-base font-bold">Important info</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>• Please carry a valid government-issued ID at check-in.</li>
                <li>• Arrive at least 15 minutes before your scheduled check-in time.</li>
                <li>• The front desk is available 24/7 for late arrivals and requests.</li>
              </ul>
            </div>

            {/* Cancellation policy */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-gray-900">
                <ShieldCheck size={16} />
                <h2 className="text-base font-bold">Cancellation policy</h2>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Free cancellation is available up to 24 hours before check-in. Cancellations made within 24 hours may be refunded as partial credit, depending on the property policy.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN — Booking Summary */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#f0f6ff] flex items-center justify-center text-[#0071c2] font-bold text-sm shrink-0">
                    {propertyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{propertyName}</h3>
                    <p className="text-sm text-gray-500">{roomNames}</p>
                    <p className="text-sm text-gray-500">{propertyCity}, {propertyCountry}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Confirmation code</p>
                <p className="text-sm font-bold text-gray-900 tracking-[0.16em]">{confirmationCode}</p>
              </div>

              <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Dates</p>
                <p className="text-sm font-semibold text-gray-900">
                  {fmtShort(booking.check_in)} – {fmtShort(booking.check_out)}, {new Date(booking.check_out).getFullYear()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{booking.nights} night{booking.nights > 1 ? 's' : ''}</p>
              </div>

              <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Guests</p>
                <p className="text-sm font-semibold text-gray-900">{totalGuests} guest{totalGuests > 1 ? 's' : ''}</p>
              </div>

              <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-sm font-bold text-gray-900 mb-3">Price details</p>
                {booking.coupon_code && booking.coupon_discount > 0 && (
                  <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-green-700">{booking.coupon_code}</span>
                      <span className="font-bold text-green-700">-{CUR}{booking.coupon_discount.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-green-600">Coupon applied to this reservation.</p>
                  </div>
                )}
                {booking.special_offer_discount > 0 && (
                  <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-green-700">Special offer</span>
                      <span className="font-bold text-green-700">-{CUR}{booking.special_offer_discount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {booking.rooms?.map((r, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-600">{r.room_name} × {r.nights} night{r.nights > 1 ? 's' : ''}</span>
                      <span className="font-medium text-gray-900">{CUR}{r.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total paid</span>
                  <span className="text-lg font-bold text-gray-900">{CUR}{booking.total_amount.toFixed(2)}</span>
                </div>
                {booking.payment_status && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${booking.payment_status === 'completed' ? 'bg-green-500' : booking.payment_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-medium text-gray-600 capitalize">Payment {booking.payment_status}</span>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleCopyCode} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition">
                    <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition">
                    <Share2 size={14} /> Share
                  </button>
                  <button onClick={handleDownloadReceipt} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition">
                    <Download size={14} /> Receipt
                  </button>
                </div>
                {shareMessage && <p className="mt-3 text-sm text-[#0071c2]">{shareMessage}</p>}
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-900">
                    <QrCode size={15} />
                    <h3 className="text-sm font-bold">Reservation QR</h3>
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <img src={buildQrUrl(shareText || confirmationCode)} alt="Reservation QR code" className="h-36 w-36 rounded-xl" />
                    <p className="mt-3 text-center text-xs text-gray-500">Scan to view booking details.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/profile/bookings')} className="mt-5 w-full py-3 rounded-xl bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition flex items-center justify-center gap-2">
                  Done <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
