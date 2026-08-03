import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { BookingLayout } from '../components/booking/BookingLayout'
import { ConfirmationBanner } from '../components/booking/ConfirmationBanner'
import { RoomDetailsCard } from '../components/booking/RoomDetailsCard'
import { GuestDetailsCard } from '../components/booking/GuestDetailsCard'
import { BookingSummaryCard } from '../components/booking/BookingSummaryCard'
import { InfoCards } from '../components/booking/InfoCards'
import { printReceipt } from '../components/booking/ReceiptGenerator'
import { useBooking } from '../hooks/useBooking'
import toast from 'react-hot-toast'
import { parseBookingDate } from '../utils/time'

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

function fmtDate(d: string) {
  return parseBookingDate(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BookingConfirmationPage() {
  const { refNumber } = useParams<{ refNumber: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateData = (location.state as ConfirmationState | null) || null

  const { booking, loading } = useBooking({ refNumber })

  const [copied, setCopied] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

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
    printReceipt({
      confirmationCode,
      propertyName,
      propertyLocation: `${propertyCity}, ${propertyCountry}`,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      roomNames,
      totalGuests,
      guestName: stateData?.guestName || 'Guest',
      guestEmail: stateData?.guestEmail,
      guestPhone: stateData?.guestPhone,
      rooms: booking.rooms,
      specialOfferDiscount: booking.special_offer_discount,
      couponCode: booking.coupon_code,
      couponDiscount: booking.coupon_discount,
      totalAmount: booking.total_amount,
      currency: CUR,
    })
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

      <BookingLayout
        leftColumn={
          <>
            <ConfirmationBanner
              confirmationCode={confirmationCode}
              propertyName={propertyName}
              propertyCity={propertyCity}
              propertyCountry={propertyCountry}
              propertyImage={stateData?.propertyImages?.[0]}
              rating={stateData?.rating}
              reviews={stateData?.reviews}
              amenities={stateData?.amenities}
            />
            <RoomDetailsCard rooms={booking.rooms} currency={CUR} />
            <GuestDetailsCard
              guestName={stateData?.guestName}
              guestEmail={stateData?.guestEmail}
              guestPhone={stateData?.guestPhone}
            />
            <InfoCards />
          </>
        }
        rightColumn={
          <BookingSummaryCard
            propertyName={propertyName}
            roomNames={roomNames}
            propertyCity={propertyCity}
            propertyCountry={propertyCountry}
            confirmationCode={confirmationCode}
            checkIn={booking.check_in}
            checkOut={booking.check_out}
            nights={booking.nights}
            totalGuests={totalGuests}
            rooms={booking.rooms}
            currency={CUR}
            couponCode={booking.coupon_code}
            couponDiscount={booking.coupon_discount}
            specialOfferDiscount={booking.special_offer_discount}
            totalAmount={booking.total_amount}
            paymentStatus={booking.payment_status}
            shareText={shareText}
            copied={copied}
            shareMessage={shareMessage}
            onCopyCode={handleCopyCode}
            onShare={handleShare}
            onDownloadReceipt={handleDownloadReceipt}
          />
        }
      />

      <Footer />
    </div>
  )
}
