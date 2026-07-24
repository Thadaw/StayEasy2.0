import { Link } from "react-router-dom";
import { Star, MapPin, Heart } from "lucide-react";
import { Hotel } from "../data/hotels";

interface HotelCardProps {
  hotel: Hotel;
  href?: string;
  onClick?: () => void;
  showFavourite?: boolean;
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
  showLocation?: boolean;
  showTag?: boolean;
  className?: string;
  imageClassName?: string;
}

export function HotelCard({
  hotel,
  href,
  onClick,
  showFavourite = false,
  isFavourite = false,
  onToggleFavourite,
  showLocation = true,
  showTag = true,
  className = "",
  imageClassName = "",
}: HotelCardProps) {
  const content = (
    <>
      <div className={`relative h-[130px] md:h-[150px] overflow-hidden ${imageClassName}`}>
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {showFavourite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavourite?.(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <Heart size={14} className={isFavourite ? "text-red-500 fill-red-500" : "text-gray-600 hover:text-red-500 transition-colors"} />
          </button>
        )}
        {showTag && hotel.tag && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[9px] font-semibold" style={{ color: "var(--brand-heading)" }}>{hotel.tag}</span>
        )}
      </div>
      <div className="px-3 py-2 relative">
        <h3 className="text-xs md:text-sm font-bold leading-tight" style={{ color: "var(--brand-heading)" }}>{hotel.name}</h3>
        {showLocation && (
          <p className="text-[9px] md:text-[10px] mb-1 flex items-center gap-0.5" style={{ color: "var(--brand-text-secondary)" }}>
            <MapPin size={9} /> {hotel.location}
          </p>
        )}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1">
            <Star size={11} className="text-yellow-500 fill-yellow-500" />
            <span className="text-[11px] font-semibold" style={{ color: "var(--brand-heading)" }}>{hotel.rating}</span>
          </div>
          <p className="text-xs md:text-sm font-bold leading-tight" style={{ color: "var(--brand-heading)" }}>${hotel.price} <span className="text-[9px] font-normal" style={{ color: "var(--brand-text-secondary)" }}>/ night</span></p>
        </div>
      </div>
    </>
  );

  const wrapperClass = `bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer ${className}`;

  if (href) {
    return (
      <Link to={href} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={wrapperClass}>
      {content}
    </div>
  );
}
