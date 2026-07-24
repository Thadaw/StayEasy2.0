import { Hotel } from "../../data/hotels";
import { HotelCard } from "../HotelCard";
import { useFavorites } from "../../context/FavoritesContext";

interface NearbyStaysProps {
  hotels: Hotel[];
}

export function NearbyStays({ hotels }: NearbyStaysProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  if (hotels.length === 0) return null;

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-16 border-t border-border pt-10 pb-4">
      <h2 className="font-semibold text-foreground mb-6" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>
        More stays nearby
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {hotels.map((h) => (
          <HotelCard key={h.id} hotel={h} href={`/hotel/${h.id}`} showFavourite isFavourite={isFavorite(h.id)} onToggleFavourite={() => toggleFavorite(h.id)} />
        ))}
      </div>
    </section>
  );
}
