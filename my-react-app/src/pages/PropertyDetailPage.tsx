import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Bath, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { SearchBar } from "../components/SearchBar";
import { StickySearchHeader } from "../components/StickySearchHeader";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { HotelHeader } from "../components/PropertyDetail/HotelHeader";
import { ImageGallery } from "../components/PropertyDetail/ImageGallery";
import { HostInfo } from "../components/PropertyDetail/HostInfo";
import { AmenitiesSection } from "../components/PropertyDetail/AmenitiesSection";
import { RoomSelectionPanel } from "../components/PropertyDetail/RoomSelectionPanel";
import { ReviewSection } from "../components/PropertyDetail/ReviewSection";
import { ThingsToKnow } from "../components/PropertyDetail/ThingsToKnow";
import { RoomDetailModal } from "../components/PropertyDetail/RoomDetailModal";
import { RecommendedRoom } from "../components/PropertyDetail/RecommendedRoom";
import type { ApiProperty, ApiRoom } from "../types/api";
import { mapPropertyToHotel } from "../utils/propertyMapper";
import { getDefaultDates } from "../utils/date";
import { calculateNights } from "../utils/time";
import { useBookingCreation } from "../hooks/useBookingCreation";
import api from "../api";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const guestsParam = searchParams.get("guests") || "";
  const whereParam = searchParams.get("where") || "";
  const budgetParam = searchParams.get("budget") || "";
  const checkinParam = searchParams.get("checkin") || "";
  const checkoutParam = searchParams.get("checkout") || "";
  const filterAmenities = useMemo(() => searchParams.get("amenities")?.split(",").filter(Boolean) || [], [searchParams]);
  const filterBedTypes = useMemo(() => searchParams.get("bedTypes")?.split(",").filter(Boolean) || [], [searchParams]);
  const filterGuestRating = searchParams.get("guestRating") || "Any";
  const filterPriceMin = Number(searchParams.get("priceMin")) || 0;
  const filterPriceMax = Number(searchParams.get("priceMax")) || 500;
  const filterPropertyTypes = searchParams.get("propertyTypes")?.split(",").filter(Boolean) || [];
  const hasSearchParams = filterAmenities.length > 0 || filterBedTypes.length > 0 || filterGuestRating !== "Any" || filterPriceMin > 0 || filterPriceMax < 500 || filterPropertyTypes.length > 0 || guestsParam !== "" || whereParam !== "" || budgetParam !== "" || checkinParam !== "" || checkoutParam !== "";

  useEffect(() => { window.scrollTo(0, 0) }, []);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [availableRooms, setAvailableRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const { today, tomorrow } = getDefaultDates();
        const checkInDate = checkinParam || today;
        const checkOutDate = checkoutParam || tomorrow;
        const adultsParam = searchParams.get("adults");
        const childrenParam = searchParams.get("children");
        const roomsParam = searchParams.get("rooms");
        const adults = adultsParam ? Number(adultsParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[0] || "2") : 2);
        const children = childrenParam ? Number(childrenParam) : (guestsParam ? Number(guestsParam.match(/\d+/g)?.[1] || "0") : 0);
        const rooms = roomsParam ? Number(roomsParam) : 1;
        const propRes = await api.get(`/properties/${id}/public`);
        setProperty(propRes.data?.data || null);
        try {
          const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
            params: { checkin_date: checkInDate, checkout_date: checkOutDate, adults, children, rooms },
          });
          const availableRooms = roomsRes.data?.data || [];
          setAvailableRooms(availableRooms);
        } catch {
          setAvailableRooms([]);
        }
      } catch {
        setProperty(null);
        setAvailableRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, searchParams, checkinParam, checkoutParam, guestsParam]);

  const hotel = useMemo(() => {
    if (!property) return null;
    return mapPropertyToHotel(property, availableRooms);
  }, [property, availableRooms]);

  const currency = property?.currency || 'USD'

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
    if (!id || loading || !checkIn || !checkOut) return;
    const fetchRooms = async () => {
      try {
        const roomsRes = await api.get(`/properties/${id}/rooms/available-rooms`, {
          params: {
            checkin_date: checkIn,
            checkout_date: checkOut,
            adults: guests.adults,
            children: guests.children,
            rooms: guests.rooms,
          },
        });
        setAvailableRooms(roomsRes.data?.data || []);
      } catch {
        // keep existing rooms on error
      }
    };
    fetchRooms();
  }, [id, loading, guests.adults, guests.children, guests.rooms, checkIn, checkOut]);

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

  const guestCount = (() => {
    if (!guestsParam) return 2;
    const matches = guestsParam.match(/\d+/g);
    return matches ? matches.reduce((sum, n) => sum + parseInt(n), 0) : 2;
  })();

  const capacityError = useMemo(() => {
    if (!hotel) return '';
    const totalGuests = guests.adults + guests.children;
    const selectedEntries = Object.entries(roomQuantities).filter(([, q]) => q > 0);
    if (selectedEntries.length === 0 || totalGuests <= 0) return '';

    let totalMaxAdults = 0;
    let totalMaxChildren = 0;
    let totalMaxGuests = 0;

    selectedEntries.forEach(([roomId, qty]) => {
      const rt = hotel.roomTypes.find(r => r.id === roomId);
      if (rt) {
        totalMaxAdults += rt.maxAdults * qty;
        totalMaxChildren += rt.maxChildren * qty;
        totalMaxGuests += rt.maxGuests * qty;
      }
    });

    if (guests.adults > totalMaxAdults) {
      return `Selected room${selectedEntries.length > 1 ? 's' : ''} can accommodate ${totalMaxAdults} adult${totalMaxAdults !== 1 ? 's' : ''}, but you have ${guests.adults} adult${guests.adults !== 1 ? 's' : ''}. Please select a room with higher adult capacity.`;
    }
    if (guests.children > totalMaxChildren) {
      return `Selected room${selectedEntries.length > 1 ? 's' : ''} can accommodate ${totalMaxChildren} child${totalMaxChildren !== 1 ? 'ren' : ''}, but you have ${guests.children} child${guests.children !== 1 ? 'ren' : ''}. Please select a room with higher child capacity.`;
    }
    if (totalGuests > totalMaxGuests) {
      return `Selected room${selectedEntries.length > 1 ? 's' : ''} can accommodate ${totalMaxGuests} guest${totalMaxGuests !== 1 ? 's' : ''}, but you have ${totalGuests} guest${totalGuests !== 1 ? 's' : ''}. Please add more rooms or reduce guest count.`;
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

  const hotelMatchesFilters = (() => {
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
  })();

  const { createBooking } = useBookingCreation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-jakarta">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-jakarta">
        <p className="text-2xl">🏨</p>
        <p className="text-lg font-semibold text-foreground">Property not found</p>
        <Link to="/" className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:opacity-90">
          Back to home
        </Link>
      </div>
    );
  }

  const nights = calculateNights(checkIn, checkOut);

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
      refNumber = await createBooking({
        property_id: id!,
        room_ids: roomIds,
        check_in: checkIn,
        check_out: checkOut,
        adults: guests.adults,
        children: guests.children,
      });
    } catch {
      toast.error('Could not create booking. Please try again.');
      return;
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
    <div className="min-h-screen bg-background font-jakarta">
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
              <h3 className="text-lg font-bold text-foreground mb-3 font-brand">
                Recommended for {guestCount} guest{guestCount > 1 ? "s" : ""}
              </h3>
              <div className="space-y-3">
                {recommendedRooms.map((rt) => (
                  <RecommendedRoom key={rt.id} room={rt} guestCount={guestCount} checkIn={checkIn} onReserve={handleSelectRoom} currency={currency} roomQuantities={roomQuantities} />
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
            currency={currency}
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

      <Footer />
    </div>
  );
}
