import { Minus, Plus } from "lucide-react";
import { Hotel } from "../../data/hotels";
import { calcPrice } from "../../utils/pricing";

interface RoomSelectionPanelProps {
  hotel: Hotel;
  checkIn: string;
  checkOut: string;
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
  roomQuantities: Record<string, number>;
  roomGuestCounts: Record<string, number>;
  selectedRoomId: string | null;
  nights: number;
  onQtyChange: (roomId: string, delta: number) => void;
  onOpenDetail: (roomId: string) => void;
  onReserve: () => void;
}

export function RoomSelectionPanel({
  hotel,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  roomQuantities,
  roomGuestCounts,
  selectedRoomId,
  nights,
  onQtyChange,
  onOpenDetail,
  onReserve,
}: RoomSelectionPanelProps) {
  const hasSelection = Object.values(roomQuantities).some(q => q > 0);

  return (
    <div id="room-selection" className="border border-border rounded-2xl shadow-xl p-6 bg-white mb-10">
      <h2 className="font-semibold text-foreground mb-6" style={{ fontSize: "1.125rem" }}>Choose your room</h2>

      <div className="md:flex md:gap-8">
        <div className="md:w-2/3">
          <div className="flex flex-wrap items-end gap-4 mb-8 pb-6 border-b border-border">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1">Check-in</label>
              <input type="date" value={checkIn} onChange={(e) => onCheckInChange(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-foreground" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1">Check-out</label>
              <input type="date" value={checkOut} onChange={(e) => onCheckOutChange(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            {hotel.roomTypes.map((rt) => {
              const qty = roomQuantities[rt.id] || 0;
              const gc = roomGuestCounts[rt.id] || 1;
              const effectivePrice = calcPrice(rt.price, rt.maxGuests, gc);
              const lineTotal = qty * effectivePrice * nights;
              return (
                <div key={rt.id} id={`room-${rt.id}`} className={`flex items-stretch gap-4 p-4 rounded-xl border transition-all scroll-mt-32 ${selectedRoomId === rt.id ? 'border-primary bg-brand-primary-extra-light ring-2 ring-brand-primary-extra-light' : 'border-border hover:border-muted-foreground/30'}`}>
                  <div className="flex gap-3 flex-1 min-w-0">
                    <img src={rt.image} alt={rt.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rt.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rt.bedType} · {rt.areaSqFt} sq ft</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rt.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5">Up to {rt.maxGuests} guests</span>
                        {rt.availableRooms > 0 ? (
                          <span className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">{rt.availableRooms} available</span>
                        ) : (
                          <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Sold out</span>
                        )}
                      </div>
                      <button
                        onClick={() => onOpenDetail(rt.id)}
                        className="mt-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        View detail
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-6">
                    <div className="flex items-center justify-end gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${effectivePrice}</p>
                        <p className="text-xs text-muted-foreground">/ night</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-bold text-foreground">${lineTotal.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5">
                          <button
                            onClick={() => onQtyChange(rt.id, -1)}
                            disabled={qty <= 0}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold tabular-nums text-foreground">{qty}</span>
                          <button
                            onClick={() => onQtyChange(rt.id, 1)}
                            disabled={qty >= rt.availableRooms}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground">rooms</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="md:w-1/3 self-start md:sticky md:top-32 md:mt-30">
          <div className="md:pt-0">
            <div className="mb-4 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Check-in</span>
                <span className="text-foreground">{checkIn ? new Date(checkIn).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out</span>
                <span className="text-foreground">{checkOut ? new Date(checkOut).toLocaleDateString() : '—'}</span>
              </div>
            </div>
            {hasSelection ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Your selection</h3>
                <div className="space-y-2">
                  {Object.entries(roomQuantities).map(([roomId, qty]) => {
                    if (qty <= 0) return null;
                    const room = hotel.roomTypes.find(r => r.id === roomId);
                    if (!room) return null;
                    const gc = roomGuestCounts[roomId] || 1;
                    const ep = calcPrice(room.price, room.maxGuests, gc);
                    const roomTotal = qty * ep * nights;
                    return (
                      <div key={roomId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{room.name} × {qty} ({gc} guest{gc > 1 ? 's' : ''})</span>
                        <span className="text-foreground">${roomTotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground mt-4 pt-4 border-t border-border">
                  <span>Total</span>
                  <span>${Object.entries(roomQuantities)
                    .filter(([, q]) => q > 0)
                    .reduce((sum, [roomId, qty]) => {
                      const room = hotel.roomTypes.find(r => r.id === roomId);
                      if (!room) return sum;
                      const gc = roomGuestCounts[roomId] || 1;
                      const ep = calcPrice(room.price, room.maxGuests, gc);
                      return sum + qty * ep * nights;
                    }, 0).toLocaleString()}</span>
                </div>
                <button
                  onClick={onReserve}
                  disabled={!hasSelection}
                  className="w-full mt-4 py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#1A3C5E" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#163552"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1A3C5E"}
                >
                  Reserve
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select a room to see your booking summary and reserve.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
