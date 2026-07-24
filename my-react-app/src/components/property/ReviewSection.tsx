import { Star } from "lucide-react";
import { Hotel, reviewSamples } from "../../data/hotels";

interface ReviewSectionProps {
  hotel: Hotel;
}

export function ReviewSection({ hotel }: ReviewSectionProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-6">
        <Star size={18} className="fill-foreground stroke-foreground" />
        <span className="font-semibold text-foreground">{hotel.rating} · {hotel.reviews} reviews</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviewSamples.map((r) => (
          <div key={r.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">{r.author}</p>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
              <div className="ml-auto flex">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} className="fill-foreground stroke-foreground" />)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
