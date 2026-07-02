import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart, Share2, ChevronLeft, ChevronRight, Wifi, Car, Utensils, Waves, Mountain, Dumbbell, ShieldCheck, ArrowLeft, Users, BedDouble, Bath, Plus, Minus } from "lucide-react";
import { hotels, reviewSamples } from "../data/hotels";
import { HotelCard } from "../components/HotelCard";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

const amenityIcons: Record<string, typeof Wifi> = {
  "Free WiFi": Wifi,
  "Parking": Car,
  "Kitchen": Utensils,
  "Beach access": Waves,
  "Mountain view": Mountain,
  "Gym access": Dumbbell,
};

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotel = hotels.find((h) => h.id === Number(id));

  useEffect(() => { window.scrollTo(0, 0) }, []);
  const [currentImg, setCurrentImg] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(Number(id));
  const [checkOut, setCheckOut] = useState("");
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [roomImgIndex, setRoomImgIndex] = useState(0);
  const [roomQuantities, setRoomQuantities] = useState<Record<string, number>>({});
  const [roomGuestCounts, setRoomGuestCounts] = useState<Record<string, number>>(
    hotel?.roomTypes.reduce((acc, rt) => ({ ...acc, [rt.id]: 1 }), {}) ?? {}
  );

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

  const related = hotels.filter((h) => h.id !== hotel.id && h.category === hotel.category).slice(0, 4);

  const hotelImages = hotel.images;
  function prevImg() {
    setCurrentImg((v) => (v === 0 ? hotelImages.length - 1 : v - 1));
  }
  function nextImg() {
    setCurrentImg((v) => (v === hotelImages.length - 1 ? 0 : v + 1));
  }


  const visibleAmenities = showAllAmenities ? hotel.amenities : hotel.amenities.slice(0, 8);

  const calcPrice = (basePrice: number, maxGuests: number, guestCount: number) => {
    if (maxGuests <= 1) return basePrice;
    return Math.round(basePrice * (0.85 + 0.15 * (guestCount - 1) / (maxGuests - 1)));
  };

  const handleGuestChange = (roomId: string, delta: number) => {
    setRoomGuestCounts(prev => {
      const room = hotel?.roomTypes.find(r => r.id === roomId);
      if (!room) return prev;
      const current = prev[roomId] || 1;
      const next = current + delta;
      if (next < 1 || next > room.maxGuests) return prev;
      return { ...prev, [roomId]: next };
    });
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={15} /> All stays
        </button>

        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--foreground)", lineHeight: 1.2 }}>
              {hotel.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-foreground stroke-foreground" />
                <span className="font-semibold">{hotel.rating}</span>
                <span className="text-muted-foreground">({hotel.reviews} reviews)</span>
              </span>
              {hotel.isSuperhost && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck size={13} className="text-primary" />
                  Superhost
                </span>
              )}
              <span className="text-muted-foreground underline cursor-pointer">{hotel.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-muted px-3 py-2 rounded-xl transition-colors">
              <Share2 size={15} /> Share
            </button>
            <button onClick={() => {
              if (!user) {
                navigate('/signup');
              } else {
                toggleFavorite(Number(id));
              }
            }} className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-muted px-3 py-2 rounded-xl transition-colors">
              <Heart size={15} className={liked ? "fill-primary stroke-primary" : ""} /> Save
            </button>
          </div>
        </div>

        {showAllPhotos ? (
          <div className="mb-8">
            <button onClick={() => setShowAllPhotos(false)} className="flex items-center gap-1.5 text-sm font-medium mb-4 hover:underline">
              <ChevronLeft size={15} /> Back
            </button>
            <div className="columns-2 md:columns-3 gap-3 space-y-3">
              {hotel.images.map((img, i) => (
                <img key={i} src={img} alt={`${hotel.name} photo ${i + 1}`} className="w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative mb-8 rounded-2xl overflow-hidden bg-muted">
            <div className="md:hidden relative aspect-[4/3]">
              <img src={hotel.images[currentImg]} alt={hotel.name} className="w-full h-full object-cover" />
              <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:shadow-lg"><ChevronLeft size={16} /></button>
              <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:shadow-lg"><ChevronRight size={16} /></button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {hotel.images.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white transition-opacity" style={{ opacity: i === currentImg ? 1 : 0.4 }} />
                ))}
              </div>
            </div>

            <div className="hidden md:grid grid-cols-3 gap-2 h-[400px]">
              <div className="col-span-2 row-span-2 overflow-hidden">
                <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
              </div>
              <div className="overflow-hidden">
                <img src={hotel.images[1]} alt={`${hotel.name} 2`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
              </div>
              <div className="overflow-hidden">
                <img src={hotel.images[2]} alt={`${hotel.name} 3`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
              </div>
            </div>

            <button
              onClick={() => setShowAllPhotos(true)}
              className="absolute bottom-4 right-4 bg-white text-foreground text-sm font-semibold px-4 py-2 rounded-xl border border-border shadow-md hover:shadow-lg transition-all"
            >
              Show all photos
            </button>
          </div>
        )}

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

          <div className="flex items-center gap-4 pb-6 border-b border-border mb-6">
            <img src={hotel.hostAvatar} alt={hotel.hostName} className="w-14 h-14 rounded-full object-cover border border-border" />
            <div>
              <p className="font-semibold text-foreground">Hosted by {hotel.hostName}</p>
              <p className="text-sm text-muted-foreground">Joined {hotel.hostJoined} · {hotel.hostReviews} reviews</p>
            </div>
            {hotel.isSuperhost && (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary border border-primary/20 bg-primary/5 px-3 py-1 rounded-full">
                <ShieldCheck size={12} /> Superhost
              </span>
            )}
          </div>

          <div className="md:grid md:grid-cols-2 md:gap-8 pb-6 border-b border-border mb-6">
            <div className="space-y-6">
              <p className="text-foreground leading-relaxed text-sm">{hotel.description}</p>
              <div>
                <h2 className="font-semibold text-foreground mb-4" style={{ fontSize: "1.125rem" }}>What this place offers</h2>
                <div className="grid grid-cols-2 gap-3">
                  {visibleAmenities.map((a) => {
                    const Icon = amenityIcons[a];
                    return (
                      <div key={a} className="flex items-center gap-3 text-sm text-foreground py-1">
                        {Icon ? <Icon size={18} className="text-muted-foreground shrink-0" /> : <div className="w-4 h-4 rounded-full bg-muted shrink-0" />}
                        {a}
                      </div>
                    );
                  })}
                </div>
                {hotel.amenities.length > 8 && (
                  <button onClick={() => setShowAllAmenities((v) => !v)} className="mt-4 px-5 py-2.5 border border-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                    {showAllAmenities ? "Show less" : `Show all ${hotel.amenities.length} amenities`}
                  </button>
                )}
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-4" style={{ fontSize: "1.125rem" }}>Location</h2>
              <p className="text-sm text-muted-foreground mb-3">{hotel.location}, {hotel.city}, {hotel.country}</p>
              <div className="rounded-xl overflow-hidden border border-border h-[300px]">
                <iframe
                  title="Property location"
                  src={`https://maps.google.com/maps?q=${hotel.lat},${hotel.lng}&z=14&output=embed`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-2xl shadow-xl p-6 bg-white mb-10">
            <h2 className="font-semibold text-foreground mb-6" style={{ fontSize: "1.125rem" }}>Choose your room</h2>
            <div className="flex flex-wrap items-end gap-4 mb-8 pb-6 border-b border-border">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1">Check-in</label>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1">Check-out</label>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-foreground" />
              </div>

            </div>

            <div className="space-y-3">
              {hotel.roomTypes.map((rt) => {
                const qty = roomQuantities[rt.id] || 0;
                const guestCount = roomGuestCounts[rt.id] || 1;
                const effectivePrice = calcPrice(rt.price, rt.maxGuests, guestCount);
                const lineTotal = qty * effectivePrice * nights;
                return (
                  <div key={rt.id} className="flex items-stretch gap-4 p-4 rounded-xl border border-border hover:border-muted-foreground/30 transition-all">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <img src={rt.image} alt={rt.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{rt.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rt.bedType} · {rt.areaSqFt} sq ft</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rt.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5">Up to {rt.maxGuests} guests</span>
                          {rt.availableRooms > 0 ? (
                            <span className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">{rt.availableRooms} available</span>
                          ) : (
                            <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Sold out</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setDetailRoomId(rt.id); setRoomImgIndex(0); }}
                          className="mt-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          View detail
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-6">
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">${effectivePrice}</p>
                          <p className="text-xs text-muted-foreground">/ night</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5">
                            <button
                              onClick={() => handleGuestChange(rt.id, -1)}
                              disabled={guestCount <= 1}
                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold tabular-nums text-foreground">{guestCount}</span>
                            <button
                              onClick={() => handleGuestChange(rt.id, 1)}
                              disabled={guestCount >= rt.maxGuests}
                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground">guests</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-right min-w-[70px]">
                          <p className="text-sm font-bold text-foreground">${lineTotal.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5">
                            <button
                              onClick={() => handleQtyChange(rt.id, -1)}
                              disabled={qty <= 0}
                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold tabular-nums text-foreground">{qty}</span>
                            <button
                              onClick={() => handleQtyChange(rt.id, 1)}
                              disabled={qty >= rt.availableRooms}
                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground">rooms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.values(roomQuantities).some(q => q > 0) && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Your selection</h3>
                <div className="space-y-2">
                  {Object.entries(roomQuantities).map(([roomId, qty]) => {
                    if (qty <= 0) return null;
                    const room = hotel.roomTypes.find(r => r.id === roomId);
                    if (!room) return null;
                    const gc = roomGuestCounts[roomId] || 1;
                    const ep = calcPrice(room.price, room.maxGuests, gc);
                    const roomTotal = qty * ep * nights;
                    return (
                      <div key={roomId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{room.name} × {qty} ({gc} guest{gc > 1 ? 's' : ''})</span>
                        <span className="text-foreground">${roomTotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground mt-4 pt-4 border-t border-border">
                  <span>Total</span>
                  <span>${Object.entries(roomQuantities)
                    .filter(([_, q]) => q > 0)
                    .reduce((sum, [roomId, qty]) => {
                      const room = hotel.roomTypes.find(r => r.id === roomId);
                      if (!room) return sum;
                      const gc = roomGuestCounts[roomId] || 1;
                      const ep = calcPrice(room.price, room.maxGuests, gc);
                      return sum + qty * ep * nights;
                    }, 0).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    const selected = Object.entries(roomQuantities).filter(([_, q]) => q > 0);
                    if (selected.length === 0) return;
                    const params = new URLSearchParams();
                    if (checkIn) params.set('checkIn', checkIn);
                    if (checkOut) params.set('checkOut', checkOut);
                    params.set('rooms', JSON.stringify(Object.fromEntries(selected)));
                    params.set('guestCounts', JSON.stringify(
                      Object.fromEntries(Object.entries(roomGuestCounts).filter(([id]) => selected.some(([sId]) => sId === id)))
                    ));
                    const query = params.toString();
                    if (!user) {
                      navigate('/login?redirect=' + encodeURIComponent('/reserve/' + id + '?' + query));
                    } else {
                      navigate('/reserve/' + id + '?' + query);
                    }
                  }}
                  disabled={Object.values(roomQuantities).every(q => q === 0)}
                  className="w-full mt-4 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reserve
                </button>
              </div>
            )}
          </div>

          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <Star size={18} className="fill-foreground stroke-foreground" />
              <span className="font-semibold text-foreground">{hotel.rating} · {hotel.reviews} reviews</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewSamples.map((r) => (
                <div key={r.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.author}</p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </div>
                    <div className="ml-auto flex">
                      {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} className="fill-foreground stroke-foreground" />)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-semibold text-foreground mb-6" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>
              More places like this
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((h) => <HotelCard key={h.id} {...h} />)}
            </div>
          </section>
        )}
      </div>

      {detailRoomId && (() => {
        const room = hotel.roomTypes.find(rt => rt.id === detailRoomId);
        if (!room) return null;
        const modalGuestCount = roomGuestCounts[room.id] || 1;
        const modalEffectivePrice = calcPrice(room.price, room.maxGuests, modalGuestCount);
        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDetailRoomId(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <div className="relative h-[420px] bg-muted">
                  <img
                    src={(room.gallery ?? hotel.images)[roomImgIndex]}
                    alt={`${room.name} photo ${roomImgIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {(room.gallery ?? hotel.images).length > 1 && (
                    <>
                      <button
                        onClick={() => setRoomImgIndex(v => v === 0 ? (room.gallery ?? hotel.images).length - 1 : v - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setRoomImgIndex(v => v === (room.gallery ?? hotel.images).length - 1 ? 0 : v + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {(room.gallery ?? hotel.images).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setRoomImgIndex(i)}
                            className="w-1.5 h-1.5 rounded-full transition-all"
                            style={{ backgroundColor: i === roomImgIndex ? '#fff' : 'rgba(255,255,255,0.5)' }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setDetailRoomId(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
                >
                  ✕
                </button>
                {room.breakfastIncluded && (
                  <span className="absolute bottom-3 left-3 bg-white/90 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                    Breakfast included
                  </span>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{room.name}</h3>
                    {room.bedComfortRating && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star size={13} className="fill-foreground stroke-foreground" />
                        <span className="text-sm font-semibold text-foreground">{room.bedComfortRating}</span>
                        <span className="text-xs text-muted-foreground">Bed comfort – Based on {room.bedComfortReviews} reviews</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{room.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 mt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Bed type</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.bedType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Room size</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.areaSqFt} sq ft</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Max guests</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.maxGuests}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{room.bedrooms > 1 ? 'Bedrooms' : 'Bedroom'}</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Beds</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.beds}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Bathrooms</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Available</p>
                    <p className="text-sm font-medium text-foreground mt-1">{room.availableRooms} of {room.totalRooms}</p>
                  </div>
                  {room.roomNumbers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Room numbers</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.roomNumbers.map(rn => (
                          <span key={rn} className="px-2 py-0.5 bg-accent rounded text-xs font-medium text-foreground">{rn}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {room.bathroomAmenities && room.bathroomAmenities.length > 0 && (
                  <div className="py-5 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">In your private bathroom</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                      {room.bathroomAmenities.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {room.roomFacilities && room.roomFacilities.length > 0 && (
                  <div className="py-5 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Room facilities</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                      {room.roomFacilities.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="py-5 border-t border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {room.smokingPolicy && (
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0 mt-0.5">🚭</span>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Smoking policy</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">{room.smokingPolicy}</p>
                        </div>
                      </div>
                    )}
                    {room.cancellationPolicy && (
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0 mt-0.5">❄️</span>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Cancellation</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">{room.cancellationPolicy}</p>
                        </div>
                      </div>
                    )}
                    {room.breakfastIncluded && (
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0 mt-0.5">🍳</span>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Meals</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">Continental breakfast included</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">💳</span>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Payment</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">No prepayment needed – pay at the property</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">${modalEffectivePrice}</p>
                    <p className="text-xs text-muted-foreground">per night</p>
                  </div>
                  <button
                    onClick={() => setDetailRoomId(null)}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}
