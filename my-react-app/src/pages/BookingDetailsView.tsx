import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Phone, Mail,
  Download, FileText, CalendarDays,
  Users, Copy, AlertTriangle, ChevronRight, Share2, QrCode, ArrowRight, BedDouble,
} from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { DetailField } from "../components/common/DetailField"
import { useBookings } from "../context/BookingContext"
import { useAuth } from "../context/AuthContext"
import { useBookingActions } from "../hooks/useBookingActions"
import { formatDateFull, formatDateShort, normalizeBookingStatus } from "../utils/format"
import { parseBookingDate, calculateNights } from "../utils/time"
import api from "../api"
import toast from "react-hot-toast"
import type { Booking } from "../types/booking"

type ApiBooking = Booking

export default function BookingDetailsView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { bookings } = useBookings()
  const { user } = useAuth()
  const { copied, handleCopyCode, handleShare, handleDownloadReceipt } = useBookingActions()
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [coverPhoto, setCoverPhoto] = useState("")
  const [propertyDetails, setPropertyDetails] = useState({
    address: "",
    state: "",
    phone: "",
    email: "",
    lat: null as string | number | null,
    lng: null as string | number | null,
  })
  const [guestProfile, setGuestProfile] = useState<{ name?: string; email?: string; phone?: string; nationality?: string } | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!id) { setLoading(false); return }
    const localMatch = bookings.find((b) => b.refNumber === id || b.id === id)
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${localMatch?.refNumber || id}`)
        const booking = data?.data || data
        setBooking(booking)
        if (booking?.property?.id) {
          try {
            const { data: propRes } = await api.get(`/properties/${booking.property.id}/public`)
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
          } catch {}
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
            setGuestProfile(prev => ({
              name: prev?.name || match.full_name || match.guest_name || guest.full_name || "",
              email: prev?.email || match.email || match.guest_email || guest.email || "",
              phone: prev?.phone || match.phone || match.guest_phone || guest.phone || "",
              nationality: prev?.nationality || match.nationality || guest.nationality || "",
            }))
          }
        }
      } catch {}
    }
    const fetchGuestProfile = async () => {
      try {
        const { data } = await api.get("/auth/guests/me")
        if (data) {
          setGuestProfile(prev => ({
            name: prev?.name || data.full_name || "",
            email: prev?.email || data.email || "",
            phone: prev?.phone || data.phone || "",
            nationality: prev?.nationality || data.nationality || "",
          }))
        }
      } catch {}
    }
    Promise.allSettled([fetchBooking(), fetchMeBookings(), fetchGuestProfile()]).finally(() => setLoading(false))
  }, [id, bookings])

  const localBooking = bookings.find((b) => b.refNumber === id || b.id === id)

  const propertyName = booking?.property?.name || localBooking?.hotelName || ""
  const propertyCity = booking?.property?.city || localBooking?.hotelCity || ""
  const propertyCountry = booking?.property?.country || localBooking?.hotelCountry || ""
  const propertyId = booking?.property?.id || localBooking?.hotelId || ""
  const propertyLocation = [propertyDetails.address, propertyCity, propertyDetails.state, propertyCountry]
    .filter(Boolean)
    .reduce<string[]>((parts, part) => {
      const prev = parts[parts.length - 1] || ""
      if (prev.toLowerCase().includes(part.toLowerCase())) return parts
      return [...parts, part]
    }, [])
    .join(", ")
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
  const paymentGateway = booking?.payment_gateway || ''
  const refNumber = booking?.ref_number || localBooking?.refNumber || localBooking?.id || id || ""
  const createdAt = booking?.created_at || localBooking?.createdAt || new Date().toISOString()
  const bookingStatus = booking?.status || localBooking?.status || "upcoming"
  const statusLabel = bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)

  const guestName = guestProfile?.name || booking?.guest_name || user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Guest"
  const guestEmail = guestProfile?.email || booking?.guest_email || user?.email || ""
  const guestPhone = guestProfile?.phone || booking?.guest_phone || ""
  const guestNationality = guestProfile?.nationality || ""

  const coverImage = coverPhoto || localBooking?.hotelImage || ""

  const shareText = propertyName
    ? `StayEasy booking confirmed for ${propertyName}. Confirmation code: ${refNumber}. Check-in ${checkIn ? formatDateFull(checkIn) : ''}.`
    : ''

  const handleCopyCodeClick = () => handleCopyCode(refNumber)

  const handleShareClick = () => handleShare(shareText)

  const handleViewOnMap = () => {
    const hasCoords = propertyDetails.lat !== null && propertyDetails.lat !== "" && propertyDetails.lng !== null && propertyDetails.lng !== ""
    const query = hasCoords
      ? `${propertyDetails.lat},${propertyDetails.lng}`
      : [propertyName, propertyDetails.address, propertyCity, propertyDetails.state, propertyCountry].filter(Boolean).join(", ")
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer")
  }

  const handleDownloadReceiptClick = () => {
    if (!booking && !localBooking) return
    handleDownloadReceipt({
      refNumber,
      propertyName,
      propertyLocation: propertyLocation || `${propertyCity}, ${propertyCountry}`,
      propertyPhone: propertyDetails.phone,
      propertyEmail: propertyDetails.email,
      checkIn,
      checkOut,
      roomNames,
      totalGuests,
      guestName,
      guestEmail,
      guestPhone,
      guestNationality,
      rooms,
      specialOfferDiscount,
      couponCode: booking?.coupon_code,
      couponDiscount,
      totalAmount,
      currency: currency,
      createdAt,
    })
  }

  const statusColor = () => {
    switch (normalizeBookingStatus(bookingStatus)) {
      case "upcoming":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "completed":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200"
      default: return "bg-gray-50 text-gray-700 border border-gray-200"
    }
  }

  const checkInDate = parseBookingDate(checkIn)
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

  if (!booking && !localBooking) {
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

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 items-center">
          <button
            onClick={() => navigate("/profile/bookings")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer justify-self-start"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="text-base font-semibold text-gray-900 text-center">Booking Details</h1>
          <span />
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          <div className="space-y-6">

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 p-5">
                <img
                  src={coverImage}
                  alt={propertyName}
                  className="w-full sm:w-40 h-32 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-900">{propertyName}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor()}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                    <MapPin size={13} /> {propertyLocation}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <a href={`tel:${propertyDetails.phone}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-accent transition-colors">
                      <Phone size={12} /> {propertyDetails.phone || "N/A"}
                    </a>
                    <a href={`mailto:${propertyDetails.email}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-accent transition-colors">
                      <Mail size={12} /> {propertyDetails.email || "N/A"}
                    </a>
                    <button onClick={handleViewOnMap} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline cursor-pointer">
                      <MapPin size={12} /> View on Map
                    </button>
                  </div>
                </div>
                <div className="sm:border-l sm:border-gray-200 sm:pl-4 sm:text-right shrink-0 space-y-1">
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
                  <p className="text-sm font-semibold text-gray-900">{formatDateShort(createdAt)}, {new Date(createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">Payment Status</p>
                  <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 sm:justify-end">
                    {paymentStatus === "paid" ? "Paid" : paymentStatus || "Pending"}{" "}
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">Total Paid</p>
                  <p className="text-lg font-bold text-gray-900">{currency} {totalAmount.toLocaleString()}</p>
                </div>
              </div>

            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-gray-900">Stay Information</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <DetailField label="Check-in" value={checkIn ? formatDateFull(checkIn) : "N/A"} />
                  <p className="text-xs text-gray-400">2:00 PM</p>
                </div>
                <div>
                  <DetailField label="Check-out" value={checkOut ? formatDateFull(checkOut) : "N/A"} />
                  <p className="text-xs text-gray-400">12:00 PM</p>
                </div>
                <DetailField label="Duration" value={`${nights} Night${nights > 1 ? "s" : ""}`} />
                <DetailField label="Guests" value={`${adults} adult${adults !== 1 ? "s" : ""} + ${children} child${children === 1 ? "" : "ren"}`} />
                <DetailField label="Room" value={roomNames} />
                <DetailField label="Meals" value="Breakfast Included" />
              </div>
            </div>

            {rooms.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BedDouble size={16} className="text-brand-accent" />
                  <h3 className="text-sm font-bold text-gray-900">Room Details</h3>
                </div>
                <div className="space-y-4">
                  {rooms.map((room, idx) => {
                    const roomPhoto = room.photo || room.photos?.cover || ""
                    return (
                      <div key={room.room_id || idx} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row gap-4 p-4">
                          <div className="w-full sm:w-32 h-28 sm:h-24 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                            {roomPhoto ? (
                              <img src={roomPhoto} alt={room.room_name} className="w-full h-full object-cover" />
                            ) : (
                              <BedDouble size={28} className="text-gray-300" />
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 min-w-0">
                            <DetailField label="Room Name" value={room.room_name} />
                            <DetailField label="Room Type" value={room.room_type} />
                            <DetailField label="Bed Type" value={room.bed_type} />
                            <DetailField label="Max Adults" value={room.max_adults} />
                            <DetailField label="Max Children" value={room.max_children} />
                            <DetailField label="Base Rate" value={`${currency} ${room.base_rate.toFixed(2)} / night`} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-gray-900">Guest Details</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailField label="Name" value={guestName} />
                <DetailField label="Email" value={guestEmail || "N/A"} />
                <DetailField label="Phone" value={guestPhone || "N/A"} />
                <DetailField label="Nationality" value={guestNationality || "N/A"} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Cancellation Policy</h3>
              {rooms.some((r) => r.cancellation_title || r.cancellation_description) ? (
                <div className="space-y-4">
                  {rooms.map((room, idx) => (
                    room.cancellation_title || room.cancellation_description ? (
                      <div key={room.room_id || idx}>
                        {room.cancellation_title && (
                          <p className="text-sm font-bold text-gray-900 mb-1">{room.cancellation_title}</p>
                        )}
                        {room.cancellation_description && (
                          <p className="text-sm text-gray-600 leading-relaxed">{room.cancellation_description}</p>
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className="text-sm text-gray-600">
                      Free cancellation before {checkIn ? formatDateShort(checkIn) : "N/A"} (2:00 PM).
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
              )}
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-gray-900">Payment Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Room Price</span>
                  <span className="text-sm font-semibold text-gray-900">{currency} {basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxes & Fees</span>
                  <span className="text-sm font-semibold text-gray-900">{currency} {Math.abs(taxAmount).toLocaleString()}</span>
                </div>
                {specialOfferDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-sm">Special Offer Discount</span>
                    <span className="text-sm font-semibold">- {currency} {specialOfferDiscount.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && booking?.coupon_code && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-sm">Coupon ({booking.coupon_code})</span>
                    <span className="text-sm font-semibold">- {currency} {couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total Paid</span>
                  <span className="text-lg font-bold text-gray-900">{currency} {totalAmount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <DetailField label="Payment Method" value={paymentGateway || '—'} />
                  <DetailField label="Transaction ID" value={`pay_${refNumber.slice(0, 12)}`} mono />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                   <button onClick={handleCopyCodeClick} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition cursor-pointer">
                    <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
                  </button>
                   <button onClick={handleShareClick} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition cursor-pointer">
                    <Share2 size={14} /> Share
                  </button>
                   <button onClick={handleDownloadReceiptClick} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:border-[#0071c2] transition cursor-pointer">
                    <Download size={14} /> Receipt
                  </button>
                </div>

              </div>

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

            {(bookingStatus === "upcoming" || bookingStatus === "CONFIRMED") && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <h3 className="text-sm font-bold text-red-700">Cancel Booking</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  You can cancel this booking before {checkIn ? formatDateShort(checkIn) : "N/A"} (2:00 PM).
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
