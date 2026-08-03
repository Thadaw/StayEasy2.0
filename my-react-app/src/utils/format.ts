import i18n from "../i18n";
import { parseBookingDate } from "./time";

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ""
  return parseBookingDate(dateStr).toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
  })
}

export function formatDate(date: string): string {
  if (!date) return ''
  return parseBookingDate(date).toLocaleDateString(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(date: string): string {
  if (!date) return ''
  return parseBookingDate(date).toLocaleDateString(i18n.language, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  if (!checkIn) return i18n.t("addDates")
  if (!checkOut) return `${formatDateShort(checkIn)} – ...`
  return `${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`
}

export function buildGuestLabel(
  adults: number,
  children: number,
  infants: number
): string {
  const total = adults + children
  if (total === 0) return i18n.t("addGuests")
  let label = `${total} ${i18n.t("guest", { count: total })}`
  if (infants > 0) label += `, ${infants} ${i18n.t("room", { count: infants })}`
  return label
}
