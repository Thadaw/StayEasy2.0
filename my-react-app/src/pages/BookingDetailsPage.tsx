import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom"
import { ChevronRight, Star, Wifi, Plane, UtensilsCrossed, BedDouble } from "lucide-react"
import { hotels, Hotel, RoomType } from "../data/hotels"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { useAuth } from "../context/AuthContext"
import { formatDate } from "../utils/format"
import { phoneCodes } from "../data/phoneCodes"
import { allCountries } from "../data/countries"
import api from "../api"

interface GuestProfile {
  full_name: string
  email: string
  phone: string
  nationality: string
  id: string
  created_at: string
}

interface ApiProperty {
  id: string
  tenant_id: string
  name: string
  type: string
  description: string
  country: string
  state: string
  city: string
  zip_code: string
  address: string
  latitude: string | null
  longitude: string | null
  check_in_time: string
  check_out_time: string
  check_in_grace_period: number
  check_out_grace_period: number
  always_allow_check_in_out: boolean
  number_of_floors: number
  total_rooms: number
  year_built: number
  phone_number: string
  email: string
  currency: string
  timezone: string
  language: string
  brand_logo_url: string
  brand_color: string
  is_active: boolean
  system_amenities: { id: string; name: string; icon: string }[]
  custom_amenities: { icon: string | null; name: string }[]
  photos: { cover: string; gallery: string[] }
}

interface ApiRoom {
  id: string
  property_id: string
  floor_number: number
  room_name: string
  room_type_id: string
  bed_type_id: string
  max_adults: number
  max_children: number
  base_rate: string
  status: string
  cancellation_policy: string
  cancellation_title: string
  cancellation_description: string
  photos: { cover: string; gallery: string[] }
  system_amenity_ids: string[]
  custom_amenities: { icon: string | null; name: string }[]
}

function mapApiPropertyToHotel(apiProp: ApiProperty, rooms: ApiRoom[]): Hotel {
  const allAmenities = [
    ...apiProp.system_amenities.map((a) => a.name),
    ...apiProp.custom_amenities.map((a) => a.name),
  ]
  const totalAdults = rooms.reduce((sum, r) => sum + r.max_adults, 0)
  const totalChildren = rooms.reduce((sum, r) => sum + r.max_children, 0)
  const mappedRooms: RoomType[] = rooms.map((r) => ({
    id: r.id,
    name: r.room_name,
    price: parseFloat(r.base_rate) || 0,
    maxGuests: r.max_adults + r.max_children,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    description: r.cancellation_description || "",
    totalRooms: 1,
    availableRooms: r.status === "AVAILABLE" ? 1 : 0,
    roomNumbers: [r.room_name],
    bedType: "",
    areaSqFt: 300,
    floorNumber: r.floor_number,
    maxAdults: r.max_adults,
    maxChildren: r.max_children,
    cancellationTitle: r.cancellation_title,
    customAmenities: r.custom_amenities,
    image: r.photos?.cover || "",
    gallery: r.photos?.gallery || [],
    bathroomAmenities: [],
    roomFacilities: apiProp.system_amenities.map((a) => a.name),
    smokingPolicy: "No smoking",
    cancellationPolicy: r.cancellation_description || "",
    breakfastIncluded: false,
  }))
  return {
    id: 0,
    name: apiProp.name,
    location: `${apiProp.address}, ${apiProp.city}, ${apiProp.country}`,
    city: apiProp.city,
    country: apiProp.country,
    lat: apiProp.latitude ? parseFloat(apiProp.latitude) : 0,
    lng: apiProp.longitude ? parseFloat(apiProp.longitude) : 0,
    rating: 4.8,
    reviews: 0,
    price: rooms.length > 0 ? parseFloat(rooms[0].base_rate) || 0 : 0,
    imageUrl: apiProp.photos?.cover || "",
    images: apiProp.photos?.gallery || [],
    tag: apiProp.type,
    isSuperhost: false,
    category: apiProp.type.toLowerCase(),
    description: apiProp.description || "",
    amenities: allAmenities.length > 0 ? allAmenities : ["Free WiFi"],
    hostName: apiProp.name,
    hostAvatar: apiProp.brand_logo_url || "",
    hostJoined: "",
    hostReviews: 0,
    hostBankDetails: { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "", upiId: "" },
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: totalAdults + totalChildren,
    maxAdults: totalAdults,
    maxChildren: totalChildren,
    roomTypes: mappedRooms,
  }
}

