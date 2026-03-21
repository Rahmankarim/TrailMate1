export interface Guide {
  id: number
  name: string
  avatar: string
  location: string
  rating: number
  reviews: number
  experience: number
  languages: string[]
  specialties: string[]
  certifications: string[]
  bio: string
  fullBio: string
  hourlyRate: number
  toursCompleted: number
  verified: boolean
  availability: string[]
  responseTime: string
  gallery: string[]
  reviewsList: { name: string; rating: number; comment: string; date: string }[]
}

export const guides: Guide[] = [
  {
    id: 1,
    name: "Ahmed Khan",
    avatar: "/placeholder.svg?height=200&width=200",
    location: "Hunza Valley",
    rating: 4.9,
    reviews: 156,
    experience: 12,
    languages: ["English", "Urdu", "Burushaski"],
    specialties: ["High Altitude Trekking", "Photography Tours", "Cultural Immersion"],
    certifications: ["Certified Mountain Guide", "First Aid", "Wilderness Survival", "Avalanche Safety"],
    bio: "Born and raised in Hunza, I have been guiding adventurers through the Karakoram for over a decade.",
    fullBio:
      "I was born in the beautiful Hunza Valley and grew up surrounded by the majestic Karakoram mountains. From a young age, I was fascinated by the peaks that towered over my village and dreamed of one day helping others experience their magic. After completing my mountaineering certification in 2012, I began my journey as a professional guide. Over the past 12 years, I have led hundreds of expeditions through some of the most challenging and breathtaking terrain on Earth. My passion lies in sharing the rich culture and natural beauty of my homeland with travelers from around the world.",
    hourlyRate: 45,
    toursCompleted: 234,
    verified: true,
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    responseTime: "Within 2 hours",
    gallery: [
      "/hunza-valley-turquoise-lake-mountains-pakistan.jpg",
      "/karakoram-mountain-range-golden-peaks.jpg",
      "/attabad-lake-blue-water-boat-mountains.jpg",
      "/snow-capped-mountain-peaks-himalaya-pakistan.jpg",
    ],
    reviewsList: [
      {
        name: "Sarah Johnson",
        rating: 5,
        comment:
          "Ahmed is an incredible guide! His knowledge of the region is unmatched and he made our trek to Eagle's Nest unforgettable.",
        date: "March 2024",
      },
      {
        name: "Michael Chen",
        rating: 5,
        comment: "Professional, knowledgeable, and genuinely passionate about sharing his culture. Highly recommend!",
        date: "February 2024",
      },
      {
        name: "Emma Wilson",
        rating: 4,
        comment:
          "Great experience overall. Ahmed ensured our safety while showing us the most beautiful spots in Hunza.",
        date: "January 2024",
      },
    ],
  },
  {
    id: 2,
    name: "Ali Hassan",
    avatar: "/placeholder.svg?height=200&width=200",
    location: "Skardu",
    rating: 4.8,
    reviews: 128,
    experience: 8,
    languages: ["English", "Urdu", "Balti"],
    specialties: ["K2 Base Camp", "Rock Climbing", "Lake Expeditions"],
    certifications: ["Alpine Guide", "Rescue Certified", "CPR Trained", "Rock Climbing Instructor"],
    bio: "Passionate about introducing travelers to the hidden gems of Baltistan and its warm hospitality.",
    fullBio:
      "Growing up in Skardu, I developed an early love for the mountains and lakes that surround this magical region. I specialize in high-altitude expeditions and have led numerous successful treks to K2 base camp. My goal is to share the incredible beauty of Baltistan while ensuring the safety and comfort of every traveler. I believe in sustainable tourism that benefits local communities and preserves our natural heritage for future generations.",
    hourlyRate: 40,
    toursCompleted: 189,
    verified: true,
    availability: ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
    responseTime: "Within 4 hours",
    gallery: [
      "/skardu-lake-mountains-reflection-pakistan.jpg",
      "/snow-capped-mountain-peaks-himalaya-pakistan.jpg",
      "/karakoram-mountain-range-golden-peaks.jpg",
      "/placeholder.svg?height=400&width=600",
    ],
    reviewsList: [
      {
        name: "James Miller",
        rating: 5,
        comment:
          "Ali made our K2 base camp trek absolutely memorable. His expertise and calm demeanor were invaluable.",
        date: "April 2024",
      },
      {
        name: "Lisa Wang",
        rating: 5,
        comment: "Fantastic guide with deep knowledge of the region. The lake expeditions were breathtaking!",
        date: "March 2024",
      },
    ],
  },
  {
    id: 3,
    name: "Fatima Bibi",
    avatar: "/placeholder.svg?height=200&width=200",
    location: "Swat Valley",
    rating: 5.0,
    reviews: 89,
    experience: 6,
    languages: ["English", "Urdu", "Pashto"],
    specialties: ["Eco Tourism", "Women's Groups", "Botanical Tours"],
    certifications: ["Eco Guide", "Sustainable Tourism", "Herbalist", "First Aid"],
    bio: "Breaking barriers as a female guide, I specialize in eco-friendly adventures and women-only tours.",
    fullBio:
      "As one of the few female guides in Pakistan, I am passionate about empowering women through travel and breaking stereotypes. My knowledge of local flora and traditional medicine adds a unique dimension to every journey. I specialize in eco-friendly adventures and women-only tours, creating safe spaces for female travelers to explore the beauty of Swat Valley. My tours focus on sustainable practices and supporting local women artisans.",
    hourlyRate: 35,
    toursCompleted: 112,
    verified: true,
    availability: ["Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"],
    responseTime: "Within 3 hours",
    gallery: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    reviewsList: [
      {
        name: "Anna Schmidt",
        rating: 5,
        comment:
          "Fatima is amazing! As a solo female traveler, I felt completely safe and had the most enriching experience.",
        date: "May 2024",
      },
      {
        name: "Priya Sharma",
        rating: 5,
        comment:
          "The botanical tour was incredible. Fatima's knowledge of local plants and their uses was fascinating.",
        date: "April 2024",
      },
    ],
  },
  {
    id: 4,
    name: "Karim Shah",
    avatar: "/placeholder.svg?height=200&width=200",
    location: "Fairy Meadows",
    rating: 4.9,
    reviews: 203,
    experience: 20,
    languages: ["English", "Urdu", "German"],
    specialties: ["Nanga Parbat Expeditions", "Winter Treks", "Mountaineering"],
    certifications: ["IFMGA Certified", "High Altitude Medicine", "Avalanche Safety", "Rescue Operations"],
    bio: "Two decades of experience leading expeditions to Nanga Parbat and the surrounding peaks.",
    fullBio:
      "With 20 years of mountaineering experience, I have summited multiple 8000m peaks and trained with international mountaineering teams. My expertise lies in Nanga Parbat expeditions and winter treks, where conditions demand the highest level of skill and preparation. I speak German fluently, having trained in the Alps, and have built strong relationships with mountaineering communities worldwide. Safety is my top priority, and I take pride in my perfect safety record over hundreds of expeditions.",
    hourlyRate: 60,
    toursCompleted: 456,
    verified: true,
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    responseTime: "Within 1 hour",
    gallery: [
      "/fairy-meadows-green-meadow-with-nanga-parbat-mount.jpg",
      "/nanga-parbat-killer-mountain-sunrise.jpg",
      "/alpine-meadows-pakistan-flowers.jpg",
      "/placeholder.svg?height=400&width=600",
    ],
    reviewsList: [
      {
        name: "Hans Mueller",
        rating: 5,
        comment:
          "Karim is a legend! His experience and professionalism made our Nanga Parbat expedition unforgettable.",
        date: "June 2024",
      },
      {
        name: "Sophie Laurent",
        rating: 5,
        comment: "The best guide I've ever had. Karim's safety protocols and mountain knowledge are world-class.",
        date: "May 2024",
      },
      {
        name: "David Brown",
        rating: 5,
        comment: "20 years of experience shows. Every detail was perfectly planned and executed.",
        date: "April 2024",
      },
    ],
  },
  {
    id: 5,
    name: "Rashid Akhtar",
    avatar: "/placeholder.svg?height=200&width=200",
    location: "Neelum Valley",
    rating: 4.7,
    reviews: 76,
    experience: 5,
    languages: ["English", "Urdu", "Kashmiri"],
    specialties: ["River Rafting", "Camping", "Wildlife Tours"],
    certifications: ["River Guide", "Wildlife Expert", "Camping Instructor", "Swift Water Rescue"],
    bio: "Young and energetic guide with a deep love for the rivers and forests of Kashmir.",
    fullBio:
      "I bring infectious enthusiasm and modern safety practices to every adventure. Growing up along the Neelum River, I developed a deep connection with the waterways and forests of Kashmir. I specialize in river rafting expeditions and wildlife tours, helping travelers discover the diverse ecosystems of the region. My camping trips are designed to minimize environmental impact while maximizing the connection with nature.",
    hourlyRate: 30,
    toursCompleted: 98,
    verified: true,
    availability: ["Friday", "Saturday", "Sunday"],
    responseTime: "Within 6 hours",
    gallery: [
      "/neelum-valley-kashmir-green-river-mountains-pine-t.jpg",
      "/ratti-gali-lake-kashmir-blue-alpine.jpg",
      "/neelum-river-rushing-water-forest.jpg",
      "/placeholder.svg?height=400&width=600",
    ],
    reviewsList: [
      {
        name: "Tom Anderson",
        rating: 5,
        comment: "Rashid's energy is contagious! The river rafting experience was thrilling and safe.",
        date: "July 2024",
      },
      {
        name: "Maria Garcia",
        rating: 4,
        comment: "Great camping trip with excellent wildlife spotting opportunities. Rashid knows the area well.",
        date: "June 2024",
      },
    ],
  },
  {
    id: 6,
    name: "Zainab Malik",
    avatar: "/placeholder.svg?height=200&width=200",
    location: "Chitral",
    rating: 4.8,
    reviews: 67,
    experience: 4,
    languages: ["English", "Urdu", "Khowar"],
    specialties: ["Kalash Valley", "Cultural Tours", "Hiking"],
    certifications: ["Cultural Guide", "History Expert", "Safety Certified", "First Aid"],
    bio: "Specialist in Kalash culture and traditions, offering immersive cultural experiences.",
    fullBio:
      "I have deep connections with Kalash communities and can provide authentic insights into this unique culture. My tours focus on respectful cultural exchange, helping travelers understand and appreciate the traditions, festivals, and daily life of the Kalash people. I also offer hiking tours through the stunning valleys of Chitral, combining natural beauty with cultural immersion. My goal is to promote sustainable tourism that benefits local communities.",
    hourlyRate: 35,
    toursCompleted: 84,
    verified: true,
    availability: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
    responseTime: "Within 4 hours",
    gallery: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    reviewsList: [
      {
        name: "Rachel Green",
        rating: 5,
        comment:
          "Zainab's cultural tours are incredible. Her connections with the Kalash community made the experience authentic.",
        date: "August 2024",
      },
      {
        name: "Ahmed Patel",
        rating: 5,
        comment: "Learned so much about Kalash traditions. Zainab is passionate and knowledgeable.",
        date: "July 2024",
      },
    ],
  },
]

