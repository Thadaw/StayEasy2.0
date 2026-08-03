import { CircleAlert, ShieldCheck } from 'lucide-react'

export function InfoCards() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 text-gray-900">
          <CircleAlert size={16} />
          <h2 className="text-base font-bold">Important info</h2>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>• Please carry a valid government-issued ID at check-in.</li>
          <li>• Arrive at least 15 minutes before your scheduled check-in time.</li>
          <li>• The front desk is available 24/7 for late arrivals and requests.</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 text-gray-900">
          <ShieldCheck size={16} />
          <h2 className="text-base font-bold">Cancellation policy</h2>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Free cancellation is available up to 24 hours before check-in. Cancellations made within 24 hours may be refunded as partial credit, depending on the property policy.
        </p>
      </div>
    </div>
  )
}
