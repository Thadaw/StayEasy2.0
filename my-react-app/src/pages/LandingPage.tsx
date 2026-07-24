import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { HeroSection } from "../components/HeroSection";
import { Footer } from "../components/Footer";
import { DestinationCard } from "../components/DestinationCard";
import { hotels } from "../data/hotels";
import { propertyTypes } from "../data/propertyTypes";
import { trendingDestinations } from "../data/trendingDestinations";
import { popularDestinations } from "../data/popularDestinations";
import { trustBadges } from "../data/trustBadges";
import { testimonials } from "../data/testimonials";
import { haversineDistance } from "../utils/geo";
import { Star, ArrowRight, ChevronLeft, ChevronRight, Heart, MapPin, Quote } from "lucide-react";
import { HotelCard } from "../components/HotelCard";
import { useFavorites } from "../context/FavoritesContext";

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [email, setEmail] = useState("");
  const propertyScrollRef = useRef<HTMLDivElement>(null);
  const destinationScrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showPropertyPrev, setShowPropertyPrev] = useState(false);
  const [showDestinationPrev, setShowDestinationPrev] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const nearbyHotels = useMemo(() => {
    if (!userLocation) return [];
    return hotels
      .map((h) => ({ hotel: h, dist: haversineDistance(userLocation.lat, userLocation.lng, h.lat, h.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4)
      .map((e) => e.hotel);
  }, [userLocation]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1024) setItemsPerPage(3);
      else if (window.innerWidth >= 768) setItemsPerPage(2);
      else setItemsPerPage(1);
    };
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const scrollPropertyTypes = (direction: "left" | "right") => {
    if (propertyScrollRef.current) {
      const scrollAmount = 240;
      propertyScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(() => {
        if (propertyScrollRef.current) {
          setShowPropertyPrev(propertyScrollRef.current.scrollLeft > 10);
        }
      }, 350);
    }
  };

  const scrollDestinations = (direction: "left" | "right") => {
    if (destinationScrollRef.current) {
      const scrollAmount = 200;
      destinationScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(() => {
        if (destinationScrollRef.current) {
          setShowDestinationPrev(destinationScrollRef.current.scrollLeft > 10);
        }
      }, 350);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <HeroSection />

      {/* Browse by property type */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
          Browse by property type
        </h2>
        <div className="relative">
          <div
            ref={propertyScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide"
          >
            {propertyTypes.map((property, index) => {
              const Icon = property.icon;
              return (
                <div key={index} className="shrink-0 w-[260px] sm:w-[300px] group cursor-pointer" onClick={() => { window.scrollTo(0, 0); navigate(`/search?propertyTypes=${property.type}`); }}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3">
                    <img
                      src={property.imageUrl}
                      alt={property.type}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center mb-2">
                        <Icon size={18} className="text-gray-800" />
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-white drop-shadow">{property.type}</h3>
                      <p className="text-[11px] md:text-xs text-white/80 drop-shadow mt-0.5">{property.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showPropertyPrev && (
            <button
              onClick={() => scrollPropertyTypes("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
          )}
          <button
            onClick={() => scrollPropertyTypes("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </div>
      </section>

      {/* Stays nearby */}
      {nearbyHotels.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <MapPin size={20} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
              Stays nearby
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {nearbyHotels.map((h) => (
              <HotelCard key={h.id} hotel={h} onClick={() => navigate(`/hotel/${h.id}`)} showFavourite isFavourite={isFavorite(h.id)} onToggleFavourite={() => toggleFavorite(h.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Trending destinations */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
          Trending destinations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {trendingDestinations.map((dest) => (
            <div key={dest.id} onClick={() => navigate(`/hotel/${dest.id}`)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="relative h-[130px] md:h-[150px] overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(dest.id); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                  <Heart size={14} className={isFavorite(dest.id) ? "text-red-500 fill-red-500" : "text-gray-600 hover:text-red-500 transition-colors"} />
                </button>
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[9px] font-semibold" style={{ color: "var(--brand-heading)" }}>{dest.type}</span>
              </div>
              <div className="px-3 py-2 relative">
                <h3 className="text-xs md:text-sm font-bold leading-tight" style={{ color: "var(--brand-heading)" }}>{dest.name}</h3>
                <p className="text-[9px] md:text-[10px] mb-1" style={{ color: "var(--brand-text-secondary)" }}>{dest.location}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[9px] line-through" style={{ color: "var(--brand-text-secondary)" }}>${dest.price + 30}</span>
                    <p className="text-xs md:text-sm font-bold leading-tight" style={{ color: "var(--brand-heading)" }}>${dest.price} <span className="text-[9px] font-normal" style={{ color: "var(--brand-text-secondary)" }}>/ night</span></p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--brand-heading)" }}>{dest.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular destinations */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
            Popular destinations
          </h2>
          <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-brand-accent hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="relative">
          <div
            ref={destinationScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide"
          >
            {popularDestinations.map((dest, index) => (
              <div key={index} className="shrink-0 w-[160px] sm:w-[200px]" onClick={() => { window.scrollTo(0, 0); navigate(`/country/${dest.countryCode}`); }}>
                <DestinationCard
                  city={dest.city}
                  country={dest.country}
                  imageUrl={dest.image}
                  properties={dest.properties}
                />
              </div>
            ))}
          </div>
          {showDestinationPrev && (
            <button
              onClick={() => scrollDestinations("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
          )}
          <button
            onClick={() => scrollDestinations("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-brand-accent-light flex items-center justify-center mb-3">
                  <Icon size={22} className="text-brand-accent" />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--brand-heading)" }}>{badge.title}</h3>
                <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* What travelers say */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14 bg-gray-50">
        <h2 className="text-xl md:text-2xl font-bold mb-8 md:mb-10 text-center" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
          What travelers say
        </h2>
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentTestimonial * (100 / itemsPerPage)}%)` }}
          >
            {testimonials.map((t) => (
              <div key={t.id} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-2 md:px-3">
                <div className="bg-white rounded-2xl p-6 shadow-sm relative h-full">
                  <Quote size={32} className="text-brand-accent opacity-20 absolute top-4 left-4" />
                  <p className="text-sm leading-relaxed mb-6 relative z-10 pt-6" style={{ color: "var(--brand-text-secondary)" }}>
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-accent to-brand-primary flex items-center justify-center text-white text-sm font-bold">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--brand-heading)" }}>{t.name}</p>
                      <p className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(testimonials.length / itemsPerPage) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentTestimonial(i)}
              className={`w-2 h-2 rounded-full transition-all ${currentTestimonial === i ? "bg-brand-accent w-6" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-12 md:py-16" style={{ background: "var(--gradient-cta)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--brand-text-white)" }}>
                Ready for your next adventure?
              </h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                Sign up now and receive exclusive deals straight to your inbox.
              </p>
            </div>
            <div className="w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3 rounded-xl text-sm w-full sm:w-72 outline-none"
                  style={{ backgroundColor: "var(--brand-surface)", color: "var(--brand-heading)" }}
                />
                <button
                  className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
                  style={{ backgroundColor: "var(--brand-surface)", color: "var(--brand-primary)" }}
                >
                  Get started →
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                <input type="checkbox" className="mr-1.5" />
                I agree to receive email updates. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
