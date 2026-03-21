export interface Destination {
  id: number
  slug: string
  name: string
  location: string
  rating: number
  reviews: number
  price: number
  duration: string
  difficulty: "Easy" | "Moderate" | "Hard" | "Expert"
  category: "Mountains" | "Trekking" | "Lakes" | "Valleys" | "Meadows"
  image: string
  description: string
  featured: boolean
  highlights: string[]
  included: string[]
  itinerary: { day: number; title: string; description: string }[]
  gallery: string[]
}

export const destinations: Destination[] = [
  {
    id: 1,
    slug: "hunza-valley",
    name: "Hunza Valley",
    location: "Gilgit-Baltistan, Pakistan",
    rating: 4.9,
    reviews: 234,
    price: 299,
    duration: "5-7 days",
    difficulty: "Moderate",
    category: "Mountains",
    image: "/hunza-valley-turquoise-lake-mountains-pakistan.jpg",
    description: "Turquoise lakes surrounded by dramatic peaks and ancient culture",
    featured: true,
    highlights: [
      "Visit the ancient Baltit Fort",
      "Explore Attabad Lake by boat",
      "Witness sunrise at Eagle's Nest",
      "Experience local Hunzai hospitality",
      "Trek to Rakaposhi Base Camp",
    ],
    included: [
      "Professional local guide",
      "All transportation",
      "4-star accommodation",
      "Daily breakfast and dinner",
      "Entrance fees to all sites",
      "Emergency support",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Gilgit",
        description: "Fly into Gilgit airport and transfer to Hunza Valley. Evening orientation and welcome dinner.",
      },
      {
        day: 2,
        title: "Karimabad Exploration",
        description: "Visit Baltit Fort, Altit Fort, and explore the local bazaar. Afternoon tea with mountain views.",
      },
      {
        day: 3,
        title: "Attabad Lake Adventure",
        description: "Full day at Attabad Lake with boat rides and visits to the China Border viewpoint.",
      },
      {
        day: 4,
        title: "Eagle's Nest Sunrise",
        description: "Early morning trip to Eagle's Nest for panoramic views. Afternoon visit to local villages.",
      },
      {
        day: 5,
        title: "Passu & Borith Lake",
        description: "Drive to Passu, cross the famous suspension bridge, and explore Borith Lake.",
      },
      {
        day: 6,
        title: "Cultural Immersion",
        description: "Spend the day with a local family, learn traditional crafts, and enjoy authentic cuisine.",
      },
      {
        day: 7,
        title: "Departure",
        description: "Final morning in Hunza before transfer back to Gilgit for departure.",
      },
    ],
    gallery: [
      "/hunza-valley-turquoise-lake-mountains-pakistan.jpg",
      "/attabad-lake-blue-water-boat-mountains.jpg",
      "/karakoram-mountain-range-golden-peaks.jpg",
    ],
  },
  {
    id: 2,
    slug: "skardu",
    name: "Skardu",
    location: "Gilgit-Baltistan, Pakistan",
    rating: 4.8,
    reviews: 189,
    price: 349,
    duration: "6-8 days",
    difficulty: "Moderate",
    category: "Mountains",
    image: "/skardu-lake-mountains-reflection-pakistan.jpg",
    description: "Serene mountain lakes with stunning reflections and traditional villages",
    featured: true,
    highlights: [
      "Explore Upper and Lower Kachura Lakes",
      "Visit the ancient Skardu Fort",
      "Drive through Deosai National Park",
      "Witness the Shangrila Resort",
      "Experience Sheosar Lake",
    ],
    included: [
      "Expert local guide",
      "4x4 transportation",
      "Premium accommodation",
      "All meals included",
      "Park entrance fees",
      "Photography assistance",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Skardu",
        description: "Scenic flight over the Karakoram. Check into hotel with lake views.",
      },
      {
        day: 2,
        title: "Skardu Fort & Old Town",
        description: "Explore the historic fort and wander through the ancient bazaars.",
      },
      {
        day: 3,
        title: "Shangrila & Lower Kachura",
        description: "Visit the famous Shangrila Resort and its heart-shaped lake.",
      },
      {
        day: 4,
        title: "Upper Kachura Lake",
        description: "Full day at the pristine Upper Kachura Lake with picnic lunch.",
      },
      {
        day: 5,
        title: "Deosai Expedition",
        description: "Journey across the Deosai Plains, one of the highest plateaus in the world.",
      },
      { day: 6, title: "Sheosar Lake", description: "Visit the stunning Sheosar Lake and spot Himalayan brown bears." },
      { day: 7, title: "Satpara Lake", description: "Explore Satpara Lake and dam, with afternoon at leisure." },
      { day: 8, title: "Departure", description: "Morning flight back or continue to next destination." },
    ],
    gallery: [
      "/skardu-lake-mountains-reflection-pakistan.jpg",
      "/snow-capped-mountain-peaks-himalaya-pakistan.jpg",
      "/hunza-valley-turquoise-lake-mountains-pakistan.jpg",
    ],
  },
  {
    id: 3,
    slug: "karakoram-range",
    name: "Karakoram Range",
    location: "Northern Pakistan",
    rating: 4.9,
    reviews: 156,
    price: 499,
    duration: "10-14 days",
    difficulty: "Hard",
    category: "Trekking",
    image: "/karakoram-mountain-range-golden-peaks.jpg",
    description: "Golden peaks and ancient valleys with world-class trekking routes",
    featured: true,
    highlights: [
      "Trek through Concordia",
      "View K2, Broad Peak, and Gasherbrum",
      "Cross the mighty Baltoro Glacier",
      "Camp at legendary base camps",
      "Experience high-altitude adventure",
    ],
    included: [
      "IFMGA certified guide",
      "All trekking permits",
      "Camping equipment",
      "Porter support team",
      "All meals on trek",
      "Satellite communication",
    ],
    itinerary: [
      { day: 1, title: "Arrival & Preparation", description: "Arrive in Skardu, equipment check and briefing." },
      {
        day: 2,
        title: "Drive to Askole",
        description: "Jeep journey to Askole, the last village before the wilderness.",
      },
      { day: 3, title: "Trek to Jhola", description: "Begin the trek along the Braldu River to Jhola camp." },
      { day: 4, title: "Paiju Camp", description: "Trek through dramatic gorges to reach Paiju." },
      { day: 5, title: "Rest Day at Paiju", description: "Acclimatization day with short hikes and preparation." },
      { day: 6, title: "Baltoro Glacier", description: "Cross onto the mighty Baltoro Glacier to Urdukas." },
      { day: 7, title: "Goro II", description: "Continue along the glacier with views of Trango Towers." },
      { day: 8, title: "Concordia", description: "Reach the throne room of the mountain gods at Concordia." },
      {
        day: 9,
        title: "K2 Base Camp",
        description: "Trek to K2 Base Camp and witness the world's second highest peak.",
      },
      { day: 10, title: "Exploration Day", description: "Optional trek to Broad Peak Base Camp or rest day." },
      { day: 11, title: "Return Trek Begins", description: "Begin the return journey to Concordia." },
      { day: 12, title: "Trek to Urdukas", description: "Long day back across the Baltoro." },
      { day: 13, title: "Trek to Askole", description: "Final trekking day back to civilization." },
      { day: 14, title: "Return to Skardu", description: "Jeep back to Skardu for celebration dinner." },
    ],
    gallery: [
      "/karakoram-mountain-range-golden-peaks.jpg",
      "/snow-capped-mountain-peaks-himalaya-pakistan.jpg",
      "/skardu-lake-mountains-reflection-pakistan.jpg",
    ],
  },
  {
    id: 4,
    slug: "attabad-lake",
    name: "Attabad Lake",
    location: "Hunza, Pakistan",
    rating: 4.7,
    reviews: 298,
    price: 199,
    duration: "2-3 days",
    difficulty: "Easy",
    category: "Lakes",
    image: "/attabad-lake-blue-water-boat-mountains.jpg",
    description: "Boat adventures through crystal-clear turquoise waters",
    featured: false,
    highlights: [
      "Speedboat rides on turquoise waters",
      "Visit submerged village remnants",
      "Stunning Karakoram views",
      "Lakeside camping experience",
      "Traditional fishing villages",
    ],
    included: ["Local guide", "Boat rides", "Lakeside accommodation", "Meals", "Transportation"],
    itinerary: [
      {
        day: 1,
        title: "Arrival at Attabad",
        description: "Drive along the Karakoram Highway and check into lakeside accommodation.",
      },
      {
        day: 2,
        title: "Lake Exploration",
        description: "Full day of boating, swimming, and exploring the lake's history.",
      },
      { day: 3, title: "Departure", description: "Morning boat ride before departing for next destination." },
    ],
    gallery: [
      "/attabad-lake-blue-water-boat-mountains.jpg",
      "/hunza-valley-turquoise-lake-mountains-pakistan.jpg",
      "/karakoram-mountain-range-golden-peaks.jpg",
    ],
  },
  {
    id: 5,
    slug: "fairy-meadows",
    name: "Fairy Meadows",
    location: "Diamer, Pakistan",
    rating: 4.9,
    reviews: 312,
    price: 279,
    duration: "3-4 days",
    difficulty: "Moderate",
    category: "Meadows",
    image: "/fairy-meadows-green-meadow-with-nanga-parbat-mount.jpg",
    description: "Breathtaking views of Nanga Parbat from lush green meadows",
    featured: true,
    highlights: [
      "Witness the killer mountain Nanga Parbat",
      "Camp in pristine alpine meadows",
      "Trek to Beyal Camp",
      "Stargazing at 3300m altitude",
      "Experience shepherd's hospitality",
    ],
    included: ["Guide and porter", "Jeep to Tatto", "Camping gear", "All meals", "Entrance fees"],
    itinerary: [
      {
        day: 1,
        title: "Journey to Fairy Meadows",
        description: "Thrilling jeep ride to Tatto followed by 3-hour trek to the meadows.",
      },
      { day: 2, title: "Beyal Camp Trek", description: "Trek higher for closer views of Nanga Parbat's massive face." },
      {
        day: 3,
        title: "Meadow Exploration",
        description: "Explore the meadows, visit local shepherds, photography day.",
      },
      { day: 4, title: "Return Journey", description: "Trek back to Tatto and drive out." },
    ],
    gallery: ["/fairy-meadows-camping-nanga-parbat-view.jpg", "/nanga-parbat-killer-mountain-sunrise.jpg", "/alpine-meadows-pakistan-flowers.jpg"],
  },
  {
    id: 6,
    slug: "swat-valley",
    name: "Swat Valley",
    location: "Khyber Pakhtunkhwa, Pakistan",
    rating: 4.6,
    reviews: 245,
    price: 229,
    duration: "4-5 days",
    difficulty: "Easy",
    category: "Valleys",
    image: "/swat-valley-green-mountains-river-pakistan-switzer.jpg",
    description: "The Switzerland of Pakistan with emerald rivers and forests",
    featured: false,
    highlights: [
      "Visit Malam Jabba ski resort",
      "Explore Mingora bazaars",
      "Swim in Swat River",
      "Buddhist archaeological sites",
      "Lush forest hikes",
    ],
    included: ["Expert guide", "Transportation", "Hotel accommodation", "Breakfast daily", "Site entrance fees"],
    itinerary: [
      { day: 1, title: "Arrival in Mingora", description: "Drive through scenic valleys to reach the heart of Swat." },
      { day: 2, title: "Malam Jabba", description: "Visit the ski resort and enjoy mountain activities." },
      { day: 3, title: "Archaeological Tour", description: "Explore ancient Buddhist ruins and the Swat Museum." },
      { day: 4, title: "Kalam & Ushu Forest", description: "Journey to Kalam and the magical Ushu Forest." },
      { day: 5, title: "Departure", description: "Morning at leisure before returning home." },
    ],
    gallery: ["/swat-river-emerald-green-pakistan.jpg", "/malam-jabba-ski-resort-pakistan.jpg", "/kalam-valley-waterfalls-forest.jpg"],
  },
  {
    id: 7,
    slug: "k2-base-camp",
    name: "K2 Base Camp",
    location: "Gilgit-Baltistan, Pakistan",
    rating: 5.0,
    reviews: 89,
    price: 899,
    duration: "14-18 days",
    difficulty: "Expert",
    category: "Trekking",
    image: "/k2-base-camp-trek-glacier-pakistan-karakoram.jpg",
    description: "Ultimate trekking adventure to the world's second highest peak",
    featured: true,
    highlights: [
      "Stand at the foot of K2 (8611m)",
      "Cross the Baltoro Glacier",
      "Camp at Concordia junction",
      "View four 8000m peaks",
      "Experience extreme mountaineering culture",
    ],
    included: [
      "IFMGA certified high-altitude guide",
      "All climbing permits",
      "Full expedition equipment",
      "Porter and cook team",
      "Satellite phone communication",
      "Emergency evacuation insurance",
    ],
    itinerary: [
      { day: 1, title: "Islamabad Arrival", description: "Team meeting, equipment check, and briefing." },
      { day: 2, title: "Fly to Skardu", description: "Scenic flight over the Himalayas to Skardu." },
      { day: 3, title: "Skardu Preparation", description: "Final preparations and permit formalities." },
      { day: 4, title: "Jeep to Askole", description: "Drive to the last village before the wilderness." },
      { day: 5, title: "Trek to Jhola", description: "Begin the epic trek along Braldu River." },
      { day: 6, title: "Jhola to Paiju", description: "Trek through dramatic landscapes to Paiju." },
      { day: 7, title: "Rest at Paiju", description: "Acclimatization with views of Paiju Peak." },
      { day: 8, title: "Onto Baltoro Glacier", description: "Cross onto the glacier to Urdukas." },
      { day: 9, title: "Urdukas to Goro II", description: "Continue along the glacier's moraine." },
      { day: 10, title: "Goro II to Concordia", description: "Reach the legendary Concordia viewpoint." },
      { day: 11, title: "Concordia to K2 BC", description: "Final push to K2 Base Camp." },
      { day: 12, title: "K2 Base Camp", description: "Full day at base camp, explore the area." },
      { day: 13, title: "Begin Return", description: "Start the journey back to Concordia." },
      { day: 14, title: "Concordia to Goro", description: "Continue descent along the glacier." },
      { day: 15, title: "Goro to Paiju", description: "Long day back to Paiju camp." },
      { day: 16, title: "Paiju to Askole", description: "Final trekking day to Askole." },
      { day: 17, title: "Drive to Skardu", description: "Jeep ride back to Skardu for celebration." },
      { day: 18, title: "Fly to Islamabad", description: "Return flight and departure." },
    ],
    gallery: ["/k2-mountain-savage-mountain-pakistan.jpg", "/concordia-k2-broad-peak-view.jpg", "/baltoro-glacier-trekking-expedition.jpg"],
  },
  {
    id: 8,
    slug: "neelum-valley",
    name: "Neelum Valley",
    location: "Azad Kashmir, Pakistan",
    rating: 4.7,
    reviews: 178,
    price: 249,
    duration: "4-6 days",
    difficulty: "Moderate",
    category: "Valleys",
    image: "/neelum-valley-kashmir-green-river-mountains-pine-t.jpg",
    description: "Pristine beauty with roaring rivers and dense forests",
    featured: false,
    highlights: [
      "Drive along the Neelum River",
      "Visit Sharda Buddhist ruins",
      "Explore Ratti Gali Lake",
      "Experience Kashmiri culture",
      "Trek through pine forests",
    ],
    included: [
      "Local Kashmiri guide",
      "4x4 transportation",
      "Guesthouse stays",
      "Traditional meals",
      "Permits for restricted areas",
    ],
    itinerary: [
      { day: 1, title: "Muzaffarabad to Keran", description: "Scenic drive along the Line of Control to Keran." },
      { day: 2, title: "Sharda Temple", description: "Visit ancient Sharda University ruins and temple." },
      { day: 3, title: "Kel Valley", description: "Journey to the beautiful Kel valley and surroundings." },
      { day: 4, title: "Ratti Gali Trek", description: "Trek to the stunning Ratti Gali Lake at 12,130 ft." },
      { day: 5, title: "Arang Kel", description: "Visit the isolated village of Arang Kel by chairlift." },
      { day: 6, title: "Return", description: "Drive back through the valley to departure point." },
    ],
    gallery: ["/ratti-gali-lake-kashmir-blue-alpine.jpg", "/neelum-river-rushing-water-forest.jpg", "/placeholder.svg?height=800&width=1200"],
  },
]

// Helper functions for data access
export function getAllDestinations(): Destination[] {
  return destinations
}

export function getDestinationBySlug(slug: string): Destination | undefined {
  return destinations.find((d) => d.slug === slug)
}

export function getDestinationById(id: number): Destination | undefined {
  return destinations.find((d) => d.id === id)
}

export function getFeaturedDestinations(): Destination[] {
  return destinations.filter((d) => d.featured)
}

export function getDestinationsByCategory(category: string): Destination[] {
  if (category === "All") return destinations
  return destinations.filter((d) => d.category === category)
}

export function searchDestinations(query: string): Destination[] {
  const lowerQuery = query.toLowerCase()
  return destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(lowerQuery) ||
      d.location.toLowerCase().includes(lowerQuery) ||
      d.description.toLowerCase().includes(lowerQuery) ||
      d.category.toLowerCase().includes(lowerQuery),
  )
}

export const categories = ["All", "Mountains", "Trekking", "Lakes", "Valleys", "Meadows"] as const
export const difficulties = ["All", "Easy", "Moderate", "Hard", "Expert"] as const
export const sortOptions = ["Popular", "Price: Low to High", "Price: High to Low", "Rating", "Duration"] as const