export default function BookingDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const checkIn = searchParams.get("checkIn") || ""
  const checkOut = searchParams.get("checkOut") || ""
  const roomsParam = searchParams.get("rooms") || ""
  const guestCountsParam = searchParams.get("guestCounts") || ""
  const refParam = searchParams.get("ref") || ""
  const [refNumber, setRefNumber] = useState(refParam)
  const parsedRooms: Record<string, number> = roomsParam ? JSON.parse(roomsParam) : {}
  const parsedGuestCounts: Record<string, number> = guestCountsParam ? JSON.parse(guestCountsParam) : {}
  const totalGuests = Object.values(parsedGuestCounts).reduce((s, c) => s + c, 0)

  const [apiProperty, setApiProperty] = useState<ApiProperty | null>(null)
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingRooms, setBookingRooms] = useState<{ room_id: string; room_name: string; room_type: string; bed_type: string; max_adults: number; max_children: number; base_rate: number; nights: number; subtotal: number }[]>([])

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneCode, setPhoneCode] = useState("+977")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("")

  useEffect(() => {
    const fetchGuestProfile = async () => {
      if (!user) return
      try {
        const { data } = await api.get<GuestProfile>('/auth/guests/me')
        if (data.full_name) {
          setFullName(data.full_name)
        }
        if (data.email) setEmail(data.email)
        if (data.phone) {
          const match = data.phone.match(/^(\+\d+)(.*)$/)
          if (match) {
            setPhoneCode(match[1])
            setPhoneNumber(match[2].replace(/\D/g, ''))
          } else {
            setPhoneNumber(data.phone.replace(/\D/g, ''))
          }
        }
        if (data.nationality) {
          const nat = data.nationality.trim().toLowerCase()
          const found = allCountries.find(c =>
            c.name.toLowerCase() === nat ||
            c.code.toLowerCase() === nat ||
            c.name.toLowerCase().includes(nat) ||
            nat.includes(c.name.toLowerCase())
          )
          if (found) setCountry(found.code)
        }
      } catch {
        // fallback to basic user data
        setFullName(user.fullName || user.full_name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim())
        setEmail(user.email || '')
      }
    }
    fetchGuestProfile()
  }, [user])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!id || refNumber) return
    const createBooking = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
        const rooms: Record<string, number> = roomsParam ? JSON.parse(roomsParam) : {}
        const roomIds = Object.entries(rooms)
          .filter(([, qty]) => qty > 0)
          .flatMap(([roomId, qty]) => Array(qty).fill(roomId))
        const guestsParam = searchParams.get("guests")
        const adultsParam = searchParams.get("adults")
        const childrenParam = searchParams.get("children")
        const adults = adultsParam ? Number(adultsParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[0] || "2") : 2)
        const children = childrenParam ? Number(childrenParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[1] || "0") : 0)
        const { data } = await api.post('/bookings/', {
          idempotency_key: crypto.randomUUID(),
          property_id: id,
          room_ids: roomIds,
          check_in: checkIn || today,
          check_out: checkOut || tomorrow,
          adults,
          children,
        })
        const ref = data?.data?.ref_number || data?.ref_number || ''
        if (ref) setRefNumber(ref)
      } catch (err) {
        console.error('Failed to create booking:', err)
      }
    }
    createBooking()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refNumber, roomsParam, checkIn, checkOut])

  useEffect(() => {
    if (!refNumber) return
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${refNumber}`)
        const booking = data?.data || data
        if (booking?.rooms) setBookingRooms(booking.rooms)
      } catch {
        // fallback to URL params
      }
    }
    fetchBooking()
  }, [refNumber])

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
        const checkInDate = checkIn || today
        const checkOutDate = checkOut || tomorrow
        const guestsParam = searchParams.get("guests")
        const adultsParam = searchParams.get("adults")
        const childrenParam = searchParams.get("children")
        const roomsParamQ = searchParams.get("rooms")
        const adults = adultsParam ? Number(adultsParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[0] || "2") : 2)
        const children = childrenParam ? Number(childrenParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[1] || "0") : 0)
        const rooms = roomsParamQ ? Number(roomsParamQ) : 1
        const propRes = await api.get(`/properties/${id}/public`)
        setApiProperty(propRes.data?.data || null)
        try {
          const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
            params: { checkin_date: checkInDate, checkout_date: checkOutDate, adults, children, rooms },
          })
          setApiRooms(roomsRes.data?.data || [])
        } catch {
          setApiRooms([])
        }
      } catch {
        setApiProperty(null)
        setApiRooms([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, searchParams])

  const apiHotel = useMemo(() => {
    if (!apiProperty) return null
    return mapApiPropertyToHotel(apiProperty, apiRooms)
  }, [apiProperty, apiRooms])

  const hotel = apiHotel || hotels.find((h) => h.id === Number(id))

  const selectedRoomTypes = useMemo(() => {
    if (!hotel) return []
    if (bookingRooms.length > 0) {
      return hotel.roomTypes.filter(rt => bookingRooms.some(br => br.room_id === rt.id))
    }
    return hotel.roomTypes.filter(rt => parsedRooms[rt.id] && parsedRooms[rt.id] > 0)
  }, [hotel, bookingRooms, parsedRooms])

  const roomLines = useMemo(() => {
    if (bookingRooms.length > 0) {
      return bookingRooms.map(br => {
        const rt = hotel?.roomTypes.find(r => r.id === br.room_id)
        const qty = 1
        const gc = br.max_adults + br.max_children
        const ep = br.base_rate
        return { room: rt || { id: br.room_id, name: br.room_name, price: br.base_rate, maxGuests: gc } as RoomType, qty, gc, ep, lineTotal: qty * ep }
      })
    }
    return selectedRoomTypes.map(rt => {
      const qty = parsedRooms[rt.id] || 0
      const gc = parsedGuestCounts[rt.id] || 1
      const ep = rt.price
      const lineTotal = qty * ep
      return { room: rt, qty, gc, ep, lineTotal }
    })
  }, [bookingRooms, selectedRoomTypes, hotel, parsedRooms, parsedGuestCounts])

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1
  const subtotal = roomLines.reduce((s, l) => s + l.lineTotal * nights, 0)
  const total = subtotal

  const handleNext = () => {
    const params = new URLSearchParams()
    if (checkIn) params.set("checkIn", checkIn)
    if (checkOut) params.set("checkOut", checkOut)
    if (roomsParam) params.set("rooms", roomsParam)
    if (guestCountsParam) params.set("guestCounts", guestCountsParam)
    params.set("guestName", fullName)
    params.set("guestEmail", email)
    params.set("guestPhone", `${phoneCode}${phoneNumber}`)
    if (country) params.set("guestCountry", country)
    if (refNumber) params.set("ref", refNumber)
    navigate(`/reserve/${id}?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-brand-accent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading booking details...</p>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p className="text-2xl">🏨</p>
        <p className="text-lg font-semibold text-gray-900">Property not found</p>
        <Link to="/" className="px-5 py-2.5 bg-[#1A3C5E] text-white rounded-full text-sm font-medium hover:opacity-90">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Full-width stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-center">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Your selection</span>
            </div>

            {/* Line 1 */}
            <div className="flex-1 h-[2px] bg-[#1A3C5E] mx-4 min-w-[60px] max-w-[120px]" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm font-semibold text-[#1A3C5E]">Enter your details</span>
            </div>

            {/* Line 2 */}
            <div className="flex-1 h-[2px] bg-gray-200 mx-4 min-w-[60px] max-w-[120px]" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm text-gray-500">Confirm your reservation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">

        {/* Green banner */}
        <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-lg px-5 py-3 mb-6 text-center">
          <p className="text-sm font-medium text-[#2e7d32]">Great choice! You're almost done.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Left — Property Summary */}
          <div className="order-1 lg:order-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <img
                src={hotel.imageUrl || hotel.images[0]}
                alt={hotel.name}
                className="w-full h-56 object-cover"
              />
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(hotel.rating) ? "fill-[#febb02] stroke-[#febb02]" : "fill-gray-200 stroke-gray-200"} />
                  ))}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {hotel.name}
                </h2>
                <p className="text-sm text-gray-500 mb-2">{hotel.location}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-white bg-[#003580] px-2 py-1 rounded">
                    {hotel.rating.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {hotel.rating >= 4 ? "Excellent" : hotel.rating >= 3 ? "Good" : "Bad"}
                  </span>
                  <span className="text-sm text-gray-500">· {hotel.reviews} reviews</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Wifi size={12} /> Free WiFi
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Plane size={12} /> Airport shuttle
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <UtensilsCrossed size={12} /> Restaurant
                  </span>
                </div>
              </div>

              {/* Your booking details */}
              <div className="border-t border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Your booking details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Check-in</p>
                    <p className="text-sm font-bold text-gray-900">
                      {checkIn ? `${formatDate(checkIn)}` : "Select dates"}
                    </p>
                    <p className="text-xs text-gray-400">From 2:00 PM</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Check-out</p>
                    <p className="text-sm font-bold text-gray-900">
                      {checkOut ? `${formatDate(checkOut)}` : "Select dates"}
                    </p>
                    <p className="text-xs text-gray-400">Until 12:00 PM</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Guests</p>
                    <p className="text-sm font-bold text-gray-900">
                      {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Stays</p>
                    <p className="text-sm font-bold text-gray-900">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your price summary */}
              <div className="border-t border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Your price summary</h3>
                {roomLines.map(l => (
                  <div key={l.room.id} className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">{l.room.name}</span>
                    <span className="text-xs text-gray-900">${(l.lineTotal * nights).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-sm font-bold text-gray-900">${Math.max(0, total).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Taxes & fees included</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Guest Form */}
          <div className="order-2 lg:order-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-5">Almost done! Just fill in the <span className="text-red-500">*</span> required info</p>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E86AB] transition-colors text-gray-900"
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Watch out for typos..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E86AB] transition-colors text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Phone */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Telephone (mobile number preferred) *</label>
                <div className="flex gap-2">
                  <select
                    value={phoneCode}
                    onChange={e => setPhoneCode(e.target.value)}
                    className="w-[120px] border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E86AB] transition-colors text-gray-900 bg-white shrink-0"
                  >
                    {Object.entries(phoneCodes).map(([code, dial]) => (
                      <option key={code} value={dial}>{code} {dial}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="+977"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E86AB] transition-colors text-gray-900"
                  />
                </div>
              </div>

              {/* Country / Region */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Country / Region *</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E86AB] transition-colors text-gray-900 bg-white"
                >
                  <option value="">Select a country</option>
                  {allCountries.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Selected room info */}
              <div className="border-t border-gray-200 pt-5 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <BedDouble size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{roomLines.length > 0 ? roomLines.map(l => l.room.name).join(", ") : "No room selected"}</p>
                    {roomLines.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <span className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          </span>
                          Non-refundable
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-full mt-5 py-3.5 rounded-xl bg-[#0071c2] text-white font-semibold text-sm hover:bg-[#005fa3] transition-all flex items-center justify-center gap-2"
            >
              Next: Final details
              <ChevronRight size={16} />
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Don't worry — you won't be charged yet
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
