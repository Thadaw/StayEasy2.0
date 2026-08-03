import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { SearchBar } from "../components/SearchBar";
import { StickySearchHeader } from "../components/StickySearchHeader";
import { Footer } from "../components/Footer";
import { useFavorites } from "../context/FavoritesContext";
import { getDefaultDates } from "../utils/date";
import { parseSearchResponse } from "../utils/helpers";
import type { SearchProperty } from "../types/api";
import { FilterSidebar } from "../components/search/FilterSidebar";
import { SearchResultCard } from "../components/search/SearchResultCard";
import { SortDropdown } from "../components/search/SortDropdown";
import { Pagination } from "../components/search/Pagination";
import { EmptySearch } from "../components/search/EmptySearch";
import api from "../api";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const guests = searchParams.get("guests") || "2 guests";
  const whereParam = searchParams.get("where") || "";
  const propertyTypesParam = searchParams.get("propertyTypes") || "";
  const checkinParam = searchParams.get("checkin") || "";
  const checkoutParam = searchParams.get("checkout") || "";
  const { isFavorite, toggleFavorite } = useFavorites();

  const [searchResults, setSearchResults] = useState<SearchProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    if (!whereParam && !propertyTypesParam) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { today, tomorrow } = getDefaultDates();
      const queryParams: Record<string, string> = {
        check_in: checkinParam || today,
        check_out: checkoutParam || tomorrow,
      };
      if (whereParam) {
        queryParams.destination = whereParam;
      } else if (propertyTypesParam) {
        queryParams.destination = propertyTypesParam;
      }
      if (propertyTypesParam) {
        queryParams.property_type = propertyTypesParam;
      }
      const guestParts = guests.match(/\d+/g);
      queryParams.adults = guestParts?.[0] || "1";
      queryParams.children = guestParts?.[1] || "0";
      queryParams.rooms = "1";

      const { data } = await api.get("/search", { params: queryParams });
      const results = parseSearchResponse<SearchProperty>(data);
      setSearchResults(results);
    } catch (err) {
      console.error("Search API error:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [whereParam, propertyTypesParam, checkinParam, checkoutParam, guests]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(() => {
    const fromUrl = searchParams.get("propertyTypes")?.split(",").filter(Boolean);
    if (fromUrl && fromUrl.length > 0) {
      const mapped = fromUrl.map((t) => {
        const lower = t.toLowerCase();
        if (lower === "hotel" || lower === "hostel") return "Hotels";
        if (lower === "apartment") return "Apartments";
        if (lower === "villa") return "Villa";
        if (lower === "resort") return "Resort";
        return "Others";
      });
      return [...new Set(mapped)];
    }
    return ["All types"];
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [selectedBedTypes, setSelectedBedTypes] = useState<string[]>([]);
  const [guestRating, setGuestRating] = useState<string>("Any");
  const [sortBy, setSortBy] = useState("Recommended");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleArrayValue = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

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

  const toggleAmenity = (amenity: string) => toggleArrayValue(amenity, setSelectedAmenities);
  const toggleRule = (rule: string) => toggleArrayValue(rule, setSelectedRules);
  const toggleBedType = (bed: string) => toggleArrayValue(bed, setSelectedBedTypes);

  const filteredHotels = useMemo(() => {
    return searchResults.filter((property) => {
      if (whereParam && whereParam.toLowerCase() !== (propertyTypesParam || "").toLowerCase()) {
        const parts = whereParam.toLowerCase().split(",").map((s) => s.trim());
        const matches = parts.some((p) =>
          (property.address || "").toLowerCase().includes(p) ||
          property.city.toLowerCase().includes(p) ||
          property.name.toLowerCase().includes(p) ||
          property.country.toLowerCase().includes(p) ||
          (property.state || "").toLowerCase().includes(p)
        );
        if (!matches) return false;
      }

      if (property.total_price < priceRange[0] || property.total_price > priceRange[1]) return false;

      if (selectedAmenities.length > 0) {
        const matches = selectedAmenities.every((a) =>
          (property.amenities || []).some((amenity) => amenity.toLowerCase().includes(a.toLowerCase()))
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [searchResults, whereParam, propertyTypesParam, priceRange, selectedAmenities]);

  const clearAll = () => {
    setPriceRange([0, 500]);
    setSelectedPropertyTypes(["All types"]);
    setSelectedAmenities([]);
    setSelectedRules([]);
    setSelectedBedTypes([]);
    setGuestRating("Any");
  };

  const buildFilterParams = () => {
    const params = new URLSearchParams();
    if (whereParam) params.set("where", whereParam);
    if (checkinParam) params.set("checkin", checkinParam);
    if (checkoutParam) params.set("checkout", checkoutParam);
    if (guests) params.set("guests", guests);
    if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(","));
    return params.toString();
  };

  const hasSearchCriteria = Boolean(whereParam || propertyTypesParam);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <StickySearchHeader>
        <SearchBar />
      </StickySearchHeader>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <FilterSidebar
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            selectedPropertyTypes={selectedPropertyTypes}
            onTogglePropertyType={togglePropertyType}
            selectedAmenities={selectedAmenities}
            onToggleAmenity={toggleAmenity}
            selectedRules={selectedRules}
            onToggleRule={toggleRule}
            selectedBedTypes={selectedBedTypes}
            onToggleBedType={toggleBedType}
            guestRating={guestRating}
            onGuestRatingChange={setGuestRating}
            onClearAll={clearAll}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: "var(--brand-heading)" }}>
                {loading ? "Searching..." : `${filteredHotels.length} stays${whereParam ? ` in ${whereParam}` : propertyTypesParam ? ` - ${propertyTypesParam}` : ""}`}
              </h2>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <span className="w-8 h-8 border-3 border-gray-200 border-t-brand-accent rounded-full animate-spin" />
                </div>
              ) : filteredHotels.length === 0 ? (
                <EmptySearch hasSearchCriteria={hasSearchCriteria} />
              ) : (
                filteredHotels.map((property) => (
                  <SearchResultCard
                    key={property.property_id}
                    property={property}
                    isFavorite={isFavorite(property.property_id)}
                    onToggleFavorite={toggleFavorite}
                    filterParams={buildFilterParams()}
                    guests={guests}
                  />
                ))
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={15}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
