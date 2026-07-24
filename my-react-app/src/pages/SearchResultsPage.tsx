import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { SearchBar } from "../components/SearchBar";
import { StickySearchHeader } from "../components/StickySearchHeader";
import { Footer } from "../components/Footer";
import { hotels } from "../data/hotels";
import { MapPin, Star, Heart, ChevronLeft, ChevronRight, SlidersHorizontal, X, Bed, Wifi, Utensils, Waves, TreePine, Home, Building2, Castle, ExternalLink } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";

const propertyTypes = [
  { label: "All types", icon: Home, count: 342 },
  { label: "Hotels", icon: Building2, count: 215 },
  { label: "Apartments", icon: Building2, count: 128 },
  { label: "Villa", icon: Castle, count: 342 },
  { label: "Resort", icon: Waves, count: 97 },
  { label: "Others", icon: TreePine, count: 64 },
];

const amenitiesList = [
  { label: "Pool", icon: Waves, count: 542 },
  { label: "Free WiFi", icon: Wifi, count: 728 },
  { label: "Breakfast included", icon: Utensils, count: 344 },
  { label: "Free cancellation", icon: X, count: 612 },
  { label: "Beachfront", icon: Waves, count: 289 },
  { label: "Kitchen", icon: Utensils, count: 456 },
  { label: "Air conditioning", icon: Wifi, count: 678 },
  { label: "Washer", icon: Home, count: 312 },
  { label: "Hot tub", icon: Waves, count: 187 },
  { label: "BBQ grill", icon: Utensils, count: 145 },
  { label: "Ocean view", icon: Waves, count: 234 },
  { label: "Mountain view", icon: TreePine, count: 198 },
  { label: "Fireplace", icon: Home, count: 167 },
  { label: "Self check-in", icon: Home, count: 423 },
  { label: "Smoke detector", icon: Home, count: 589 },
];

const bedTypes = [
  { label: "King bed", count: 234 },
  { label: "Queen bed", count: 312 },
  { label: "Single bed", count: 187 },
  { label: "Sofa bed", count: 156 },
  { label: "Bunk bed", count: 89 },
  { label: "Floor mattress", count: 45 },
];

const propertyRules = [
  { label: "Free parking", count: 305 },
  { label: "Pets allowed", count: 189 },
  { label: "Pet friendly", count: 120 },
  { label: "Smoking allowed", count: 45 },
  { label: "Events allowed", count: 78 },
  { label: "Quiet hours", count: 234 },
];


