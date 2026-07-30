import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Bath, Users } from "lucide-react";
import toast from "react-hot-toast";
import { hotels, Hotel, RoomType } from "../data/hotels";
import { getCurrencySymbol } from "../data/worldCountries";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { SearchBar } from "../components/SearchBar";
import { StickySearchHeader } from "../components/StickySearchHeader";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { haversineDistance } from "../utils/geo";
import { HotelHeader } from "../components/property/HotelHeader";
import { ImageGallery } from "../components/property/ImageGallery";
import { HostInfo } from "../components/property/HostInfo";
import { AmenitiesSection } from "../components/property/AmenitiesSection";
import { RoomSelectionPanel } from "../components/property/RoomSelectionPanel";
import { ReviewSection } from "../components/property/ReviewSection";
import { ThingsToKnow } from "../components/property/ThingsToKnow";
import { RoomDetailModal } from "../components/property/RoomDetailModal";
import { NearbyStays } from "../components/property/NearbyStays";
import { RecommendedRoom } from "../components/property/RecommendedRoom";
import api from "../api";

interface ApiProperty {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  description: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  check_in_time: string;
  check_out_time: string;
  check_in_grace_period: number;
  check_out_grace_period: number;
  always_allow_check_in_out: boolean;
  number_of_floors: number;
  total_rooms: number;
  year_built: number;
  phone_number: string;
  email: string;
  currency: string;
  timezone: string;
  language: string;
  brand_logo_url: string;
  brand_color: string;
  is_active: boolean;
  system_amenities: { id: string; name: string; icon: string }[];
  custom_amenities: { icon: string | null; name: string }[];
  photos: { cover: string; gallery: string[] };
}

interface ApiRoom {
  id: string;
  property_id: string;
  floor_number: number;
  room_name: string;
  room_type_id: string;
  bed_type_id: string;
  room_type?: string;
  bed_type?: string;
  max_adults: number;
  max_children: number;
  base_rate: string;
  status: string;
  cancellation_policy: string;
  cancellation_title: string;
  cancellation_description: string;
  photos: { cover: string; gallery: string[] };
  system_amenity_ids: string[];
  custom_amenities: { icon: string | null; name: string }[];
}

