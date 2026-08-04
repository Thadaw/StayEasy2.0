interface Room {
  room_name: string
  room_type: string
  bed_type: string
  max_adults: number
  max_children: number
  base_rate: number
  nights: number
  subtotal: number
}

interface RoomDetailsCardProps {
  rooms: Room[]
  currency: string
}

export function RoomDetailsCard({ rooms, currency }: RoomDetailsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-bold text-gray-900 mb-3">Room details</h2>
      <div className="space-y-3">
        {rooms.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-[#f0f6ff] flex items-center justify-center text-[#0071c2] font-bold text-xs shrink-0">
              {i + 1}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">{r.room_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.room_type} · {r.bed_type}</p>
              <p className="text-xs text-gray-500">Max {r.max_adults} adults{r.max_children > 0 ? `, ${r.max_children} children` : ''}</p>
              <p className="text-xs text-gray-500">{currency}{r.base_rate.toFixed(2)}/night × {r.nights} night{r.nights > 1 ? 's' : ''}</p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">{currency}{r.subtotal.toFixed(2)}</p>
              <p className="text-[11px] text-gray-500">{r.nights} night{r.nights > 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