export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const guests = searchParams.get("guests") || "2 guests";
  const whereParam = searchParams.get("where") || "";
  const checkinParam = searchParams.get("checkin") || "";
  const budgetParam = searchParams.get("budget") || "";
  const { isFavorite, toggleFavorite } = useFavorites();

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(() => {
    const fromUrl = searchParams.get("propertyTypes")?.split(",").filter(Boolean);
    return fromUrl && fromUrl.length > 0 ? fromUrl : ["All types"];
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [selectedBedTypes, setSelectedBedTypes] = useState<string[]>([]);
  const [guestRating, setGuestRating] = useState<string>("Any");
  const [sortBy, setSortBy] = useState("Recommended");
  const [currentPage, setCurrentPage] = useState(1);

  const togglePropertyType = (type: string) => {
    if (type === "All types") {
      setSelectedPropertyTypes(["All types"]);
    } else {
      setSelectedPropertyTypes((prev) => {
        const next = prev.filter((t) => t !== "All types");
        if (next.includes(type)) {
          return next.filter((t) => t !== type);
        }
        return [...next, type];
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const toggleBedType = (bed: string) => {
    setSelectedBedTypes((prev) =>
      prev.includes(bed) ? prev.filter((b) => b !== bed) : [...prev, bed]
    );
  };

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      // Where filter
      if (whereParam) {
        const q = whereParam.toLowerCase();
        const matches = h.location.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.name.toLowerCase().includes(q) || h.country.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (h.price < priceRange[0] || h.price > priceRange[1]) return false;

      // Budget filter
      if (budgetParam && budgetParam !== "Any budget") {
        const budgetMap: Record<string, [number, number]> = {
          "Under $50": [0, 50],
          "$50 – $100": [50, 100],
          "$100 – $200": [100, 200],
          "$200 – $500": [200, 500],
          "$500+": [500, Infinity],
        };
        const [min, max] = budgetMap[budgetParam] || [0, Infinity];
        if (h.price < min || h.price > max) return false;
      }

      // Property type filter
      if (!selectedPropertyTypes.includes("All types")) {
        const typeMap: Record<string, string[]> = {
          "Villas": ["villa"],
          "Hotels": ["resort", "hotel"],
          "Apartments": ["apartment", "loft"],
          "Resorts": ["resort", "eco"],
          "Cottages": ["cottage", "chalet", "lodge"],
        };
        const matches = selectedPropertyTypes.some((t) =>
          typeMap[t]?.some((k) => h.category.toLowerCase().includes(k) || h.name.toLowerCase().includes(k))
        );
        if (!matches) return false;
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const matches = selectedAmenities.every((a) =>
          h.amenities.some((ha) => ha.toLowerCase().includes(a.toLowerCase()))
        );
        if (!matches) return false;
      }

      // Bed types filter
      if (selectedBedTypes.length > 0) {
        const hotelBedTypes = h.roomTypes.map((r) => r.bedType?.toLowerCase() || "");
        const matches = selectedBedTypes.some((bt) =>
          hotelBedTypes.some((hbt) => hbt.includes(bt.toLowerCase().replace(" bed", "")))
        );
        if (!matches) return false;
      }

      // Guest rating filter
      if (guestRating !== "Any") {
        const minRating = parseFloat(guestRating);
        if (h.rating < minRating) return false;
      }

      return true;
    });
  }, [whereParam, budgetParam, priceRange, selectedPropertyTypes, selectedAmenities, selectedBedTypes, guestRating]);

  const clearAll = () => {
    setPriceRange([0, 500]);
    setSelectedPropertyTypes(["All types"]);
    setSelectedAmenities([]);
    setSelectedRules([]);
    setSelectedBedTypes([]);
    setGuestRating("Any");
  };

  const [cardImages, setCardImages] = useState<Record<number, number>>({});
  const [showPrevBtn, setShowPrevBtn] = useState<Record<number, boolean>>({});

  const buildFilterParams = () => {
    const params = new URLSearchParams();
    params.set("guests", guests);
    if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(","));
    if (selectedBedTypes.length > 0) params.set("bedTypes", selectedBedTypes.join(","));
    if (guestRating !== "Any") params.set("guestRating", guestRating);
    if (priceRange[0] > 0 || priceRange[1] < 500) params.set("priceMin", String(priceRange[0]));
    if (priceRange[1] < 500) params.set("priceMax", String(priceRange[1]));
    if (!selectedPropertyTypes.includes("All types")) params.set("propertyTypes", selectedPropertyTypes.join(","));
    return params.toString();
  };

  const getCardImage = (hotel: typeof hotels[0], index: number) => {
    const images = hotel.images?.length ? hotel.images : [hotel.imageUrl];
    return images[index % images.length];
  };

  const getCardImageCount = (hotel: typeof hotels[0]) => {
    return hotel.images?.length || 1;
  };

  const prevImage = (hotelId: number, total: number) => {
    setCardImages((prev) => {
      const current = prev[hotelId] || 0;
      const newIdx = current === 0 ? total - 1 : current - 1;
      if (newIdx === 0) setShowPrevBtn((p) => ({ ...p, [hotelId]: false }));
      return { ...prev, [hotelId]: newIdx };
    });
  };

  const nextImage = (hotelId: number, total: number) => {
    setCardImages((prev) => {
      const current = prev[hotelId] || 0;
      return { ...prev, [hotelId]: current === total - 1 ? 0 : current + 1 };
    });
    setShowPrevBtn((prev) => ({ ...prev, [hotelId]: true }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <StickySearchHeader>
        <SearchBar />
      </StickySearchHeader>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-[260px] shrink-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--brand-heading)" }}>
                  <SlidersHorizontal size={16} /> Filters
                </h3>
                <button onClick={clearAll} className="text-xs font-semibold text-brand-accent hover:underline">Clear all</button>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Price range per night</h4>
                <p className="text-xs mb-2" style={{ color: "var(--brand-text-secondary)" }}>${priceRange[0]} - ${priceRange[1]}+</p>
                <input
                  type="range"
                  min={0}
                  max={500}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-brand-primary"
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-accent"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Property type</h4>
                <div className="space-y-2">
                  {propertyTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <label key={type.label} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedPropertyTypes.includes(type.label)}
                          onChange={() => togglePropertyType(type.label)}
                          className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                        />
                        <Icon size={14} className="text-gray-500" />
                        <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{type.label}</span>
                        <span className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{type.count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Amenities</h4>
                <div className="space-y-2">
                  {amenitiesList.map((amenity) => {
                    const Icon = amenity.icon;
                    return (
                      <label key={amenity.label} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity.label)}
                          onChange={() => toggleAmenity(amenity.label)}
                          className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                        />
                        <Icon size={14} className="text-gray-500" />
                        <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{amenity.label}</span>
                        <span className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{amenity.count}</span>
                      </label>
                    );
                  })}
                </div>
                <button className="text-xs font-semibold text-brand-accent hover:underline mt-2">Show more</button>
              </div>

              {/* Bed Types */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Bed types</h4>
                <div className="space-y-2">
                  {bedTypes.map((bed) => (
                    <label key={bed.label} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBedTypes.includes(bed.label)}
                        onChange={() => toggleBedType(bed.label)}
                        className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                      />
                      <Bed size={14} className="text-gray-500" />
                      <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{bed.label}</span>
                      <span className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{bed.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guest Rating */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Guest rating</h4>
                <div className="flex gap-2">
                  {["Any", "4.0+", "4.5+", "5.0"].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setGuestRating(rating)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        guestRating === rating
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={guestRating !== rating ? { color: "var(--brand-heading)" } : {}}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Rules */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Property rules</h4>
                <div className="space-y-2">
                  {propertyRules.map((rule) => (
                    <label key={rule.label} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRules.includes(rule.label)}
                        onChange={() => toggleRule(rule.label)}
                        className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                      />
                      <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{rule.label}</span>
                      <span className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>{rule.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
                {filteredHotels.length} stays in Bali
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm font-semibold border-none outline-none cursor-pointer"
                  style={{ color: "var(--brand-heading)" }}
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Price low to high">Price: Low to High</option>
                  <option value="Price high to low">Price: High to Low</option>
                  <option value="Rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Hotel Cards */}
            <div className="space-y-4">
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  onClick={() => navigate(`/hotel/${hotel.id}?${buildFilterParams()}`)}
                  className="flex bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                >
                  {/* Image Carousel */}
                  <div className="relative w-[320px] shrink-0">
                    <img
                      src={getCardImage(hotel, cardImages[hotel.id] || 0)}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    {hotel.tag && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-primary text-white text-[10px] font-semibold rounded-lg">
                        {hotel.tag}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(hotel.id); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Heart size={16} className={isFavorite(hotel.id) ? "text-red-500 fill-red-500" : "text-gray-600 hover:text-red-500 transition-colors"} />
                    </button>
                    {getCardImageCount(hotel) > 1 && (
                      <>
                        {showPrevBtn[hotel.id] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); prevImage(hotel.id, getCardImageCount(hotel)); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <ChevronLeft size={16} className="text-gray-700" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(hotel.id, getCardImageCount(hotel)); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronRight size={16} className="text-gray-700" />
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {Array.from({ length: getCardImageCount(hotel) }).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${(cardImages[hotel.id] || 0) === i ? "bg-white" : "bg-white/50"}`} />
                      ))}
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="flex-1 p-5 flex justify-between">
                    <div>
                      <h3 className="text-base font-bold mb-1" style={{ color: "var(--brand-heading)" }}>{hotel.name}</h3>
                      <p className="text-xs flex items-center gap-1 mb-2" style={{ color: "var(--brand-text-secondary)" }}>
                        <MapPin size={12} /> {hotel.location}, {hotel.city}
                        <a
                          href={`https://www.google.com/maps?q=${hotel.lat},${hotel.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 ml-2 text-[10px] font-semibold text-brand-accent hover:underline"
                        >
                          <ExternalLink size={10} /> View in map
                        </a>
                      </p>
                      <div className="flex items-center gap-1 mb-3">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-semibold" style={{ color: "var(--brand-heading)" }}>{hotel.rating}</span>
                        <span className="text-[10px]" style={{ color: "var(--brand-text-secondary)" }}>({hotel.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {hotel.amenities?.slice(0, 5).map((amenity, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full" style={{ color: "var(--brand-text-secondary)" }}>
                            {amenity}
                          </span>
                        ))}
                        {(hotel.amenities?.length || 0) > 5 && (
                          <span className="text-[10px]" style={{ color: "var(--brand-text-secondary)" }}>+{hotel.amenities.length - 5} more</span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-green-600">
                        {hotel.roomTypes.reduce((sum, rt) => sum + rt.availableRooms, 0)} rooms available
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex flex-col justify-between">
                      <div className="flex items-start justify-end gap-3">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--brand-heading)" }}>
                            {hotel.rating >= 8 ? "Excellent" : hotel.rating >= 7 ? "Very good" : hotel.rating >= 6 ? "Good" : "Average"}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--brand-text-secondary)" }}>{hotel.reviews} reviews</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#003580" }}>
                          {hotel.rating}
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-[10px]" style={{ color: "var(--brand-text-secondary)" }}>{checkinParam ? "1 night" : "1 night"}, {guests} guests</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: "var(--brand-heading)" }}>${hotel.price * 1}</p>
                        <p className="text-[10px]" style={{ color: "var(--brand-text-secondary)" }}>Includes taxes and charges</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/hotel/${hotel.id}?${buildFilterParams()}`); }}
                        className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                        style={{ backgroundColor: "#EBF6EF", color: "#1E8449" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#D4EDDA"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#EBF6EF"; }}
                      >
                        See availability
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                    currentPage === page
                      ? "bg-brand-primary text-white"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                  style={currentPage !== page ? { color: "var(--brand-heading)" } : {}}
                >
                  {page}
                </button>
              ))}
              <span className="text-xs" style={{ color: "var(--brand-text-secondary)" }}>...</span>
              <button
                onClick={() => setCurrentPage(15)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-semibold hover:bg-gray-50"
                style={{ color: "var(--brand-heading)" }}
              >
                15
              </button>
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