function mapApiPropertyToHotel(apiProp: ApiProperty, rooms: ApiRoom[]): Hotel {
  const allAmenities = [
    ...apiProp.system_amenities.map((a) => a.name),
    ...apiProp.custom_amenities.map((a) => a.name),
  ];
  const totalAdults = rooms.reduce((sum, r) => sum + r.max_adults, 0);
  const totalChildren = rooms.reduce((sum, r) => sum + r.max_children, 0);
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
    bedType: r.bed_type || r.bed_type_id || "",
    roomTypeName: r.room_type || r.room_name || "",
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
    room_type_id: r.room_type_id,
    bed_type_id: r.bed_type_id,
  }));
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
  };
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const guestsParam = searchParams.get("guests") || "";
  const whereParam = searchParams.get("where") || "";
  const budgetParam = searchParams.get("budget") || "";
  const checkinParam = searchParams.get("checkin") || "";
  const checkoutParam = searchParams.get("checkout") || "";
  const filterAmenities = searchParams.get("amenities")?.split(",").filter(Boolean) || [];
  const filterBedTypes = searchParams.get("bedTypes")?.split(",").filter(Boolean) || [];
  const filterGuestRating = searchParams.get("guestRating") || "Any";
  const filterPriceMin = Number(searchParams.get("priceMin")) || 0;
  const filterPriceMax = Number(searchParams.get("priceMax")) || 500;
  const filterPropertyTypes = searchParams.get("propertyTypes")?.split(",").filter(Boolean) || [];
  const hasSearchParams = filterAmenities.length > 0 || filterBedTypes.length > 0 || filterGuestRating !== "Any" || filterPriceMin > 0 || filterPriceMax < 500 || filterPropertyTypes.length > 0 || guestsParam !== "" || whereParam !== "" || budgetParam !== "" || checkinParam !== "" || checkoutParam !== "";

  useEffect(() => { window.scrollTo(0, 0) }, []);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [apiProperty, setApiProperty] = useState<ApiProperty | null>(null);
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPropertyData = async () => {
      setApiLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const checkInDate = checkinParam || today;
        const checkOutDate = checkoutParam || tomorrow;
        const adultsParam = searchParams.get("adults");
        const childrenParam = searchParams.get("children");
        const roomsParam = searchParams.get("rooms");
        const adults = adultsParam ? Number(adultsParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[0] || "2") : 2);
        const children = childrenParam ? Number(childrenParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[1] || "0") : 0);
        const rooms = roomsParam ? Number(roomsParam) : 1;
        const propRes = await api.get(`/properties/${id}/public`);
        setApiProperty(propRes.data?.data || null);
        try {
          const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
            params: { checkin_date: checkInDate, checkout_date: checkOutDate, adults, children, rooms },
          });
          const roomsData = roomsRes.data?.data || [];
          console.log('Available rooms response:', roomsData);
          if (roomsData.length > 0) console.log('First room fields:', Object.keys(roomsData[0]), 'room_type:', roomsData[0].room_type, 'bed_type:', roomsData[0].bed_type);
          setApiRooms(roomsData);
        } catch {
          setApiRooms([]);
        }
      } catch {
        setApiProperty(null);
        setApiRooms([]);
      } finally {
        setApiLoading(false);
      }
    };
    fetchPropertyData();
  }, [id, searchParams]);

  const apiHotel = useMemo(() => {
    if (!apiProperty) return null;
    return mapApiPropertyToHotel(apiProperty, apiRooms);
  }, [apiProperty, apiRooms]);

  const hotel = apiHotel || hotels.find((h) => h.id === Number(id));

  const CUR = getCurrencySymbol(apiProperty?.currency || 'USD')

  const liked = isFavorite(Number(id));
  const [checkIn, setCheckIn] = useState(checkinParam || "");
  const [checkOut, setCheckOut] = useState(checkoutParam || "");
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomQuantities, setRoomQuantities] = useState<Record<string, number>>({});
  const [roomGuestCounts, setRoomGuestCounts] = useState<Record<string, number>>({});

  const [guests, setGuests] = useState(() => {
    const total = parseInt(guestsParam || "0");
    if (total > 0) return { adults: total, children: 0, rooms: 1 };
    return { adults: 2, children: 0, rooms: 1 };
  });

  useEffect(() => {
    if (!hotel?.roomTypes) return;
    const totalGuests = guests.adults + guests.children;
    const selectedEntries = Object.entries(roomQuantities).filter(([, q]) => q > 0);
    if (selectedEntries.length === 0 || totalGuests <= 0) {
      setRoomGuestCounts(hotel.roomTypes.reduce((acc, rt) => ({ ...acc, [rt.id]: 1 }), {}));
      return;
    }
    const totalMaxCapacity = selectedEntries.reduce((s, [roomId]) => {
      const rt = hotel.roomTypes.find(r => r.id === roomId);
      return s + (rt ? rt.maxGuests : 2);
    }, 0);
    const newCounts: Record<string, number> = {};
    let assigned = 0;
    selectedEntries.forEach(([roomId, qty], idx) => {
      const rt = hotel.roomTypes.find(r => r.id === roomId);
      const maxGuests = rt ? rt.maxGuests : 2;
      if (idx === selectedEntries.length - 1) {
        newCounts[roomId] = Math.max(1, totalGuests - assigned);
      } else {
        const proportional = Math.round((totalGuests * maxGuests * qty) / totalMaxCapacity);
        const count = Math.max(1, Math.min(proportional, totalGuests - assigned - (selectedEntries.length - idx - 1)));
        newCounts[roomId] = count;
        assigned += count;
      }
    });
    setRoomGuestCounts(newCounts);
  }, [hotel, roomQuantities, guests.adults, guests.children]);

  const handleQtyChange = (roomId: string, delta: number) => {
    setRoomQuantities(prev => {
      const current = prev[roomId] || 0;
      const nextVal = current + delta;
      if (nextVal < 0) return prev;
      const room = hotel?.roomTypes.find(r => r.id === roomId);
      if (room && nextVal > room.availableRooms) return prev;
      return { ...prev, [roomId]: nextVal };
    });
  };

  const guestCount = useMemo(() => {
    if (!guestsParam) return 2;
    const matches = guestsParam.match(/\d+/g);
    if (!matches) return 2;
    return matches.reduce((sum, n) => sum + parseInt(n), 0);
  }, [guestsParam]);

  const capacityError = useMemo(() => {
    if (!hotel) return '';
    const totalGuests = guests.adults + guests.children;
    const selectedEntries = Object.entries(roomQuantities).filter(([, q]) => q > 0);
    if (selectedEntries.length === 0 || totalGuests <= 0) return '';
    const totalCapacity = selectedEntries.reduce((sum, [roomId, qty]) => {
      const rt = hotel.roomTypes.find(r => r.id === roomId);
      return sum + (rt ? rt.maxGuests * qty : 0);
    }, 0);
    if (totalGuests > totalCapacity) {
      return `Selected rooms can accommodate ${totalCapacity} guest${totalCapacity !== 1 ? 's' : ''}, but you have ${totalGuests} guest${totalGuests !== 1 ? 's' : ''}. Please add more rooms or reduce guest count.`;
    }
    return '';
  }, [hotel, roomQuantities, guests.adults, guests.children]);

  const recommendedRooms = useMemo(() => {
    if (!hotel || guestCount === 0) return [];
    const scored = hotel.roomTypes
      .filter((rt) => rt.availableRooms > 0 && rt.maxGuests >= guestCount)
      .map((rt) => {
        let score = 0;
        let total = 0;

        if (filterBedTypes.length > 0) {
          total += 1;
          const rtBed = rt.bedType?.toLowerCase() || "";
          if (filterBedTypes.some((bt) => rtBed.includes(bt.toLowerCase().replace(" bed", "")))) score += 1;
        }

        if (filterAmenities.length > 0) {
          total += filterAmenities.length;
          const roomAmenities = (rt.roomFacilities || []).map((a) => a.toLowerCase());
          const allAmenities = [...new Set([...roomAmenities, ...hotel.amenities.map((a) => a.toLowerCase())])];
          for (const a of filterAmenities) {
            if (allAmenities.some((ha) => ha.includes(a.toLowerCase()))) score += 1;
          }
        }

        if (filterPriceMin > 0 || filterPriceMax < 500) {
          total += 1;
          if (rt.price >= filterPriceMin && rt.price <= filterPriceMax) score += 1;
        }

        return { rt, score, total };
      })
      .sort((a, b) => (b.total > 0 ? b.score / b.total : 0) - (a.total > 0 ? a.score / a.total : 0));

    if (scored.length === 0) return [];
    return [scored[0].rt];
  }, [hotel, guestCount, filterBedTypes, filterAmenities, filterPriceMin, filterPriceMax]);

  const hotelMatchesFilters = useMemo(() => {
    if (!hotel) return false;
    if (!hasSearchParams) return false;
    if (filterGuestRating !== "Any" && hotel.rating < parseFloat(filterGuestRating)) return false;
    if (filterPropertyTypes.length > 0) {
      const typeMap: Record<string, string[]> = {
        "Villas": ["villa"],
        "Hotels": ["resort", "hotel"],
        "Apartments": ["apartment", "loft"],
        "Resorts": ["resort", "eco"],
        "Cottages": ["cottage", "chalet", "lodge"],
      };
      const matches = filterPropertyTypes.some((t) =>
        typeMap[t]?.some((k) => hotel.category.toLowerCase().includes(k) || hotel.name.toLowerCase().includes(k))
      );
      if (!matches) return false;
    }
    return true;
  }, [hotel, filterGuestRating, filterPropertyTypes, hasSearchParams]);

  const nearbyHotels = useMemo(() => {
    if (!hotel) return [];
    return hotels
      .filter((h) => h.id !== hotel.id)
      .map((h) => ({ hotel: h, dist: haversineDistance(hotel.lat, hotel.lng, h.lat, h.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4)
      .map((e) => e.hotel);
  }, [hotel]);

  if (apiLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-8 h-8 border-3 border-gray-200 border-t-brand-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p className="text-2xl">🏨</p>
        <p className="text-lg font-semibold text-foreground">Property not found</p>
        <Link to="/" className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:opacity-90">
          Back to home
        </Link>
      </div>
    );
  }

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1;

  const handleSelectRoom = (roomId: string) => {
    const qty = roomQuantities[roomId] || 0;
    setRoomQuantities(prev => ({ ...prev, [roomId]: qty > 0 ? 0 : 1 }));
    setSelectedRoomId(roomId);
    setTimeout(() => setSelectedRoomId(null), 3000);
    const el = document.getElementById(`room-${roomId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (whereParam) params.set("where", whereParam);
    if (checkIn) params.set("checkin", checkIn);
    if (checkOut) params.set("checkout", checkOut);
    const totalGuests = guests.adults + guests.children;
    if (totalGuests > 0) params.set("guests", String(totalGuests));
    navigate(`/search?${params.toString()}`);
  };

  const handleOpenDetail = (roomId: string) => {
    setDetailRoomId(roomId);
  };

  const handleReserveFromModal = (roomId: string) => {
    setRoomQuantities(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
    setDetailRoomId(null);
    setTimeout(() => document.getElementById('room-selection')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleReserve = async () => {
    const selected = Object.entries(roomQuantities).filter(([, q]) => q > 0);
    if (selected.length === 0) return;

    if (!user) {
      const params = new URLSearchParams();
      if (checkIn) params.set('checkin', checkIn);
      if (checkOut) params.set('checkout', checkOut);
      params.set('guests', String(guests.adults + guests.children));
      params.set('adults', String(guests.adults));
      params.set('children', String(guests.children));
      params.set('rooms', String(guests.rooms));
      navigate('/login?redirect=' + encodeURIComponent('/hotel/' + id + '?' + params.toString()));
      return;
    }

    const roomIds = selected.flatMap(([roomId, qty]) => Array(qty).fill(roomId));

    let refNumber = '';
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await api.post('/bookings/', {
        idempotency_key: idempotencyKey,
        property_id: id,
        room_ids: roomIds,
        check_in: checkIn,
        check_out: checkOut,
        adults: guests.adults,
        children: guests.children,
      });
      console.log('POST /bookings full response:', JSON.stringify(data, null, 2));
      refNumber = data?.data?.ref_number || data?.ref_number || '';
      console.log('Extracted ref_number:', refNumber);
    } catch (err) {
      console.error('Failed to create booking:', err);
    }

    if (!refNumber) {
      toast.error('Could not create booking. Please try again.');
      return;
    }

    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('rooms', JSON.stringify(Object.fromEntries(selected)));
    params.set('guestCounts', JSON.stringify(
      Object.fromEntries(Object.entries(roomGuestCounts).filter(([roomId]) => selected.some(([sId]) => sId === roomId)))
    ));
    params.set('adults', String(guests.adults));
    params.set('children', String(guests.children));
    if (refNumber) params.set('ref', refNumber);
    navigate('/booking-details/' + id + '?' + params.toString());
  };

  const detailRoom = detailRoomId ? hotel.roomTypes.find(rt => rt.id === detailRoomId) : null;

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      <StickySearchHeader>
        <SearchBar />
      </StickySearchHeader>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={15} /> All stays
        </button>

        <HotelHeader hotel={hotel} liked={liked} onToggleFavorite={() => {
          if (!user) { navigate('/signup'); } else { toggleFavorite(Number(id)); }
        }} />

        <ImageGallery hotel={hotel} />

        <div>
          <div className="flex flex-wrap gap-4 pb-6 border-b border-border mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <BedDouble size={18} className="text-muted-foreground" />
              <span><strong>{hotel.bedrooms}</strong> bedroom{hotel.bedrooms > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <BedDouble size={18} className="text-muted-foreground" />
              <span><strong>{hotel.beds}</strong> bed{hotel.beds > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Bath size={18} className="text-muted-foreground" />
              <span><strong>{hotel.bathrooms}</strong> bathroom{hotel.bathrooms > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users size={18} className="text-muted-foreground" />
              <span>Up to <strong>{hotel.maxGuests}</strong> guests</span>
            </div>
          </div>

          <HostInfo hotel={hotel} />

          <AmenitiesSection hotel={hotel} />

          {hotelMatchesFilters && recommendedRooms.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                Recommended for {guestCount} guest{guestCount > 1 ? "s" : ""}
              </h3>
              <div className="space-y-3">
                {recommendedRooms.map((rt) => (
                  <RecommendedRoom key={rt.id} room={rt} guestCount={guestCount} checkIn={checkIn} onReserve={handleSelectRoom} CUR={CUR} roomQuantities={roomQuantities} />
                ))}
              </div>
            </div>
          )}

          <RoomSelectionPanel
            hotel={hotel}
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
            guests={guests}
            onGuestsChange={setGuests}
            onSearch={handleSearch}
            roomQuantities={roomQuantities}
            roomGuestCounts={roomGuestCounts}
            selectedRoomId={selectedRoomId}
            nights={nights}
            onQtyChange={handleQtyChange}
            onOpenDetail={handleOpenDetail}
            onReserve={handleReserve}
            CUR={CUR}
            capacityError={capacityError}
            user={user}
          />

          <ReviewSection hotel={hotel} />
        </div>

        <ThingsToKnow />
      </div>

      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          hotel={hotel}
          roomGuestCounts={roomGuestCounts}
          onClose={() => setDetailRoomId(null)}
          onReserve={handleReserveFromModal}
        />
      )}

      <NearbyStays hotels={nearbyHotels} />

      <Footer />
    </div>
  );
}
