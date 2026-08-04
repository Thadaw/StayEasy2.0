import { normalizeBookingStatus } from "./format"

export function getStatusColor(status: string): string {
  switch (normalizeBookingStatus(status)) {
    case "upcoming":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    case "completed":
      return "bg-blue-50 text-blue-700 border border-blue-200"
    case "cancelled":
      return "bg-red-50 text-red-700 border border-red-200"
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200"
  }
}

export function canCancelBooking(status: string, checkIn: string): boolean {
  if (status !== "upcoming" && status !== "CONFIRMED") return false
  const checkInDate = new Date(checkIn)
  const cancelDeadline = new Date(checkInDate)
  cancelDeadline.setDate(cancelDeadline.getDate() - 1)
  cancelDeadline.setHours(14, 0, 0, 0)
  return new Date() < cancelDeadline
}

export function calculatePriceBreakdown(totalAmount: number, subtotal: number, specialOfferDiscount: number, couponDiscount: number, rooms: { subtotal?: number }[]) {
  const taxAmount = subtotal > 0 ? totalAmount - subtotal : Math.round(totalAmount * 0.13 / 1.13)
  const serviceFee = rooms.length > 0 ? rooms.reduce((s, r) => s + (r.subtotal || 0), 0) - subtotal + specialOfferDiscount : Math.round(totalAmount * 0.05 / 1.13)
  const basePrice = subtotal > 0 ? subtotal - taxAmount : totalAmount - taxAmount - Math.abs(couponDiscount)
  return { taxAmount, serviceFee, basePrice }
}

export function buildPropertyLocation(address: string, city: string, state: string, country: string): string {
  return [address, city, state, country]
    .filter(Boolean)
    .reduce<string[]>((parts, part) => {
      const prev = parts[parts.length - 1] || ""
      if (prev.toLowerCase().includes(part.toLowerCase())) return parts
      return [...parts, part]
    }, [])
    .join(", ")
}

export function buildShareText(propertyName: string, refNumber: string, checkIn: string, formatDateFull: (d: string) => string): string {
  if (!propertyName) return ""
  return `StayEasy booking confirmed for ${propertyName}. Confirmation code: ${refNumber}. Check-in ${checkIn ? formatDateFull(checkIn) : ""}.`
}
