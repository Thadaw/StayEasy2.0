import { Property } from "../../hooks/useSearchProperties";
import { PropertyCard } from "./PropertyCard";

interface DestinationResultsProps {
  selectedDestination: string | null;
  properties: Property[];
  loading: boolean;
  onClear: () => void;
}

export function DestinationResults({ selectedDestination, properties, loading, onClear }: DestinationResultsProps) {
  if (!selectedDestination) return null;

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold font-display text-brand-heading">
          Stays in {selectedDestination}
        </h2>
        <button onClick={onClear} className="text-sm font-semibold text-brand-accent hover:underline">
          Clear
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-[130px] md:h-[150px] bg-gray-200" />
              <div className="px-3 py-2 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-sm text-brand-text-secondary">
            No properties found in {selectedDestination}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {properties.map((property) => (
            <PropertyCard key={property.property_id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
