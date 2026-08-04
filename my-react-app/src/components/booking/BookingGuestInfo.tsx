import { Users } from "lucide-react"
import { DetailField } from "../common/DetailField"
import { Card, SectionHeader } from "../ui"

interface BookingGuestInfoProps {
  guestName: string
  guestEmail?: string
  guestPhone?: string
  guestNationality?: string
}

export function BookingGuestInfo({
  guestName,
  guestEmail,
  guestPhone,
  guestNationality,
}: BookingGuestInfoProps) {
  return (
    <Card>
      <SectionHeader icon={<Users size={16} />} title="Guest Details" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DetailField label="Name" value={guestName} />
        <DetailField label="Email" value={guestEmail || "N/A"} />
        <DetailField label="Phone" value={guestPhone || "N/A"} />
        <DetailField label="Nationality" value={guestNationality || "N/A"} />
      </div>
    </Card>
  )
}
