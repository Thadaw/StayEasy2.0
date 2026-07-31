import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, HelpCircle, Bell, MapPin, Star, Phone, Mail,
  Download, FileText, CalendarDays,
  Users, Copy, AlertTriangle, ChevronRight, Share2, QrCode, ArrowRight,
} from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { useBookings } from "../context/BookingContext"
import { useAuth } from "../context/AuthContext"
import api from "../api"
import toast from "react-hot-toast"

interface ApiBookingRoom {
  room_id: string; room_name: string; room_type: string; bed_type: string;
  max_adults: number; max_children: number; base_rate: number; nights: number; subtotal: number;
}

interface ApiBooking {
  booking_id: string; ref_number: string; status: string;
  check_in: string; check_out: string; nights: number;
  payment_gateway: string | null; payment_status?: string | null;
  property: { id: string; name: string; type: string; city: string; country: string; currency: string };
  rooms: ApiBookingRoom[];
  total_amount: number; subtotal: number; special_offer_discount: number;
  special_offer_applied?: unknown[];
  coupon_code: string | null; coupon_discount: number;
  soft_lock_expires_at?: string;
  created_at?: string;
  guest_name?: string; guest_email?: string; guest_phone?: string;
  photos?: { cover: string; gallery: string[] };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function fmtShortDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function BookingDetailsView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { bookings } = useBookings()
  const { user } = useAuth()
  const [apiBooking, setApiBooking] = useState<ApiBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [coverPhoto, setCoverPhoto] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!id) { setLoading(false); return }
    const localMatch = bookings.find((b) => b.refNumber === id || b.id === id)
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${localMatch?.refNumber || id}`)
        const bookingData = data?.data || data
        setApiBooking(bookingData)
        if (bookingData?.property?.id) {
          try {
            const { data: propRes } = await api.get(`/properties/${bookingData.property.id}/public`)
            const photos = propRes?.data?.photos
            if (photos?.cover) setCoverPhoto(photos.cover)
          } catch {}
        }
      } catch {
        // API booking not found — will fall back to local BookingContext data
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [id, bookings])

  const localBooking = bookings.find((b) => b.refNumber === id || b.id === id)

  const propertyName = apiBooking?.property?.name || localBooking?.hotelName || ""
  const propertyCity = apiBooking?.property?.city || localBooking?.hotelCity || ""
  const propertyCountry = apiBooking?.property?.country || localBooking?.hotelCountry || ""
  const propertyId = apiBooking?.property?.id || localBooking?.hotelId || ""
  const CUR = apiBooking?.property?.currency || "USD"
  const nights = apiBooking?.nights || (localBooking ? Math.max(1, Math.round((new Date(localBooking.checkOut).getTime() - new Date(localBooking.checkIn).getTime()) / 86400000)) : 1)
  const checkIn = apiBooking?.check_in || localBooking?.checkIn || ""
  const checkOut = apiBooking?.check_out || localBooking?.checkOut || ""
  const adults = localBooking?.guests || 0
  const children = 0
  const totalGuests = adults + children
  const rooms = apiBooking?.rooms || []
  const roomNames = rooms.length > 0 ? rooms.map((r) => r.room_name).join(", ") : localBooking?.roomTypeName || ""
  const totalAmount = apiBooking?.total_amount || localBooking?.totalPrice || 0
  const subtotal = apiBooking?.subtotal || 0
  const specialOfferDiscount = apiBooking?.special_offer_discount || 0
  const couponDiscount = apiBooking?.coupon_discount || 0
  const paymentStatus = apiBooking?.payment_status || (localBooking ? "paid" : null)
  const paymentGateway = apiBooking?.payment_gateway || "Razorpay"
  const refNumber = apiBooking?.ref_number || localBooking?.refNumber || localBooking?.id || id || ""
  const createdAt = apiBooking?.created_at || localBooking?.createdAt || new Date().toISOString()
  const bookingStatus = apiBooking?.status || localBooking?.status || "upcoming"
  const statusLabel = bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)

  const guestName = apiBooking?.guest_name || user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Guest"
  const guestEmail = apiBooking?.guest_email || user?.email || ""
  const guestPhone = apiBooking?.guest_phone || ""

  const coverImage = coverPhoto || localBooking?.hotelImage || ""

  const shareText = propertyName
    ? `StayEasy booking confirmed for ${propertyName}. Confirmation code: ${refNumber}. Check-in ${checkIn ? fmtDate(checkIn) : ''}.`
    : ''

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(refNumber)
      setCopied(true)
      toast.success('Confirmation code copied!')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const handleShare = async () => {
    const shareData = { title: 'StayEasy booking details', text: shareText, url: window.location.href }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareText)
        toast.success('Booking details copied to clipboard')
      }
    } catch {
      // user cancelled
    }
  }

  const handleDownloadReceipt = () => {
    if (!apiBooking && !localBooking) return
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
            <span class="value">${refNumber}</span>
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
            <span class="value">${checkIn ? fmtDate(checkIn) : 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Check-out</span>
            <span class="colon">:</span>
            <span class="value">${checkOut ? fmtDate(checkOut) : 'N/A'}</span>
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

          ${rooms.map((r) => `
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
              <span class="value">${CUR}${r.base_rate.toFixed(2)} x ${r.nights} night${r.nights > 1 ? 's' : ''}</span>
            </div>
            <div class="row">
              <span class="label" style="padding-left: 15px;">Subtotal</span>
              <span class="colon">:</span>
              <span class="value">${CUR}${r.subtotal.toFixed(2)}</span>
            </div>
          </div>
          `).join('')}

          ${specialOfferDiscount > 0 ? `
          <div class="row">
            <span class="label">Special Offer</span>
            <span class="colon">:</span>
            <span class="value" style="color: #16a34a;">-${CUR}${specialOfferDiscount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${apiBooking?.coupon_code ? `
          <div class="row">
            <span class="label">Coupon (${apiBooking.coupon_code})</span>
            <span class="colon">:</span>
            <span class="value" style="color: #16a34a;">-${CUR}${couponDiscount.toFixed(2)}</span>
          </div>
          ` : ''}
          
          <hr class="divider">
          
          <div class="total-row">
            <span class="total-label">Total Paid</span>
            <span class="total-colon">:</span>
            <span class="total-value">${CUR}${totalAmount.toLocaleString()}</span>
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
  }

  const statusColor = () => {
    switch (bookingStatus) {
      case "upcoming":
      case "CONFIRMED":
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "completed":
      case "COMPLETED":
      case "CHECKED_OUT":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "cancelled":
      case "CANCELLED":
      case "CANCELED":
        return "bg-red-50 text-red-700 border border-red-200"
      default: return "bg-gray-50 text-gray-700 border border-gray-200"
    }
  }

  const checkInDate = new Date(checkIn)
  const cancelDeadline = new Date(checkInDate)
  cancelDeadline.setDate(cancelDeadline.getDate() - 1)
  cancelDeadline.setHours(14, 0, 0, 0)
  const canCancel = (bookingStatus === "upcoming" || bookingStatus === "CONFIRMED") && new Date() < cancelDeadline

  const roomPrice = totalAmount
  const taxAmount = subtotal > 0 ? roomPrice - subtotal : Math.round(roomPrice * 0.13 / 1.13)
  const serviceFee = rooms.length > 0 ? rooms.reduce((s, r) => s + (r.subtotal || 0), 0) - subtotal + specialOfferDiscount : Math.round(roomPrice * 0.05 / 1.13)
  const basePrice = subtotal > 0 ? subtotal - taxAmount : roomPrice - taxAmount - Math.abs(couponDiscount)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-brand-accent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading booking details...</p>
      </div>
    )
  }

  if (!apiBooking && !localBooking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p className="text-2xl">📋</p>
        <p className="text-lg font-semibold text-gray-900">Booking not found</p>
        <button
          onClick={() => navigate("/profile/bookings")}
          className="px-5 py-2.5 bg-brand-accent text-white rounded-full text-sm font-medium hover:opacity-90 cursor-pointer"
        >
          Back to bookings
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/profile/bookings")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="text-base font-semibold text-gray-900">Booking Details</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
              <HelpCircle size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-accent rounded-full" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* Left Column */}
          <div className="space-y-6">

            {/* Property Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 p-5">
                <img
                  src={coverImage}
                  alt={propertyName}
                  className="w-full sm:w-40 h-32 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-900">{propertyName}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor()}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                    <MapPin size={13} /> {propertyCity}, {propertyCountry}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star size={13} className="fill-yellow-400 stroke-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">4.8</span>
                    <span className="text-xs text-gray-500">(312 Reviews)</span>
                  </div>
                </div>
                <div className="sm:text-right shrink-0 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Booking ID</p>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1 sm:justify-end">
                    BK-{refNumber.slice(0, 8).toUpperCase()}
                    <Copy
                      size={12}
                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                      onClick={() => { navigator.clipboard.writeText(refNumber); toast.success("Booking ID copied!") }}
                    />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">Booked On</p>
                  <p className="text-sm font-semibold text-gray-900">{fmtShortDate(createdAt)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">Payment Status</p>
                  <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 sm:justify-end">
                    {paymentStatus === "paid" ? "Paid" : paymentStatus || "Pending"}{" "}
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">Total Paid</p>
                  <p className="text-lg font-bold text-gray-900">{CUR} {totalAmount.toLocaleString()}</p>
                </div>
              </div>


            </div>

            {/* Stay Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-gray-900">Stay Information</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check-in</p>
                  <p className="text-sm font-bold text-gray-900">{checkIn ? fmtDate(checkIn) : "N/A"}</p>
                  <p className="text-xs text-gray-400">2:00 PM</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Check-out</p>
                  <p className="text-sm font-bold text-gray-900">{checkOut ? fmtDate(checkOut) : "N/A"}</p>
                  <p className="text-xs text-gray-400">12:00 PM</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Duration</p>
                  <p className="text-sm font-bold text-gray-900">{nights} Night{nights > 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Guests</p>
                  <p className="text-sm font-bold text-gray-900">{adults} Adults{children > 0 ? `, ${children} Children` : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Room</p>
                  <p className="text-sm font-bold text-gray-900">{roomNames}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Meals</p>
                  <p className="text-sm font-bold text-gray-900">Breakfast Included</p>
                </div>
              </div>
            </div>

            {/* Guest Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-gray-900">Guest Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{guestName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{guestEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{guestPhone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-gray-900">Payment Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Room Price</span>
                  <span className="text-sm font-semibold text-gray-900">{CUR} {basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxes & Fees</span>
                  <span className="text-sm font-semibold text-gray-900">{CUR} {Math.abs(taxAmount).toLocaleString()}</span>
                </div>
                {specialOfferDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-sm">Special Offer Discount</span>
                    <span className="text-sm font-semibold">- {CUR} {specialOfferDiscount.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && apiBooking?.coupon_code && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-sm">Coupon ({apiBooking.coupon_code})</span>
                    <span className="text-sm font-semibold">- {CUR} {couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total Paid</span>
                  <span className="text-lg font-bold text-gray-900">{CUR} {totalAmount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Payment Method</p>
                    <p className="text-sm font-semibold text-gray-900">{paymentGateway || "Razorpay"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Transaction ID</p>
                    <p className="text-sm font-semibold text-gray-900 font-mono">pay_{refNumber.slice(0, 12)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Cancellation Policy</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="text-sm text-gray-600">
                    Free cancellation before {checkIn ? fmtShortDate(checkIn) : "N/A"} (2:00 PM).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="text-sm text-gray-600">After that, cancellation charges may apply.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="text-sm text-gray-600">No-shows are non-refundable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="text-sm text-gray-600">For more details, contact property.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Property Contact */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Property Contact</h3>
              <div className="space-y-3">
                <a href="tel:+97761000000" className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-accent transition-colors">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  +977-61-000000
                </a>
                <a href="mailto:info@mountainview.com" className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-accent transition-colors">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  info@mountainview.com
                </a>
                <p className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  {propertyCity}, {propertyCountry}
                </p>
              </div>
              <button className="w-full mt-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <MapPin size={14} />
                View on Map
              </button>
            </div>

            {/* Actions toolbar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleCopyCode} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition cursor-pointer">
                    <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition cursor-pointer">
                    <Share2 size={14} /> Share
                  </button>
                  <button onClick={handleDownloadReceipt} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition cursor-pointer">
                    <Download size={14} /> Receipt
                  </button>
                </div>

              </div>

              {/* Reservation QR */}
              <div className="p-5">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-900">
                    <QrCode size={15} />
                    <h3 className="text-sm font-bold">Reservation QR</h3>
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareText || refNumber)}`} alt="Reservation QR code" className="h-36 w-36 rounded-xl" />
                    <p className="mt-3 text-center text-xs text-gray-500">Scan to view booking details.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/profile/bookings')} className="mt-5 w-full py-3 rounded-xl bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition flex items-center justify-center gap-2 cursor-pointer">
                  Done <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Cancel Booking */}
            {(bookingStatus === "upcoming" || bookingStatus === "CONFIRMED") && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <h3 className="text-sm font-bold text-red-700">Cancel Booking</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  You can cancel this booking before {checkIn ? fmtShortDate(checkIn) : "N/A"} (2:00 PM).
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this booking?")) {
                      navigate("/profile/bookings")
                    }
                  }}
                  className="w-full py-2.5 rounded-lg border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Cancel Booking
                </button>
              </div>
            )}

            {/* Book Again */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Book Again</h3>
              <p className="text-xs text-gray-500 mb-3">Love this property?</p>
              <button
                onClick={() => navigate(`/hotel/${propertyId}`)}
                className="w-full py-2.5 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronRight size={14} />
                Book Again
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
