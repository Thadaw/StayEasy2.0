import type { HostBankDetails } from '../types/razorpay'

export interface RoomType {
  id: string;
  name: string;
  price: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  description: string;
  totalRooms: number;
  availableRooms: number;
  roomNumbers: string[];
  bedType: string;
  areaSqFt: number;
  floorNumber?: number;
  maxAdults?: number;
  maxChildren?: number;
  cancellationTitle?: string;
  customAmenities?: { name: string; icon: string | null }[];
  image: string;
  gallery?: string[];
  bathroomAmenities?: string[];
  roomFacilities?: string[];
  smokingPolicy?: string;
  cancellationPolicy?: string;
  breakfastIncluded?: boolean;
  bedComfortRating?: number;
  bedComfortReviews?: number;
  room_type_id?: string;
  bed_type_id?: string;
}

export interface Hotel {
  id: number;
  name: string;
  location: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  price: number;
  imageUrl: string;
  images: string[];
  tag?: string;
  isSuperhost?: boolean;
  category: string;
  description: string;
  amenities: string[];
  hostName: string;
  hostAvatar: string;
  hostJoined: string;
  hostReviews: number;
  hostBankDetails: HostBankDetails;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  roomTypes: RoomType[];
}

export const hotels: Hotel[] = [
  {
    id: 1,
    name: "Himalayan Lakeview Resort",
    location: "Lakeside, Pokhara, Nepal",
    city: "Pokhara",
    country: "Nepal",
    lat: 28.21,
    lng: 83.99,
    rating: 4.94,
    reviews: 267,
    price: 180,
    imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&h=800&fit=crop&auto=format",
    ],
    tag: "Guest favourite",
    isSuperhost: true,
    category: "mountain",
    description: "Set on the tranquil shores of Phewa Lake with uninterrupted views of the Annapurna and Machhapuchhre peaks, this resort blends traditional Newari architecture with contemporary comfort. Wake to birdsong and the sight of paragliders drifting across a mirror-still lake. Enjoy farm-to-table dining on a lantern-lit terrace, or take a complimentary kayak out at dawn — Pokhara's magic is right at your doorstep.",
    amenities: ["Lake view", "Mountain view", "Free WiFi", "Air conditioning", "Restaurant", "Bar", "Kayak rental", "Garden", "Yoga terrace", "Spa treatments", "Trekking desk", "Airport shuttle", "Breakfast included", "Parking"],
    hostName: "Raj Gurung",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
    hostJoined: "March 2019",
    hostReviews: 254,
    hostBankDetails: {
      accountHolderName: "Raj Gurung",
      accountNumber: "1234567890123",
      ifscCode: "NABILNPKA001",
      bankName: "Nabil Bank",
      upiId: "raj@nabil",
    },
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    maxGuests: 6,
    maxAdults: 4,
    maxChildren: 2,
    roomTypes: [
      {
        id: "std", name: "Lakeview Room", price: 180, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        description: "Cosy room overlooking Phewa Lake with private balcony. Watch the sunrise paint the Annapurna range gold from your window.",
        totalRooms: 6, availableRooms: 4, roomNumbers: ["101", "102", "103", "104"], bedType: "Queen", areaSqFt: 320,
        image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Rain shower", "Organic toiletries", "Slippers", "Hairdryer", "Towels", "Toilet paper"],
        roomFacilities: ["Lake view", "Private balcony", "Air conditioning", "Free WiFi", "Flat-screen TV", "Tea/Coffee maker", "Desk", "Safe"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 2:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.1,
        bedComfortReviews: 198
      },
      {
        id: "dlx", name: "Mountain Suite", price: 320, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
        description: "Spacious suite with panoramic mountain and lake views from both bedrooms and a shared terrace.",
        totalRooms: 3, availableRooms: 2, roomNumbers: ["201", "202"], bedType: "King + Single", areaSqFt: 580,
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Rain shower", "Organic toiletries", "Slippers", "Hairdryer", "Towels", "Bathrobe", "Toilet paper"],
        roomFacilities: ["Mountain view", "Lake view", "Private terrace", "Air conditioning", "Free WiFi", "Flat-screen TV", "Mini bar", "Tea/Coffee maker", "Desk", "Sitting area"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 2:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.4,
        bedComfortReviews: 143
      },
      {
        id: "prem", name: "Annapurna Penthouse", price: 520, maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
        description: "Top-floor penthouse with wraparound terrace offering 270° views of the Annapurna range and Phewa Lake.",
        totalRooms: 1, availableRooms: 1, roomNumbers: ["301"], bedType: "King + 2 Single", areaSqFt: 980,
        image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Soaking tub", "Rain shower", "Organic toiletries", "Slippers", "Hairdryer", "Towels", "Bathrobe", "Toilet paper"],
        roomFacilities: ["Panoramic view", "Rooftop terrace", "Air conditioning", "Free WiFi", "Flat-screen TV", "Mini bar", "Tea/Coffee maker", "Living room", "Dining area", "Safe", "Butler service"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 2:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.7,
        bedComfortReviews: 86
      },
    ],
  },
  {
    id: 2,
    name: "Durbar Square Heritage Haveli",
    location: "Thamel, Kathmandu, Nepal",
    city: "Kathmandu",
    country: "Nepal",
    lat: 27.72,
    lng: 85.32,
    rating: 4.87,
    reviews: 334,
    price: 95,
    imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&h=800&fit=crop&auto=format",
    ],
    category: "city",
    description: "Tucked within the lively streets of Thamel, this restored 19th-century Newari merchant's house is a peaceful haven amid Kathmandu's vibrant chaos. Carved wooden windows, a central brick courtyard, and a rooftop terrace overlooking the city's temple spires transport you to another era. Steps away from Kathmandu Durbar Square, boutique shops, and some of the best momo joints in the valley.",
    amenities: ["Heritage architecture", "Courtyard", "Rooftop terrace", "Free WiFi", "Breakfast included", "Air conditioning", "Bicycle rental", "Travel desk", "Laundry service", "Rooftop restaurant", "City view", "Parking"],
    hostName: "Maya Shrestha",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    hostJoined: "January 2020",
    hostReviews: 311,
    hostBankDetails: {
      accountHolderName: "Maya Shrestha",
      accountNumber: "2345678901234",
      ifscCode: "NIBLNPKT001",
      bankName: "Nepal Investment Bank",
      upiId: "maya@nibl",
    },
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    maxGuests: 5,
    maxAdults: 3,
    maxChildren: 2,
    roomTypes: [
      {
        id: "std", name: "Courtyard Room", price: 95, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        description: "Charming room overlooking the central brick courtyard with traditional Newari woodwork and handwoven textiles.",
        totalRooms: 5, availableRooms: 3, roomNumbers: ["C1", "C2", "C3"], bedType: "Queen", areaSqFt: 280,
        image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Rain shower", "Herbal toiletries", "Slippers", "Hairdryer", "Towels", "Toilet paper"],
        roomFacilities: ["Courtyard view", "Air conditioning", "Free WiFi", "Flat-screen TV", "Tea/Coffee maker", "Desk", "Safe"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 12:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 8.9,
        bedComfortReviews: 246
      },
      {
        id: "dlx", name: "Heritage Suite", price: 180, maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
        description: "A larger suite with a separate sitting area, original carved windows, and a private balcony overlooking the neighbourhood temple.",
        totalRooms: 2, availableRooms: 1, roomNumbers: ["H1"], bedType: "King + Single", areaSqFt: 480,
        image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Rain shower", "Herbal toiletries", "Slippers", "Hairdryer", "Towels", "Bathrobe", "Toilet paper"],
        roomFacilities: ["Balcony", "Temple view", "Air conditioning", "Free WiFi", "Flat-screen TV", "Mini bar", "Tea/Coffee maker", "Desk", "Sitting area"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 12:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.0,
        bedComfortReviews: 178
      },
    ],
  },
  {
    id: 3,
    name: "Serenity Beachfront Villa",
    location: "Maldives, South Malé Atoll",
    city: "South Malé Atoll",
    country: "Maldives",
    lat: 3.8,
    lng: 73.5,
    rating: 4.97,
    reviews: 312,
    price: 420,
    imageUrl: "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=1200&h=800&fit=crop&auto=format",
    ],
    tag: "Guest favourite",
    isSuperhost: true,
    category: "beachfront",
    description: "Wake up to the sound of gentle waves in this stunning overwater villa perched above the crystal-clear lagoon. This exclusive retreat blends natural Maldivian craftsmanship with modern luxury — think handwoven rattan ceilings, a private infinity pool, and a direct-access ladder into the Indian Ocean. Ideal for couples seeking seclusion and unforgettable sunsets.",
    amenities: ["Private pool", "Ocean view", "Free WiFi", "Air conditioning", "Kitchen", "Spa bath", "Beach access", "Snorkelling gear", "Kayaks", "Room service", "Parking", "Breakfast included"],
    hostName: "Aisha Rasheed",
    hostAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format",
    hostJoined: "September 2019",
    hostReviews: 289,
    hostBankDetails: {
      accountHolderName: "Aisha Rasheed",
      accountNumber: "3456789012345",
      ifscCode: "BMLDMVMD001",
      bankName: "Bank of Maldives",
      upiId: "aisha@bml",
    },
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    maxGuests: 4,
    maxAdults: 2,
    maxChildren: 2,
    roomTypes: [
      {
        id: "std", name: "Standard Villa", price: 420, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
        description: "Overwater villa with lagoon views. The villa features a private entrance and a private bathroom with a walk-in rain shower and luxury toiletries. Floor-to-ceiling windows open onto a private deck with direct lagoon access.",
        totalRooms: 5, availableRooms: 3, roomNumbers: ["101", "102", "103"], bedType: "King", areaSqFt: 480,
        image: "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Rain shower", "Luxury toiletries", "Slippers", "Hairdryer", "Towels", "Toilet paper"],
        roomFacilities: ["Private entrance", "Air conditioning", "Free WiFi", "Mini bar", "Safe", "Flat-screen TV", "Desk", "Sitting area", "Tea/Coffee maker", "Wake-up service"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 6:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.2,
        bedComfortReviews: 281
      },
      {
        id: "dlx", name: "Deluxe Villa", price: 620, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
        description: "Premium overwater villa with private pool. This spacious two-bedroom villa features a private infinity pool, a lavish living area, and a master bathroom with a soaking tub overlooking the ocean. Floor-to-ceiling glass doors open onto a expansive sun deck.",
        totalRooms: 3, availableRooms: 2, roomNumbers: ["201", "202"], bedType: "King + Twin", areaSqFt: 720,
        image: "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Soaking tub", "Rain shower", "Luxury toiletries", "Slippers", "Hairdryer", "Towels", "Bathrobe", "Toilet paper"],
        roomFacilities: ["Private pool", "Private entrance", "Air conditioning", "Free WiFi", "Mini bar", "Safe", "Flat-screen TV", "Desk", "Living area", "Tea/Coffee maker", "Wake-up service", "Ocean view"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 6:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.5,
        bedComfortReviews: 187
      },
      {
        id: "prem", name: "Premier Suite", price: 890, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
        description: "Top-floor suite with panoramic ocean views. The crown jewel of the resort, this penthouse suite offers 360-degree ocean views from its private rooftop terrace. Features include a grand living room, a dining area, and an opulent marble bathroom with a jacuzzi tub.",
        totalRooms: 2, availableRooms: 0, roomNumbers: [], bedType: "Emperor", areaSqFt: 1100,
        image: "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600&h=450&fit=crop&auto=format",
        gallery: [
          "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=600&h=450&fit=crop&auto=format",
        ],
        bathroomAmenities: ["Jacuzzi tub", "Rain shower", "Luxury toiletries", "Slippers", "Hairdryer", "Towels", "Bathrobe", "Toilet paper", "Vanity mirror"],
        roomFacilities: ["Rooftop terrace", "Private entrance", "Air conditioning", "Free WiFi", "Mini bar", "Safe", "Flat-screen TV", "Desk", "Living room", "Dining area", "Tea/Coffee maker", "Wake-up service", "Panoramic view", "Butler service"],
        smokingPolicy: "No smoking",
        cancellationPolicy: "Free cancellation before 6:00 PM on July 1, 2026",
        breakfastIncluded: true,
        bedComfortRating: 9.8,
        bedComfortReviews: 93
      },
    ],
  },
  {
    id: 4,
    name: "The Grand Alpine Chalet",
    location: "Zermatt, Switzerland",
    city: "Zermatt",
    country: "Switzerland",
    lat: 46.02,
    lng: 7.75,
    rating: 4.89,
    reviews: 204,
    price: 580,
    imageUrl: "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=1200&h=800&fit=crop&auto=format",
    ],
    isSuperhost: true,
    category: "skiing",
    description: "Nestled at the foot of the iconic Matterhorn, this traditional Swiss chalet offers panoramic mountain views, a wood-panelled interior with a roaring fireplace, and direct ski-in/ski-out access. After a day on the slopes, unwind in the outdoor hot tub with the Alps stretching endlessly before you.",
    amenities: ["Ski-in/ski-out", "Hot tub", "Fireplace", "Mountain view", "Free WiFi", "Kitchen", "Heated floors", "Sauna", "Ski storage", "Parking", "Air conditioning", "Pet friendly"],
    hostName: "Hans Müller",
    hostAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
    hostJoined: "June 2018",
    hostReviews: 198,
    hostBankDetails: {
      accountHolderName: "Hans Müller",
      accountNumber: "4567890123456",
      ifscCode: "DEUTDEFF001",
      bankName: "Deutsche Bank",
      upiId: "hans@deutsche",
    },
    bedrooms: 4,
    beds: 6,
    bathrooms: 3,
    maxGuests: 8,
    maxAdults: 6,
    maxChildren: 2,
    roomTypes: [
      { id: "std", name: "Standard Chalet", price: 580, maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 2, description: "Cosy mountain-view room", totalRooms: 8, availableRooms: 5, roomNumbers: ["101", "102", "103", "104", "105"], bedType: "Queen + Single", areaSqFt: 550, image: "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Deluxe Chalet", price: 780, maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2, description: "Spacious suite with hot tub access", totalRooms: 4, availableRooms: 2, roomNumbers: ["201", "202"], bedType: "King + 2 Single", areaSqFt: 850, image: "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format" },
      { id: "prem", name: "Grand Suite", price: 1200, maxGuests: 8, bedrooms: 4, beds: 6, bathrooms: 3, description: "Entire top floor with private sauna", totalRooms: 2, availableRooms: 1, roomNumbers: ["301"], bedType: "Emperor + Queen", areaSqFt: 1500, image: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=600&h=450&fit=crop&auto=format" },
    ],
  },
  {
    id: 5,
    name: "Santorini Cliffside Suite",
    location: "Oia, Santorini, Greece",
    city: "Oia",
    country: "Greece",
    lat: 36.46,
    lng: 25.38,
    rating: 4.95,
    reviews: 178,
    price: 340,
    imageUrl: "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=1200&h=800&fit=crop&auto=format",
    ],
    tag: "Rare find",
    category: "luxury",
    description: "Carved into the volcanic cliffs of Oia, this iconic blue-domed suite delivers Santorini's most celebrated views — the caldera, the Aegean Sea, and sunsets that seem painted by hand. White-washed walls, vaulted ceilings, and hand-picked Cycladic antiques create an intimate, timeless atmosphere. A private terrace with a plunge pool completes the picture.",
    amenities: ["Caldera view", "Plunge pool", "Free WiFi", "Air conditioning", "Terrace", "Espresso machine", "Concierge", "Breakfast included", "Wine cellar", "Daily housekeeping", "Airport transfer", "Turndown service"],
    hostName: "Elena Papadopoulos",
    hostAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format",
    hostJoined: "April 2020",
    hostReviews: 162,
    hostBankDetails: {
      accountHolderName: "Elena Papadopoulos",
      accountNumber: "5678901234567",
      ifscCode: "ETHNGRAA001",
      bankName: "National Bank of Greece",
      upiId: "elena@nbg",
    },
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: 2,
    maxAdults: 2,
    maxChildren: 0,
    roomTypes: [
      { id: "std", name: "Cliffside Room", price: 340, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Cozy room with caldera view", totalRooms: 6, availableRooms: 4, roomNumbers: ["C1", "C2", "C3", "C4"], bedType: "Queen", areaSqFt: 320, image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Suite with Plunge Pool", price: 520, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Spacious suite with private plunge pool", totalRooms: 3, availableRooms: 1, roomNumbers: ["P1"], bedType: "King", areaSqFt: 480, image: "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&h=450&fit=crop&auto=format" },
      { id: "prem", name: "Honeymoon Penthouse", price: 750, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Penthouse with panoramic terrace", totalRooms: 1, availableRooms: 1, roomNumbers: ["H1"], bedType: "Emperor", areaSqFt: 650, image: "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=600&h=450&fit=crop&auto=format" },
    ],
  },
  {
    id: 6,
    name: "Bali Jungle Pool Villa",
    location: "Ubud, Bali, Indonesia",
    city: "Ubud",
    country: "Indonesia",
    lat: -8.52,
    lng: 115.27,
    rating: 4.93,
    reviews: 451,
    price: 195,
    imageUrl: "https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&auto=format",
    ],
    isSuperhost: true,
    category: "villa",
    description: "Hidden within Ubud's lush rice-paddy terraces, this open-air villa channels traditional Balinese architecture — teak pavilions, hand-carved stone altars, and alang-alang thatch roofs. The 12-metre infinity pool seemingly merges with the jungle canopy below. A private chef, resident butler, and daily Balinese offerings make every moment feel ceremonial.",
    amenities: ["Infinity pool", "Jungle view", "Private chef", "Free WiFi", "Air conditioning", "Butler service", "Rice paddy view", "Yoga deck", "Outdoor shower", "Bicycle rental", "Spa treatments", "Airport transfer"],
    hostName: "Wayan Suartha",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format",
    hostJoined: "November 2019",
    hostReviews: 430,
    hostBankDetails: {
      accountHolderName: "Wayan Suartha",
      accountNumber: "6789012345678",
      ifscCode: "BCIAIDJA001",
      bankName: "Bank Central Asia",
      upiId: "wayan@bca",
    },
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    maxGuests: 6,
    maxAdults: 4,
    maxChildren: 2,
    roomTypes: [
      { id: "std", name: "Jungle Room", price: 195, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Garden-view room with outdoor shower", totalRooms: 5, availableRooms: 3, roomNumbers: ["101", "102", "105"], bedType: "Queen", areaSqFt: 380, image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Pool Villa", price: 350, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2, description: "Villa with private infinity pool", totalRooms: 3, availableRooms: 2, roomNumbers: ["201", "203"], bedType: "King + Single", areaSqFt: 680, image: "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=600&h=450&fit=crop&auto=format" },
      { id: "prem", name: "Royal Villa", price: 550, maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 3, description: "Master villa with butler service", totalRooms: 2, availableRooms: 1, roomNumbers: ["301"], bedType: "Emperor + Queen", areaSqFt: 1050, image: "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format" },
    ],
  },
  {
    id: 7,
    name: "Tokyo Tower-View Penthouse",
    location: "Minato, Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    lat: 35.66,
    lng: 139.75,
    rating: 4.88,
    reviews: 267,
    price: 475,
    imageUrl: "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&auto=format",
    ],
    category: "city",
    description: "On the 38th floor of a glass tower in Minato, this minimalist penthouse frames Tokyo Tower in every window. Polished concrete, bespoke Japanese joinery, and a 180° city panorama define this space. Walk to Roppongi's galleries and restaurants, or spend an evening watching the city lights from the wraparound terrace.",
    amenities: ["City view", "Tokyo Tower view", "Free WiFi", "Air conditioning", "Full kitchen", "Rooftop terrace", "Concierge", "Gym access", "Smart home", "Washer/dryer", "Workspace", "EV parking"],
    hostName: "Yuki Tanaka",
    hostAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format",
    hostJoined: "February 2021",
    hostReviews: 241,
    hostBankDetails: {
      accountHolderName: "Yuki Tanaka",
      accountNumber: "7890123456789",
      ifscCode: "BOTKJPJT001",
      bankName: "Mitsubishi UFJ",
      upiId: "yuki@mufg",
    },
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    maxGuests: 4,
    maxAdults: 2,
    maxChildren: 2,
    roomTypes: [
      { id: "std", name: "City Room", price: 475, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Elegant room with Tokyo Tower view", totalRooms: 6, availableRooms: 4, roomNumbers: ["38A", "38B", "38C", "38D"], bedType: "Queen", areaSqFt: 420, image: "https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Penthouse Suite", price: 720, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2, description: "Corner suite with wraparound views", totalRooms: 2, availableRooms: 1, roomNumbers: ["39A"], bedType: "King", areaSqFt: 720, image: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=600&h=450&fit=crop&auto=format" },
    ],
  },
  {
    id: 8,
    name: "Amalfi Coastal Retreat",
    location: "Positano, Italy",
    city: "Positano",
    country: "Italy",
    lat: 40.63,
    lng: 14.49,
    rating: 4.91,
    reviews: 389,
    price: 290,
    imageUrl: "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=1200&h=800&fit=crop&auto=format",
    ],
    tag: "Guest favourite",
    category: "beachfront",
    description: "Terraced into the ochre-and-white cliffs of Positano, this sun-drenched retreat offers an al-fresco dining terrace, a saltwater pool, and direct steps down to a private beach cove. Hand-painted majolica tiles, lemon groves, and the scent of bougainvillea set the unmistakable Amalfi mood.",
    amenities: ["Private beach", "Sea view", "Saltwater pool", "Free WiFi", "Air conditioning", "Lemon grove", "Outdoor dining", "Vespa rental", "Boat tours", "Breakfast included", "Daily cleaning", "Wine cellar"],
    hostName: "Marco Esposito",
    hostAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&auto=format",
    hostJoined: "August 2018",
    hostReviews: 367,
    hostBankDetails: {
      accountHolderName: "Marco Esposito",
      accountNumber: "8901234567890",
      ifscCode: "UNCRITMM001",
      bankName: "UniCredit",
      upiId: "marco@unicredit",
    },
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    maxGuests: 6,
    maxAdults: 4,
    maxChildren: 2,
    roomTypes: [
      { id: "std", name: "Sea-View Room", price: 290, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Bright room with sea views", totalRooms: 5, availableRooms: 3, roomNumbers: ["101", "102", "104"], bedType: "Queen", areaSqFt: 350, image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Terrace Suite", price: 450, maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1, description: "Suite with private al-fresco terrace", totalRooms: 3, availableRooms: 2, roomNumbers: ["201", "202"], bedType: "King", areaSqFt: 520, image: "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=600&h=450&fit=crop&auto=format" },
      { id: "prem", name: "Amalfi Penthouse", price: 680, maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2, description: "Penthouse with panoramic coastline views", totalRooms: 2, availableRooms: 0, roomNumbers: [], bedType: "Emperor", areaSqFt: 900, image: "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=600&h=450&fit=crop&auto=format" },
    ],
  },
  {
    id: 9,
    name: "Tuscany Countryside Estate",
    location: "Siena, Tuscany, Italy",
    city: "Siena",
    country: "Italy",
    lat: 43.32,
    lng: 11.33,
    rating: 4.96,
    reviews: 143,
    price: 350,
    imageUrl: "https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=1200&h=800&fit=crop&auto=format",
    ],
    isSuperhost: true,
    category: "countryside",
    description: "A restored 16th-century farmhouse surrounded by 20 acres of olive groves and vineyards between Siena and San Gimignano. Stone-vaulted ceilings, original terracotta floors, and a frescoed dining hall recall Tuscany's Renaissance grandeur. The heated outdoor pool, truffle-hunting excursions, and private wine cellar ensure a stay beyond the ordinary.",
    amenities: ["Vineyard view", "Heated pool", "Free WiFi", "Air conditioning", "Full kitchen", "Wine cellar", "Truffle hunting", "Olive grove", "BBQ", "Parking", "Fireplace", "Pet friendly"],
    hostName: "Giulia Bianchi",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format",
    hostJoined: "May 2020",
    hostReviews: 139,
    hostBankDetails: {
      accountHolderName: "Giulia Bianchi",
      accountNumber: "9012345678901",
      ifscCode: "BCITITMM001",
      bankName: "Intesa Sanpaolo",
      upiId: "giulia@intesa",
    },
    bedrooms: 5,
    beds: 7,
    bathrooms: 4,
    maxGuests: 10,
    maxAdults: 6,
    maxChildren: 4,
    roomTypes: [
      { id: "std", name: "Countryside Room", price: 350, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Charming room with vineyard views", totalRooms: 4, availableRooms: 3, roomNumbers: ["C1", "C2", "C4"], bedType: "Queen", areaSqFt: 400, image: "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Estate Suite", price: 550, maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2, description: "Suite with olive grove access", totalRooms: 3, availableRooms: 2, roomNumbers: ["E1", "E2"], bedType: "King", areaSqFt: 680, image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=450&fit=crop&auto=format" },
      { id: "prem", name: "Villa Magnifica", price: 900, maxGuests: 10, bedrooms: 5, beds: 7, bathrooms: 4, description: "Entire farmhouse with private pool", totalRooms: 1, availableRooms: 1, roomNumbers: ["V1"], bedType: "Emperor", areaSqFt: 1800, image: "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=600&h=450&fit=crop&auto=format" },
    ],
  },
  {
    id: 10,
    name: "Parisian Haussmann Apartment",
    location: "7th Arrondissement, Paris",
    city: "Paris",
    country: "France",
    lat: 48.86,
    lng: 2.32,
    rating: 4.85,
    reviews: 521,
    price: 220,
    imageUrl: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=600&h=450&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=1200&h=800&fit=crop&auto=format",
    ],
    category: "city",
    description: "On the third floor of a classic Haussmann building in the 7th arrondissement, this elegantly proportioned apartment features parquet herringbone floors, ornate plasterwork cornices, and tall French windows with Juliet balconies overlooking a tree-lined boulevard. The Eiffel Tower is a 12-minute walk; Musée d'Orsay is just around the corner.",
    amenities: ["City view", "Eiffel Tower nearby", "Free WiFi", "Air conditioning", "Full kitchen", "Washer/dryer", "Workspace", "Espresso machine", "Elevator", "Secure entry", "Metro nearby", "Daily baguette delivery"],
    hostName: "Claire Dubois",
    hostAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&auto=format",
    hostJoined: "October 2021",
    hostReviews: 498,
    hostBankDetails: {
      accountHolderName: "Claire Dubois",
      accountNumber: "0123456789012",
      ifscCode: "BNPAFRPP001",
      bankName: "BNP Paribas",
      upiId: "claire@bnp",
    },
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    maxGuests: 4,
    maxAdults: 2,
    maxChildren: 2,
    roomTypes: [
      { id: "std", name: "Classic Room", price: 220, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, description: "Elegant Parisian room with city views", totalRooms: 4, availableRooms: 2, roomNumbers: ["3A", "3B"], bedType: "Queen", areaSqFt: 320, image: "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&h=450&fit=crop&auto=format" },
      { id: "dlx", name: "Family Suite", price: 380, maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1, description: "Spacious suite with separate living area", totalRooms: 2, availableRooms: 1, roomNumbers: ["5A"], bedType: "King", areaSqFt: 580, image: "https://images.unsplash.com/photo-1578898886225-c7c894047899?w=600&h=450&fit=crop&auto=format" },
    ],
  },
];

export const reviewSamples = [
  { id: 1, author: "James R.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format", date: "May 2026", rating: 5, text: "Absolutely incredible stay. The views were even better than the photos. Our host was responsive and welcoming from day one. Would return every year if I could." },
  { id: 2, author: "Priya M.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&auto=format", date: "April 2026", rating: 5, text: "One of the best travel experiences of my life. The property is immaculate, the amenities are top-tier, and the location is unbeatable. Already recommended to all my friends." },
  { id: 3, author: "Thomas H.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&auto=format", date: "March 2026", rating: 4, text: "Beautiful place with great character. Check-in was smooth and the host gave us great local tips. Only minor note: the WiFi dipped occasionally, but everything else was excellent." },
  { id: 4, author: "Yuki S.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop&auto=format", date: "February 2026", rating: 5, text: "Magical. We stayed for our anniversary and every detail was perfect — from the welcome champagne to the sunset views. We didn't want to leave." },
];
