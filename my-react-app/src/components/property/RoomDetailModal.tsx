import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Hotel, RoomType } from "../../data/hotels";
import { calcPrice } from "../../utils/pricing";

interface RoomDetailModalProps {
  room: RoomType;
  hotel: Hotel;
  roomGuestCounts: Record<string, number>;
  onClose: () => void;
  onReserve: (roomId: string) => void;
}

export function RoomDetailModal({ room, hotel, roomGuestCounts, onClose, onReserve }: RoomDetailModalProps) {
  const [roomImgIndex, setRoomImgIndex] = useState(0);
  const modalGuestCount = roomGuestCounts[room.id] || 1;
  const modalEffectivePrice = calcPrice(room.price, room.maxGuests, modalGuestCount);
  const images = room.gallery ?? hotel.images;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1">
          <div className="relative">
            <div className="relative h-[420px] bg-muted">
              <img
                src={images[roomImgIndex]}
                alt={`${room.name} photo ${roomImgIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setRoomImgIndex(v => v === 0 ? images.length - 1 : v - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setRoomImgIndex(v => v === images.length - 1 ? 0 : v + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setRoomImgIndex(i)}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{ backgroundColor: i === roomImgIndex ? '#fff' : 'rgba(255,255,255,0.5)' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              ✕
            </button>
            {room.breakfastIncluded && (
              <span className="absolute bottom-3 left-3 bg-white/90 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                Breakfast included
              </span>
            )}
          </div>

          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-foreground">{room.name}</h3>
                {room.bedComfortRating && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star size={13} className="fill-foreground stroke-foreground" />
                    <span className="text-sm font-semibold text-foreground">{room.bedComfortRating}</span>
                    <span className="text-xs text-muted-foreground">Bed comfort – Based on {room.bedComfortReviews} reviews</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mt-3">{room.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 mt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Bed type</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.bedType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Room size</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.areaSqFt} sq ft</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Max guests</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.maxGuests}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{room.bedrooms > 1 ? 'Bedrooms' : 'Bedroom'}</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.bedrooms}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Beds</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.beds}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Bathrooms</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.bathrooms}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Available</p>
                <p className="text-sm font-medium text-foreground mt-1">{room.availableRooms} of {room.totalRooms}</p>
              </div>
              {room.roomNumbers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Room numbers</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {room.roomNumbers.map(rn => (
                      <span key={rn} className="px-2 py-0.5 bg-accent rounded text-xs font-medium text-foreground">{rn}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {room.bathroomAmenities && room.bathroomAmenities.length > 0 && (
              <div className="py-5 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">In your private bathroom</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {room.bathroomAmenities.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {room.roomFacilities && room.roomFacilities.length > 0 && (
              <div className="py-5 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Room facilities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {room.roomFacilities.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="py-5 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.smokingPolicy && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">🚭</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Smoking policy</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{room.smokingPolicy}</p>
                    </div>
                  </div>
                )}
                {room.cancellationPolicy && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">❄️</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Cancellation</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{room.cancellationPolicy}</p>
                    </div>
                  </div>
                )}
                {room.breakfastIncluded && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">🍳</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Meals</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">Continental breakfast included</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">💳</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Payment</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">No prepayment needed – pay at the property</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border-t border-border flex items-center justify-between rounded-b-2xl">
          <div>
            <p className="text-2xl font-bold text-foreground">${modalEffectivePrice}</p>
            <p className="text-xs text-muted-foreground">per night</p>
          </div>
          <button
            onClick={() => onReserve(room.id)}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: "#1A3C5E" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#163552"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1A3C5E"}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
