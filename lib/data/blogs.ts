export interface BlogPost {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string[]
  image: string
  category: string
  author: {
    name: string
    avatar: string
    bio: string
  }
  date: string
  readTime: string
  tags: string[]
  featured?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "ultimate-guide-trekking-karakoram",
    title: "The Ultimate Guide to Trekking in the Karakoram",
    excerpt:
      "Discover everything you need to know about planning your first trek through one of the world's most spectacular mountain ranges.",
    content: [
      "The Karakoram mountain range is home to some of the highest peaks on Earth, including K2, the world's second-highest mountain. For adventurous trekkers, this region offers unparalleled experiences that combine challenging terrain with breathtaking natural beauty.",
      "Before embarking on a Karakoram trek, proper preparation is essential. The high altitude, extreme weather conditions, and remote locations require careful planning and physical conditioning. Most treks in this region range from 10 to 21 days, covering distances that test even experienced hikers.",
      "The best time to trek in the Karakoram is between June and September, when the weather is most stable and the trails are accessible. During this window, daytime temperatures at base camps hover around 10-20°C, while nights can drop below freezing. Proper layering and quality gear are non-negotiable.",
      "Popular routes include the K2 Base Camp Trek, the Baltoro Glacier Trek, and the Snow Lake Trek. Each offers unique perspectives on the dramatic landscape, from towering granite spires to pristine glacial lakes. The K2 Base Camp Trek, in particular, is considered one of the world's great adventure treks.",
      "When choosing a guide, look for certified professionals with extensive local knowledge. A good guide not only ensures your safety but also enriches your experience with cultural insights and hidden viewpoints that independent trekkers might miss. At TrailMate, all our Karakoram guides are vetted and certified.",
      "Acclimatization is crucial for high-altitude trekking. Plan for gradual ascent days and rest days at strategic points along your route. Symptoms of altitude sickness can appear above 2,500 meters, so knowing the warning signs and having a contingency plan is essential.",
    ],
    image: "/karakoram-mountain-trekking-expedition.jpg",
    category: "Trekking",
    author: {
      name: "Ahmed Khan",
      avatar: "/pakistani-mountain-guide-professional-portrait.jpg",
      bio: "Professional mountain guide with 12 years of experience in the Karakoram range.",
    },
    date: "January 10, 2024",
    readTime: "12 min read",
    tags: ["Trekking", "Karakoram", "K2", "Adventure", "Guide"],
    featured: true,
  },
  {
    id: 2,
    slug: "hidden-gems-hunza-valley",
    title: "10 Hidden Gems in Hunza Valley You Must Visit",
    excerpt: "Beyond the famous spots, discover secret locations that only locals know about in Hunza Valley.",
    content: [
      "Hunza Valley is renowned for its stunning landscapes and welcoming culture, but beyond the popular tourist spots lie hidden treasures waiting to be discovered. These secret locations offer authentic experiences away from the crowds.",
      "The ancient village of Ganish is often overlooked by tourists rushing to Karimabad. This UNESCO-nominated heritage site features 700-year-old watchtowers, intricate wood carvings, and sacred rocks inscribed with ancient messages. Walking through its narrow alleys feels like stepping back in time.",
      "Borith Lake, located near Passu, is a serene alternative to the more crowded Attabad Lake. Surrounded by towering peaks and glaciers, this hidden lake offers peaceful boat rides and incredible reflections of the mountains during early morning hours.",
      "The Hopper Glacier trek is a lesser-known alternative to the famous Rakaposhi Base Camp. This full-day hike takes you through traditional villages, across suspension bridges, and up to a stunning glacier viewpoint with panoramic mountain views.",
      "Altit Fort, while gaining popularity, still sees fewer visitors than Eagle's Nest or Baltit Fort. The 900-year-old structure offers equally impressive views and a more intimate exploration experience. Don't miss the ancient sacred garden below the fort.",
      "For the adventurous, the trek to Ultar Sar Base Camp reveals some of the most dramatic scenery in Hunza. The challenging trail passes through alpine meadows and offers close-up views of the 7,388-meter peak.",
      "The village of Duikar deserves more than just a sunrise visit. Staying overnight in this hilltop settlement allows you to experience local hospitality, explore surrounding trails, and witness both sunrise and sunset over the Hunza Valley.",
      "Hussaini Suspension Bridge, while famous, leads to the relatively unexplored Zarabad village. Cross the thrilling bridge and continue on foot to discover traditional Wakhi culture and stunning views of Passu Cones.",
    ],
    image: "/hunza-valley-turquoise-lake-mountains-pakistan.jpg",
    category: "Destinations",
    author: {
      name: "Fatima Bibi",
      avatar: "/pakistani-female-guide-portrait-traditional.jpg",
      bio: "Local Hunza guide and cultural heritage expert with deep roots in the valley.",
    },
    date: "January 8, 2024",
    readTime: "8 min read",
    tags: ["Hunza", "Hidden Gems", "Culture", "Travel Tips", "Local Guide"],
  },
  {
    id: 3,
    slug: "essential-gear-high-altitude-trekking",
    title: "Essential Gear for High Altitude Trekking",
    excerpt: "A comprehensive checklist of equipment you need for safe and comfortable high altitude adventures.",
    content: [
      "Proper gear can make the difference between an incredible adventure and a dangerous situation when trekking at high altitudes. This comprehensive guide covers everything you need for treks above 4,000 meters.",
      "Footwear is your most critical investment. For high altitude treks, you need sturdy, waterproof boots with ankle support and a stiff sole for crossing rocky terrain. Break them in thoroughly before your trek—new boots and high altitude are a painful combination.",
      "Layering is the key to temperature regulation at high altitude. Start with moisture-wicking base layers, add insulating mid-layers like fleece or down, and top with a waterproof, breathable outer shell. Conditions can change rapidly, so easy layering adjustment is essential.",
      "Your sleeping system should include a four-season sleeping bag rated for at least -20°C and a quality sleeping pad with high R-value for insulation from the cold ground. Many trekkers underestimate heat loss through the ground at high camps.",
      "Navigation and safety gear includes a reliable GPS device, topographic maps, compass, headlamp with extra batteries, first aid kit, and emergency shelter. At high altitude, weather can change quickly and evacuation options are limited.",
      "Sun protection is crucial at altitude where UV exposure is significantly higher. Bring glacier glasses with side shields, high SPF sunscreen, and a sun hat. Snow blindness and severe sunburn are real risks above 4,000 meters.",
      "Hydration gear should include at least two water bottles or a hydration bladder, plus water purification tablets or a filter. Staying hydrated is essential for acclimatization, and you'll need 3-4 liters per day at high altitude.",
      "Don't forget altitude-specific items: trekking poles reduce knee strain on descents, gaiters keep snow and debris out of boots, and hand/toe warmers provide emergency warmth when temperatures plummet.",
    ],
    image: "/trekking-gear-equipment-backpack-boots-mountain.jpg",
    category: "Guides",
    author: {
      name: "Karim Shah",
      avatar: "/pakistani-man-outdoor-guide-portrait.jpg",
      bio: "Mountaineer and gear specialist who has summited multiple 7,000m+ peaks.",
    },
    date: "January 5, 2024",
    readTime: "10 min read",
    tags: ["Gear", "Equipment", "High Altitude", "Preparation", "Safety"],
  },
  {
    id: 4,
    slug: "sustainable-tourism-travel-responsibly",
    title: "Sustainable Tourism: How to Travel Responsibly",
    excerpt: "Learn how your travel choices can positively impact local communities and preserve natural beauty.",
    content: [
      "As adventure tourism grows in Pakistan's northern areas, so does our responsibility to protect these fragile ecosystems and support local communities. Sustainable tourism isn't about sacrificing experience—it's about enhancing it while preserving it for future generations.",
      "Choose locally-owned accommodations and services whenever possible. Family-run guesthouses and local guide services keep tourism revenue within the community, supporting schools, healthcare, and infrastructure development in remote areas.",
      "Pack out everything you pack in, and consider picking up trash left by others. In pristine mountain environments, even small amounts of litter can persist for years. Carry a dedicated bag for collecting waste during your trek.",
      "Respect wildlife by observing from a distance and never feeding wild animals. The ibex, snow leopards, and golden eagles of Pakistan's mountains are precious and vulnerable. Your photographs should never come at the cost of animal stress or behavior changes.",
      "Water sources are sacred in mountain communities. Never wash clothes, dishes, or yourself directly in streams or lakes. Use biodegradable soap at least 50 meters from water sources, and dispose of human waste properly following Leave No Trace principles.",
      "Support cultural preservation by learning about and respecting local customs. Ask permission before photographing people, dress modestly in villages, and participate in cultural exchanges with genuine interest rather than treating local traditions as tourist attractions.",
      "Consider carbon offsetting for your travel, especially long flights. Better yet, extend your trip duration to reduce the per-day carbon footprint and spend more time truly experiencing each destination rather than rushing through.",
      "Share your sustainable travel experiences with others. Your social media posts and travel reviews can encourage responsible tourism practices and highlight businesses that prioritize sustainability.",
    ],
    image: "/sustainable-trekking-mountain-trail-pakistan.jpg",
    category: "Sustainability",
    author: {
      name: "Sarah Thompson",
      avatar: "/european-woman-hiker-portrait.jpg",
      bio: "Environmental scientist and sustainable travel advocate with a focus on mountain ecosystems.",
    },
    date: "January 3, 2024",
    readTime: "6 min read",
    tags: ["Sustainability", "Eco-Tourism", "Responsible Travel", "Environment", "Community"],
  },
  {
    id: 5,
    slug: "photographers-guide-northern-pakistan",
    title: "A Photographer's Guide to Northern Pakistan",
    excerpt: "Capture stunning shots with these tips from professional adventure photographers.",
    content: [
      "Northern Pakistan offers some of the most dramatic photographic opportunities on Earth. From the towering peaks of the Karakoram to the vibrant culture of mountain villages, every turn reveals a potential masterpiece.",
      "Golden hour in the mountains is extraordinary. Arrive at viewpoints well before sunrise—the alpenglow on peaks like Rakaposhi and Nanga Parbat creates colors that seem almost unreal. Evening light paints the valleys in warm amber tones that no filter can replicate.",
      "Invest in weather-sealed equipment. Mountain weather is unpredictable, and you'll encounter everything from dusty jeep tracks to sudden snow showers. A reliable camera bag with rain cover is essential for protecting your gear.",
      "Wide-angle lenses capture the grandeur of mountain landscapes, but don't neglect telephoto options. A 70-200mm or longer lens is invaluable for compressing distant peaks, isolating details, and wildlife photography opportunities.",
      "Include human elements for scale and story. A tiny figure against a massive glacier tells a more compelling story than the glacier alone. Local people, with permission, add cultural depth and vibrant color to mountain compositions.",
      "Master long exposure techniques for silky waterfalls and smooth lakes. The numerous streams and lakes of Hunza, Skardu, and Swat offer perfect subjects. A sturdy tripod and ND filters are essential tools.",
      "Respect photography ethics, especially when photographing people. Always ask permission, show your subjects the images, and consider sharing prints or digital copies. Building relationships leads to more authentic and powerful portraits.",
      "Plan for altitude's effect on both you and your equipment. Batteries drain faster in cold conditions, and your own energy will be limited. Carry extra batteries in inner pockets to keep them warm, and pace yourself to avoid rushing shots.",
    ],
    image: "/photographer-camera-mountain-landscape-golden-hour.jpg",
    category: "Photography",
    author: {
      name: "Ali Hassan",
      avatar: "/pakistani-photographer-guide-portrait-camera.jpg",
      bio: "Award-winning adventure photographer specializing in mountain and cultural photography.",
    },
    date: "December 28, 2023",
    readTime: "9 min read",
    tags: ["Photography", "Tips", "Landscape", "Adventure", "Equipment"],
  },
  {
    id: 6,
    slug: "best-time-visit-fairy-meadows",
    title: "Best Time to Visit Fairy Meadows",
    excerpt: "Plan your trip perfectly with this seasonal guide to visiting one of Pakistan's most beautiful spots.",
    content: [
      "Fairy Meadows, the stunning alpine meadow at the base of Nanga Parbat, offers different experiences throughout the year. Understanding the seasons helps you plan the perfect visit for your interests and abilities.",
      "Late spring (May-June) brings wildflowers carpeting the meadows in a riot of color. The snow has mostly melted at lower elevations, but Nanga Parbat remains dramatically white. This is ideal for photographers and those who want pleasant hiking temperatures.",
      "Summer (July-August) offers the most stable weather and longest days. The meadows are lush and green, and all trails are accessible. This is peak season, so expect more visitors but also the best conditions for camping and extended exploration.",
      "Early autumn (September-October) is arguably the most magical time. The crowds thin, the light turns golden, and clear skies offer unobstructed views of Nanga Parbat. Night temperatures drop significantly, so come prepared for cold evenings.",
      "The journey to Fairy Meadows is part of the adventure. The white-knuckle jeep ride from Raikot Bridge to Tato village takes 2-3 hours, followed by a 3-4 hour trek or short horseback ride to the meadows. The road is only open from late April to early November.",
      "Accommodation ranges from basic camping to comfortable wooden huts. For the best experience, spend at least two nights—this allows for acclimatization and time to explore surrounding trails, including the trek toward Nanga Parbat Base Camp.",
      "Weather can change rapidly at 3,300 meters elevation. Always bring warm layers, rain gear, and sun protection regardless of season. Check forecasts before your visit, but be prepared for anything the mountains might deliver.",
      "The Beyal Camp trek and the viewpoint toward Nanga Parbat Base Camp are must-do excursions from Fairy Meadows. Both offer increasingly dramatic views of the world's ninth-highest peak and the vast glaciers that flow from its flanks.",
    ],
    image: "/fairy-meadows-green-meadow-with-nanga-parbat-mount.jpg",
    category: "Planning",
    author: {
      name: "Rashid Akhtar",
      avatar: "/pakistani-guide-portrait-friendly-smile.jpg",
      bio: "Nanga Parbat region specialist with 8 years of guiding experience at Fairy Meadows.",
    },
    date: "December 25, 2023",
    readTime: "5 min read",
    tags: ["Fairy Meadows", "Nanga Parbat", "Planning", "Seasons", "Travel Tips"],
  },
]

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((post) => post.featured)
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const currentPost = getBlogBySlug(currentSlug)
  if (!currentPost) return blogPosts.slice(0, limit)

  return blogPosts
    .filter((post) => post.slug !== currentSlug)
    .filter((post) => post.category === currentPost.category || post.tags.some((tag) => currentPost.tags.includes(tag)))
    .slice(0, limit)
}

export function getAllCategories(): string[] {
  const categories = new Set(blogPosts.map((post) => post.category))
  return ["All", ...Array.from(categories)]
}
