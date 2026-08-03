import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { BookingLayout } from '../components/booking/BookingLayout'
import { BookingStepper } from '../components/booking/BookingStepper'
import { ConfirmationBanner } from '../components/booking/ConfirmationBanner'
import { RoomDetailsCard } from '../components/booking/RoomDetailsCard'
import { GuestDetailsCard } from '../components/booking/GuestDetailsCard'
import { BookingSummaryCard } from '../components/booking/BookingSummaryCard'
import { InfoCards } from '../components/booking/InfoCards'
import { useBooking } from '../hooks/useBooking'
import { useBookingActions } from '../hooks/useBookingActions'
import { formatDateFull } from '../utils/format'

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

export default function BookingConfirmationPage() {
  const { refNumber } = useParams<{ refNumber: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateData = (location.state as ConfirmationState | null) || null

  const { booking, loading } = useBooking({ refNumber })
  const { copied, handleCopyCode, handleShare, handleDownloadReceipt } = useBookingActions()

  const [shareMessage, setShareMessage] = useState('')

  const confirmationCode = booking?.ref_number || ''
  const propertyName = booking?.property?.name || ''
  const propertyCity = booking?.property?.city || ''
  const propertyCountry = booking?.property?.country || ''
  const roomNames = booking?.rooms?.map(r => r.room_name).join(', ') || ''
  const CUR = booking?.property?.currency || 'USD'
  const totalGuests = stateData?.totalGuests || (booking?.adults || 0) + (booking?.children || 0) || booking?.total_guests || booking?.rooms?.reduce((s, r) => s + r.max_adults + r.max_children, 0) || 0

  const shareText = propertyName
    ? `StayEasy booking confirmed for ${propertyName}. Confirmation code: ${confirmationCode}. Check-in ${formatDateFull(booking?.check_in || '')}.`
    : ''

  const handleCopyCodeClick = () => handleCopyCode(confirmationCode)

  const handleShareClick = () => handleShare(shareText)

  const handleDownloadReceiptClick = () => {
    if (!booking) return
    handleDownloadReceipt({
      refNumber: confirmationCode,
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

      <BookingStepper />

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
            onCopyCode={handleCopyCodeClick}
            onShare={handleShareClick}
            onDownloadReceipt={handleDownloadReceiptClick}
          />
        }
      />

      <Footer />
    </div>
  )
}
