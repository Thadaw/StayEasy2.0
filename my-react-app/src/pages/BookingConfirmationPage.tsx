import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ReserveLayout } from '../components/reserve/ReserveLayout'
import { ReserveStepper } from '../components/reserve/ReserveStepper'
import { ConfirmationBanner } from '../components/reserve/ConfirmationBanner'
import { BookingRoomDetails } from '../components/booking/BookingRoomDetails'
import { BookingGuestInfo } from '../components/booking/BookingGuestInfo'
import { BookingPaymentSummary } from '../components/booking/BookingPaymentSummary'
import { BookingActions } from '../components/booking/BookingActions'
import { InfoCards } from '../components/reserve/InfoCards'
import { useBookingDetails } from '../hooks/useBookingDetails'
import { useBookingActions } from '../hooks/useBookingActions'
import { formatDateFull } from '../utils/format'
import { buildShareText } from '../utils/bookingHelpers'

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

  const {
    booking,
    loading,
    propertyName,
    propertyCity,
    propertyCountry,
    currency,
    rooms,
    roomNames,
    totalGuests,
    checkIn,
    refNumber: resolvedRef,
    taxAmount,
    basePrice,
  } = useBookingDetails(refNumber)

  const { copied, copyCode, shareBooking, downloadReceipt } = useBookingActions()

  const shareText = buildShareText(propertyName, resolvedRef, checkIn, formatDateFull)

  const handleCopyCode = () => copyCode(resolvedRef)
  const handleShare = () => shareBooking(shareText)

  const handleDownloadReceipt = () => {
    if (!booking) return
    downloadReceipt({
      refNumber: resolvedRef,
      propertyName,
      shareText,
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
      couponCode: booking.coupon_code ?? undefined,
      couponDiscount: booking.coupon_discount,
      totalAmount: booking.total_amount,
      currency,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-jakarta">
        <LoadingSpinner />
        <p className="text-sm text-gray-500">Loading confirmation...</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-jakarta">
        <p className="text-2xl">📋</p>
        <p className="text-lg font-semibold text-gray-900">Booking not found</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-[#1A3C5E] text-white rounded-full text-sm font-medium hover:opacity-90">
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-jakarta">
      <Navbar />

      <ReserveStepper />

      <ReserveLayout
        leftColumn={
          <>
            <ConfirmationBanner
              confirmationCode={resolvedRef}
              propertyName={propertyName}
              propertyCity={propertyCity}
              propertyCountry={propertyCountry}
              propertyImage={stateData?.propertyImages?.[0]}
              rating={stateData?.rating}
              reviews={stateData?.reviews}
              amenities={stateData?.amenities}
            />
            <BookingRoomDetails rooms={rooms} currency={currency} />
            <BookingGuestInfo
              guestName={stateData?.guestName || 'Guest'}
              guestEmail={stateData?.guestEmail}
              guestPhone={stateData?.guestPhone}
            />
            <InfoCards />
          </>
        }
        rightColumn={
          <>
            <BookingPaymentSummary
              currency={currency}
              basePrice={basePrice}
              taxAmount={taxAmount}
              specialOfferDiscount={booking.special_offer_discount || 0}
              couponDiscount={booking.coupon_discount || 0}
              couponCode={booking.coupon_code}
              totalAmount={booking.total_amount}
              paymentGateway={booking.payment_gateway ?? undefined}
              refNumber={resolvedRef}
            />
            <BookingActions
              refNumber={resolvedRef}
              shareText={shareText}
              copied={copied}
              onCopyCode={handleCopyCode}
              onShare={handleShare}
              onDownloadReceipt={handleDownloadReceipt}
              onDone={() => navigate('/profile/bookings')}
            />
          </>
        }
      />

      <Footer />
    </div>
  )
}
