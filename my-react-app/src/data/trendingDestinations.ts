export interface TrendingDestination {
  id: number
  name: string
  location: string
  rating: number
  reviews: number
  price: number
  image: string
  type: string
}

export const trendingDestinations: TrendingDestination[] = [
  { id: 1, name: "The Annapurna Lodge", location: "Pokhara, Nepal", rating: 4.8, reviews: 2453, price: 180, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format", type: "Mountain Lodge" },
  { id: 2, name: "Heritage Garden Hotel", location: "Kathmandu, Nepal", rating: 4.5, reviews: 1876, price: 95, image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&h=300&fit=crop&auto=format", type: "Heritage Hotel" },
  { id: 3, name: "Himalayan Eco Resort", location: "Chitwan, Nepal", rating: 4.7, reviews: 3102, price: 420, image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format", type: "Eco Resort" },
  { id: 4, name: "Mountain View Chalets", location: "Nagarkot, Nepal", rating: 4.9, reviews: 2891, price: 580, image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop&auto=format", type: "Mountain Chalet" },
  { id: 5, name: "Caldera Sunset Villas", location: "Santorini, Greece", rating: 4.9, reviews: 1245, price: 340, image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop&auto=format", type: "Luxury Villa" },
  { id: 6, name: "Bali Jungle Retreat", location: "Ubud, Bali", rating: 4.6, reviews: 1567, price: 195, image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&h=300&fit=crop&auto=format", type: "Jungle Retreat" },
  { id: 7, name: "Tokyo Sky Tower Hotel", location: "Tokyo, Japan", rating: 4.8, reviews: 987, price: 475, image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&h=300&fit=crop&auto=format", type: "City Hotel" },
  { id: 8, name: "Amalfi Coast Residence", location: "Amalfi, Italy", rating: 4.7, reviews: 1123, price: 290, image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=300&fit=crop&auto=format", type: "Coastal Residence" },
]
