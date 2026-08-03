import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { trendingDestinations } from "../../data/trendingDestinations";
import { useFavorites } from "../../context/FavoritesContext";
import { FavouriteButton } from "../common/FavouriteButton";

export function TrendingSection() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
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
              <FavouriteButton isFavourite={isFavorite(dest.id)} onToggle={() => toggleFavorite(dest.id)} />
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
  );
}
