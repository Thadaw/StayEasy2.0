import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Copy, Download, Share2, QrCode, MapPin, ShieldCheck, CircleAlert, ArrowRight } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { formatDate, formatShortDate } from '../utils/format'
import type { Booking } from '../types'

type BookingConfirmationState = {
  booking: Booking
  appliedDiscount?: {
    code: string
    type: 'percentage' | 'fixed'
    amount: number
  }
}

function buildQrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
}

export default function BookingConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state as BookingConfirmationState | null) || null
  const booking = state?.booking
  const appliedDiscount = state?.appliedDiscount ?? booking?.discountApplied ?? null

  const [copied, setCopied] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  const confirmationCode = useMemo(() => {
    if (!booking) return 'STY-000000'
    return `STY-${booking.id.toUpperCase().slice(-6)}`
  }, [booking])

  const shareText = useMemo(() => {
    if (!booking) return ''
    const couponText = appliedDiscount
      ? ` Coupon: ${appliedDiscount.code} (${appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `$${appliedDiscount.amount} off`}).`
      : ''
    return `StayEasy booking confirmed for ${booking.hotelName}. Confirmation code: ${confirmationCode}. Check-in ${formatDate(booking.checkIn)}.${couponText}`
  }, [booking, confirmationCode, appliedDiscount])

  const handleCopyCode = async () => {
    if (!confirmationCode) return
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
    if (!booking) return
    const shareData = {
      title: 'StayEasy booking confirmed',
      text: shareText,
      url: window.location.href,
    }

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
    const receipt = [
      'StayEasy Booking Receipt',
      `Confirmation Code: ${confirmationCode}`,
      `Hotel: ${booking.hotelName}`,
      `Location: ${booking.hotelCity}, ${booking.hotelCountry}`,
      `Check-in: ${formatDate(booking.checkIn)}`,
      `Check-out: ${formatDate(booking.checkOut)}`,
      `Rooms: ${booking.roomTypeName}`,
      `Guests: ${booking.guests}`,
      `Coupon: ${appliedDiscount ? `${appliedDiscount.code} (${appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `$${appliedDiscount.amount} off`})` : 'None'}`,
      `Total Paid: $${booking.totalPrice.toFixed(2)}`,
      'Important: Please carry a valid ID and arrive at least 15 minutes early.',
    ].join('\n')

    const file = new Blob([receipt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `stayeasy-receipt-${confirmationCode}.txt`
    link.click()
    URL.revokeObjectURL(url)
    setShareMessage('Receipt downloaded successfully.')
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-brand-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-lg font-semibold text-[var(--brand-dark)]">Booking details were not found.</p>
          <button onClick={() => navigate('/profile')} className="mt-4 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-medium">Go to profile</button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-background pb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Your Selection</span>
            </div>
            <div className="flex-1 h-[2px] bg-[#1A3C5E] mx-4 min-w-[60px] max-w-[120px]"></div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Your Details</span>
            </div>
            <div className="flex-1 h-[2px] bg-[#1A3C5E] mx-4 min-w-[60px] max-w-[120px]"></div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Finish booking</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
          <div>
            <div className="bg-white border border-brand-card-border rounded-[24px] p-6 shadow-card">
              <div className="rounded-[20px] border border-[color:var(--border)] bg-[linear-gradient(135deg,var(--accent),#ffffff)] p-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-semibold text-[var(--primary)]">
                  <CheckCircle2 size={16} /> Booking confirmed
                </div>
                <h1 className="mt-4 text-3xl font-semibold text-[var(--brand-dark)]">Your stay is confirmed</h1>
                <p className="mt-2 text-sm text-brand-text max-w-2xl">Everything is ready for your trip. Keep this confirmation handy and share it with your travel group.</p>

                <div className="mt-5 flex justify-center lg:justify-center">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 shadow-sm max-w-fit text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-text-secondary">Confirmation code</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--brand-dark)] tracking-[0.18em]">{confirmationCode}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[20px] border border-brand-card-border bg-brand-background">
                <img src={booking.hotelImage} alt={booking.hotelName} className="h-56 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[var(--brand-dark)]">
                    <MapPin size={16} />
                    <span className="text-sm font-semibold">{booking.hotelName}</span>
                  </div>
                  <p className="mt-2 text-sm text-brand-text">{booking.hotelCity}, {booking.hotelCountry}</p>
                  <p className="mt-1 text-sm text-brand-text-secondary">{booking.roomTypeName}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 bg-white border border-brand-card-border rounded-[20px] p-5">
              <div className="flex items-center gap-2 text-[var(--brand-dark)]">
                <CircleAlert size={16} />
                <h2 className="text-lg font-semibold">Important info</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-brand-text">
                <li>• Please carry a valid government-issued ID at check-in.</li>
                <li>• Arrive at least 15 minutes before your scheduled check-in time.</li>
                <li>• The front desk is available 24/7 for late arrivals and requests.</li>
              </ul>
            </div>

            <div className="mt-5 bg-white border border-brand-card-border rounded-[20px] p-5">
              <div className="flex items-center gap-2 text-[var(--brand-dark)]">
                <ShieldCheck size={16} />
                <h2 className="text-lg font-semibold">Cancellation policy</h2>
              </div>
              <p className="mt-3 text-sm text-brand-text">Free cancellation is available up to 24 hours before check-in. Cancellations made within 24 hours may be refunded as a partial credit, depending on the property policy.</p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white border border-brand-card-border rounded-[20px] p-6 shadow-card">
              <div className="pb-[18px] border-b border-brand-card-border">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[10px] bg-[var(--accent)] flex items-center justify-center text-[var(--primary)] font-semibold">
                    {booking.hotelName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-[4px] min-w-0">
                    <h3 className="text-lg font-bold text-[var(--brand-dark)] truncate leading-tight">{booking.hotelName}</h3>
                    <p className="text-[13px] text-brand-text-secondary">{booking.roomTypeName}</p>
                    <p className="text-[13px] text-brand-text-secondary">{booking.hotelCity}, {booking.hotelCountry}</p>
                  </div>
                </div>
              </div>

              <div className="py-[18px] border-b border-brand-card-border">
                <p className="text-[13px] font-medium text-brand-text mb-1">Confirmation code</p>
                <p className="text-[14px] text-[var(--brand-dark)] font-semibold tracking-[0.16em]">{confirmationCode}</p>
              </div>

              <div className="py-[18px] border-b border-brand-card-border">
                <span className="text-[13px] font-medium text-brand-text">Dates</span>
                <p className="text-[14px] text-brand-heading mt-1">
                  {formatShortDate(booking.checkIn)} – {formatShortDate(booking.checkOut)}, {new Date(booking.checkOut).getFullYear()}
                </p>
              </div>

              <div className="py-[18px] border-b border-brand-card-border">
                <span className="text-[13px] font-medium text-brand-text">Guests</span>
                <p className="text-[14px] text-brand-heading mt-1">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</p>
              </div>

              <div className="py-[18px] border-b border-brand-card-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-semibold text-brand-heading">Price details</p>
                </div>
                {appliedDiscount ? (
                  <div className="mb-3 rounded-lg border border-brand-success-border bg-brand-success-light px-3 py-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-brand-success">{appliedDiscount.code}</span>
                      <span className="font-semibold text-brand-success">
                        {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}% off` : `$${appliedDiscount.amount} off`}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-brand-success">Coupon applied to this reservation.</p>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-brand-text">Total paid</span>
                  <span className="text-brand-heading font-semibold">${booking.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="py-[18px] border-b border-brand-card-border">
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleCopyCode} className="inline-flex items-center gap-2 rounded-full border border-brand-divider bg-white px-3 py-2 text-sm font-medium text-brand-heading transition hover:border-[var(--primary)]">
                    <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-brand-divider bg-white px-3 py-2 text-sm font-medium text-brand-heading transition hover:border-[var(--primary)]">
                    <Share2 size={14} /> Share
                  </button>
                  <button onClick={handleDownloadReceipt} className="inline-flex items-center gap-2 rounded-full border border-brand-divider bg-white px-3 py-2 text-sm font-medium text-brand-heading transition hover:border-[var(--primary)]">
                    <Download size={14} /> Receipt
                  </button>
                </div>
                {shareMessage && <p className="mt-3 text-sm text-[var(--primary)]">{shareMessage}</p>}
              </div>

              <div className="pt-[18px]">
                <div className="rounded-[16px] border border-dashed border-brand-divider bg-brand-background p-4">
                  <div className="flex items-center gap-2 text-[var(--brand-dark)]">
                    <QrCode size={15} />
                    <h3 className="text-sm font-semibold">Reservation QR</h3>
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <img src={buildQrUrl(shareText || confirmationCode)} alt="Reservation QR code" className="h-36 w-36 rounded-xl" />
                    <p className="mt-3 text-center text-xs text-brand-text-secondary">Scan to reopen your booking details.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/profile#bookings')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]">
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
