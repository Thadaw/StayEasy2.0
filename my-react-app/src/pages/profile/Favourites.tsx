import { useNavigate } from 'react-router-dom'
import { useFavorites } from '../../context/FavoritesContext'
import { hotels } from '../../data/hotels'
import { Heart } from 'lucide-react'
import { HotelCard } from '../../components/HotelCard'

export default function Favourites() {
  const { favorites, toggleFavorite } = useFavorites()
  const navigate = useNavigate()

  const favoriteHotels = hotels.filter(h => favorites.has(h.id))

  if (favoriteHotels.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-brand-card-border p-12 text-center">
          <Heart size={48} className="text-brand-placeholder mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-heading mb-2">No favourites yet</h2>
          <p className="text-sm text-brand-text-secondary mb-6">Start exploring and save properties you love.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 text-sm font-semibold rounded-lg border-none text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors cursor-pointer"
          >
            Browse stays
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-xl border border-brand-card-border overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-card-border">
          <h2 className="text-base font-semibold text-brand-heading">
            Favourite Properties
            <span className="text-sm font-normal text-brand-text-secondary ml-2">({favoriteHotels.length})</span>
          </h2>
        </div>
        <div className="p-6">
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {favoriteHotels.map(hotel => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                href={`/hotel/${hotel.id}`}
                showFavourite
                isFavourite
                onToggleFavourite={() => toggleFavorite(hotel.id)}
                className="!rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
