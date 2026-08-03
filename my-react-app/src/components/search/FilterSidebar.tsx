import { SlidersHorizontal, Bed } from "lucide-react";
import { PROPERTY_TYPES, AMENITIES_LIST, BED_TYPES, PROPERTY_RULES } from "../../constants/searchFilters";

interface FilterSidebarProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedPropertyTypes: string[];
  onTogglePropertyType: (type: string) => void;
  selectedAmenities: string[];
  onToggleAmenity: (amenity: string) => void;
  selectedRules: string[];
  onToggleRule: (rule: string) => void;
  selectedBedTypes: string[];
  onToggleBedType: (bed: string) => void;
  guestRating: string;
  onGuestRatingChange: (rating: string) => void;
  onClearAll: () => void;
}

export function FilterSidebar({
  priceRange,
  onPriceRangeChange,
  selectedPropertyTypes,
  onTogglePropertyType,
  selectedAmenities,
  onToggleAmenity,
  selectedRules,
  onToggleRule,
  selectedBedTypes,
  onToggleBedType,
  guestRating,
  onGuestRatingChange,
  onClearAll,
}: FilterSidebarProps) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-gray-200 pr-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--brand-heading)" }}>
            <SlidersHorizontal size={16} /> Filters
          </h3>
          <button onClick={onClearAll} className="text-xs font-semibold text-brand-accent hover:underline">Clear all</button>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Price range per night</h4>
          <p className="text-xs mb-2" style={{ color: "var(--brand-text-secondary)" }}>${priceRange[0]} - ${priceRange[1]}+</p>
          <input
            type="range"
            min={0}
            max={500}
            value={priceRange[1]}
            onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-brand-primary"
          />
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
              className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-accent"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
              className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-accent"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Property type</h4>
          <div className="space-y-2">
            {PROPERTY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <label key={type.label} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedPropertyTypes.includes(type.label)}
                    onChange={() => onTogglePropertyType(type.label)}
                    className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                  />
                  <Icon size={14} className="text-gray-500" />
                  <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{type.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Amenities</h4>
          <div className="space-y-2">
            {AMENITIES_LIST.map((amenity) => {
              const Icon = amenity.icon;
              return (
                <label key={amenity.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.label)}
                    onChange={() => onToggleAmenity(amenity.label)}
                    className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                  />
                  <Icon size={14} className="text-gray-500" />
                  <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{amenity.label}</span>
                </label>
              );
            })}
          </div>
          <button className="text-xs font-semibold text-brand-accent hover:underline mt-2">Show more</button>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Bed types</h4>
          <div className="space-y-2">
            {BED_TYPES.map((bed) => (
              <label key={bed.label} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBedTypes.includes(bed.label)}
                  onChange={() => onToggleBedType(bed.label)}
                  className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                />
                <Bed size={14} className="text-gray-500" />
                <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{bed.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Guest rating</h4>
          <div className="flex gap-2">
            {["Any", "4.0+", "4.5+", "5.0"].map((rating) => (
              <button
                key={rating}
                onClick={() => onGuestRatingChange(rating)}
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

        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-heading)" }}>Property rules</h4>
          <div className="space-y-2">
            {PROPERTY_RULES.map((rule) => (
              <label key={rule.label} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRules.includes(rule.label)}
                  onChange={() => onToggleRule(rule.label)}
                  className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
                />
                <span className="text-xs flex-1" style={{ color: "var(--brand-heading)" }}>{rule.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
