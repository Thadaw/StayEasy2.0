import { RoomType } from "../../data/hotels";

interface RecommendedRoomProps {
  room: RoomType;
  guestCount: number;
  checkIn: string;
  onReserve: (roomId: string) => void;
}

export function RecommendedRoom({ room, guestCount, checkIn, onReserve }: RecommendedRoomProps) {
  const cancelDate = checkIn
    ? new Date(new Date(checkIn).getTime() - 2 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-xl border border-brand-primary-extra-light bg-brand-primary-extra-light hover:border-primary/70 transition-all">
      {/* Image */}
      <img src={room.image} alt={room.name} className="w-full md:w-36 h-48 md:h-36 rounded-lg object-cover shrink-0" />

      {/* Middle section - Room Details + Policies */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-3 md:gap-4">
        {/* Room Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{room.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${room.availableRooms > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {room.availableRooms > 0 ? 'Available' : 'Sold out'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Floor {room.floorNumber}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Up to {room.maxGuests} guests ({room.maxAdults} adults{room.maxChildren ? `, ${room.maxChildren} children` : ''})</p>
          {room.cancellationTitle && (
            <p className="text-xs text-green-600 mt-1">{room.cancellationTitle}</p>
          )}
          {room.cancellationPolicy && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{room.cancellationPolicy}</p>
          )}
          {room.customAmenities && room.customAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {room.customAmenities.map((a, i) => (
                <span key={i} className="text-[11px] text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">{a.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* Policies */}
        <div className="flex flex-row md:flex-col flex-wrap gap-2 md:gap-1.5 shrink-0 md:justify-center md:w-1/3">
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
      </div>

      {/* Price & Reserve */}
      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 md:gap-0">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">${room.price}<span className="text-[10px] font-normal text-muted-foreground">/night</span></p>
        </div>
        <button
          onClick={() => onReserve(room.id)}
          disabled={room.availableRooms <= 0}
          className="px-5 py-2.5 bg-brand-accent text-white text-xs font-semibold rounded-lg transition-colors hover:bg-brand-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {room.availableRooms > 0 ? 'Reserve' : 'Sold out'}
        </button>
      </div>
    </div>
  );
}
