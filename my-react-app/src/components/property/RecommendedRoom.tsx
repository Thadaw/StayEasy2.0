import { RoomType } from "../../data/hotels";
import { calcPrice } from "../../utils/pricing";

interface RecommendedRoomProps {
  room: RoomType;
  guestCount: number;
  checkIn: string;
  onReserve: (roomId: string) => void;
}

export function RecommendedRoom({ room, guestCount, checkIn, onReserve }: RecommendedRoomProps) {
  const effectivePrice = calcPrice(room.price, room.maxGuests, guestCount);
  const cancelDate = checkIn
    ? new Date(new Date(checkIn).getTime() - 2 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex items-stretch gap-5 px-6 py-5 rounded-xl border-2 border-primary bg-brand-primary-extra-light hover:border-primary/70 transition-all">
      <img src={room.image} alt={room.name} className="w-32 h-32 rounded-xl object-cover shrink-0 self-start" />

      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground">{room.name}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{room.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[11px] text-foreground font-medium bg-gray-100 rounded-full px-2.5 py-1">{room.bedType}</span>
          <span className="text-[11px] text-primary font-semibold border border-primary/30 rounded-full px-2.5 py-1">{guestCount} guest{guestCount > 1 ? "s" : ""}</span>
          <span className="text-[11px] text-foreground font-medium bg-gray-100 rounded-full px-2.5 py-1">{room.bedrooms} bedroom{room.bedrooms > 1 ? "s" : ""}</span>
          <span className="text-[11px] text-foreground font-medium bg-gray-100 rounded-full px-2.5 py-1">{room.bathrooms} bath{room.bathrooms > 1 ? "s" : ""}</span>
          <span className="text-[11px] text-foreground font-medium bg-gray-100 rounded-full px-2.5 py-1">{room.areaSqFt} sq ft</span>
        </div>
        {room.roomFacilities && room.roomFacilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {room.roomFacilities.slice(0, 6).map((f, i) => (
              <span key={i} className="text-[10px] text-foreground bg-gray-100 rounded-full px-2 py-0.5">{f}</span>
            ))}
            {room.roomFacilities.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{room.roomFacilities.length - 6} more</span>
            )}
          </div>
        )}
        {room.breakfastIncluded && (
          <span className="inline-block text-[10px] text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 mt-2">Breakfast included</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-green-600 shrink-0" />
          <span className="text-[11px] text-green-700 font-medium">Free cancellation before {cancelDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-green-600 shrink-0" />
          <span className="text-[11px] text-foreground">No prepayment needed – pay at the property</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-green-600 shrink-0" />
          <span className="text-[11px] text-foreground">No credit card needed</span>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end justify-between">
        <div className="text-right">
          <p className="text-xl font-bold text-foreground">${effectivePrice}</p>
          <p className="text-xs text-muted-foreground">/ night</p>
        </div>
        <button
          onClick={() => onReserve(room.id)}
          className="px-5 py-2.5 text-white text-xs font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: "#1A3C5E" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#163552"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1A3C5E"}
        >
          Reserve
        </button>
      </div>
    </div>
  );
}
