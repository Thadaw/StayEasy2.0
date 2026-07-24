import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookings } from '../../context/BookingContext'
import { CalendarDays, MapPin, Clock, X, ChevronRight } from 'lucide-react'

type Tab = 'upcoming' | 'completed' | 'cancelled'

const tabs: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function Bookings() {
  const { bookings, cancelBooking } = useBookings()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')

  const filtered = bookings.filter(b => b.status === activeTab)

  const statusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-brand-accent-light text-brand-primary'
      case 'completed': return 'bg-brand-success-light text-brand-success'
      case 'cancelled': return 'bg-brand-danger-light text-brand-danger'
      default: return 'bg-brand-secondary-surface text-brand-text-secondary'
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl border border-brand-card-border overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-card-border">
          <h2 className="text-base font-semibold text-brand-heading">My Bookings</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-card-border px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-heading'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">({bookings.filter(b => b.status === tab.key).length})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              {activeTab === 'upcoming' && <CalendarDays size={36} className="text-brand-placeholder mx-auto mb-3" />}
              {activeTab === 'completed' && <Clock size={36} className="text-brand-placeholder mx-auto mb-3" />}
              {activeTab === 'cancelled' && <X size={36} className="text-brand-placeholder mx-auto mb-3" />}
              <p className="text-sm text-brand-text-secondary mb-4">
                {activeTab === 'upcoming' && 'No upcoming bookings'}
                {activeTab === 'completed' && 'No completed bookings yet'}
                {activeTab === 'cancelled' && 'No cancelled bookings'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2 text-sm font-semibold rounded-lg border-none text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors cursor-pointer"
                >
                  Browse stays
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(booking => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-brand-card-border overflow-hidden hover:shadow-card transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    <img
                      src={booking.hotelImage}
                      alt={booking.hotelName}
                      className="w-24 h-24 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-brand-heading truncate">{booking.hotelName}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-brand-text-secondary flex items-center gap-1 mb-1">
                        <MapPin size={10} /> {booking.hotelCity}, {booking.hotelCountry}
                      </p>
                      <p className="text-xs text-brand-text-secondary mb-1">
                        {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{booking.guests} guest{booking.guests > 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-brand-heading">${booking.totalPrice.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/booking-confirmation?bookingId=${booking.id}`)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-card-border text-brand-heading hover:bg-brand-secondary-surface transition-colors cursor-pointer flex items-center gap-1"
                          >
                            View Details <ChevronRight size={12} />
                          </button>
                          {booking.status === 'upcoming' && (
                            <button
                              onClick={() => { if (window.confirm('Cancel this booking?')) cancelBooking(booking.id) }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-danger text-brand-danger hover:bg-brand-danger-light transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
