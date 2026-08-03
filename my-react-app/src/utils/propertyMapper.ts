import { ApiProperty, ApiRoom } from '../types/api'
import { Hotel, RoomType } from '../data/hotels'

export function mapApiPropertyToHotel(apiProp: ApiProperty, rooms: ApiRoom[]): Hotel {
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
