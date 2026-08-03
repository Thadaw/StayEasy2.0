import { parseBookingDate } from './time'

interface ReceiptRoom {
  room_name: string
  room_type: string
  bed_type: string
  max_adults: number
  max_children: number
  base_rate: number
  nights: number
  subtotal: number
}

interface ReceiptData {
  confirmationCode: string
  propertyName: string
  propertyLocation: string
  propertyPhone?: string
  propertyEmail?: string
  checkIn: string
  checkOut: string
  roomNames: string
  totalGuests: number
  guestName: string
  guestEmail?: string
  guestPhone?: string
  guestNationality?: string
  rooms: ReceiptRoom[]
  specialOfferDiscount?: number
  couponCode?: string | null
  couponDiscount?: number
  totalAmount: number
  currency: string
  createdAt?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function fmtDate(d: string) {
  return parseBookingDate(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtShortDate(d: string) {
  return parseBookingDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function generateReceiptHTML(data: ReceiptData): string {
  const {
    confirmationCode,
    propertyName,
    propertyLocation,
    propertyPhone,
    propertyEmail,
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
    couponCode,
    couponDiscount,
    totalAmount,
    currency,
    createdAt,
  } = data

  const receiptDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const receiptTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const receiptNo = `RCP-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`

  const safe = escapeHtml

  const bookingDate = createdAt
    ? `${safe(fmtShortDate(createdAt))}, ${new Date(createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : `${receiptDate}  ${receiptTime}`

  const roomBlocks = rooms.map((r) => `
    <div style="margin-bottom: 12px;">
      <div class="row">
        <span class="label">Room</span>
        <span class="colon">:</span>
        <span class="value">${safe(r.room_name)}</span>
      </div>
      <div class="row">
        <span class="label" style="padding-left: 15px;">Type</span>
        <span class="colon">:</span>
        <span class="value">${safe(r.room_type)}</span>
      </div>
      <div class="row">
        <span class="label" style="padding-left: 15px;">Bed</span>
        <span class="colon">:</span>
        <span class="value">${safe(r.bed_type)}</span>
      </div>
      <div class="row">
        <span class="label" style="padding-left: 15px;">Guests</span>
        <span class="colon">:</span>
        <span class="value">Max ${r.max_adults} adults${r.max_children > 0 ? `, ${r.max_children} children` : ''}</span>
      </div>
      <div class="row">
        <span class="label" style="padding-left: 15px;">Rate</span>
        <span class="colon">:</span>
        <span class="value">${safe(currency)}${r.base_rate.toFixed(2)} × ${r.nights} night${r.nights > 1 ? 's' : ''}</span>
      </div>
      <div class="row">
        <span class="label" style="padding-left: 15px;">Subtotal</span>
        <span class="colon">:</span>
        <span class="value">${safe(currency)}${r.subtotal.toFixed(2)}</span>
      </div>
    </div>
  `).join('')

  const discountRows = `
    ${(specialOfferDiscount || 0) > 0 ? `
    <div class="row">
      <span class="label">Special Offer</span>
      <span class="colon">:</span>
      <span class="value" style="color: #16a34a;">-${safe(currency)}${(specialOfferDiscount || 0).toFixed(2)}</span>
    </div>
    ` : ''}
    ${couponCode ? `
    <div class="row">
      <span class="label">Coupon (${safe(couponCode)})</span>
      <span class="colon">:</span>
      <span class="value" style="color: #16a34a;">-${safe(currency)}${(couponDiscount || 0).toFixed(2)}</span>
    </div>
    ` : ''}
  `

  const optionalRows = `
    ${propertyPhone ? `<div class="row">
      <span class="label">Phone</span>
      <span class="colon">:</span>
      <span class="value">${safe(propertyPhone)}</span>
    </div>` : ''}
    ${propertyEmail ? `<div class="row">
      <span class="label">Email</span>
      <span class="colon">:</span>
      <span class="value">${safe(propertyEmail)}</span>
    </div>` : ''}
    ${guestNationality ? `<div class="row">
      <span class="label">Nationality</span>
      <span class="colon">:</span>
      <span class="value">${safe(guestNationality)}</span>
    </div>` : ''}
  `

  return `
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
          <span class="value">${safe(confirmationCode)}</span>
        </div>
        <div class="row">
          <span class="label">Booking Date</span>
          <span class="colon">:</span>
          <span class="value">${bookingDate}</span>
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
          <span class="value">${safe(propertyName)}</span>
        </div>
        <div class="row">
          <span class="label">Location</span>
          <span class="colon">:</span>
          <span class="value">${safe(propertyLocation)}</span>
        </div>
        ${optionalRows}
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
          <span class="value">${safe(roomNames)}</span>
        </div>
        <div class="row">
          <span class="label">Guests</span>
          <span class="colon">:</span>
          <span class="value">${totalGuests}</span>
        </div>
        <div class="row">
          <span class="label">Guest Name</span>
          <span class="colon">:</span>
          <span class="value">${safe(guestName)}</span>
        </div>
        <div class="row">
          <span class="label">Guest Email</span>
          <span class="colon">:</span>
          <span class="value">${guestEmail ? safe(guestEmail) : 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Guest Phone</span>
          <span class="colon">:</span>
          <span class="value">${guestPhone ? safe(guestPhone) : 'N/A'}</span>
        </div>
        
        <hr class="divider">

        ${roomBlocks}

        ${discountRows}
        
        <hr class="divider">
        
        <div class="total-row">
          <span class="total-label">Total Paid</span>
          <span class="total-colon">:</span>
          <span class="total-value">${safe(currency)}${totalAmount.toLocaleString()}</span>
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
}

export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }
}