// Helper functions for data access
export function getAllGuides(): Guide[] {
  return guides
}

export function getGuideById(id: number): Guide | undefined {
  return guides.find((g) => g.id === id)
}

export function getGuidesByLocation(location: string): Guide[] {
  if (location === "All Locations") return guides
  return guides.filter((g) => g.location === location)
}

export function searchGuides(query: string): Guide[] {
  const lowerQuery = query.toLowerCase()
  return guides.filter(
    (g) =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.bio.toLowerCase().includes(lowerQuery) ||
      g.location.toLowerCase().includes(lowerQuery) ||
      g.specialties.some((s) => s.toLowerCase().includes(lowerQuery)),
  )
}

export function getVerifiedGuides(): Guide[] {
  return guides.filter((g) => g.verified)
}

export const locations = [
  "All Locations",
  "Hunza Valley",
  "Skardu",
  "Swat Valley",
  "Fairy Meadows",
  "Neelum Valley",
  "Chitral",
] as const

export const specialties = [
  "All Specialties",
  "High Altitude Trekking",
  "Photography Tours",
  "Eco Tourism",
  "Mountaineering",
  "Cultural Tours",
] as const

export const sortOptions = [
  "Recommended",
  "Highest Rated",
  "Most Experienced",
  "Price: Low to High",
  "Price: High to Low",
] as const
