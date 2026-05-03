import type { ObjectId } from "mongodb"

/**
 * Badge Categories
 */
export type BadgeCategory =
  | "milestones" // Trip completion milestones
  | "ratings" // Rating achievements
  | "specialization" // Activity specializations
  | "reliability" // Reliability and response time
  | "community" // Community engagement
  | "seasonal" // Seasonal achievements
  | "premium" // Premium guide badges

/**
 * Badge Rarity Levels (affects visual display)
 */
export type BadgeRarity = "common" | "rare" | "epic" | "legendary"

/**
 * Badge Definition (system template)
 */
export interface BadgeDefinition {
  id: string
  name: string
  description: string
  category: BadgeCategory
  rarity: BadgeRarity
  icon: string // URL or emoji
  requirement: {
    type: "trips" | "rating" | "reviews" | "response_time" | "specialty" | "seasonal" | "earnings"
    value: number // e.g., 10 for 10 trips
    condition?: string // e.g., "average_rating >= 4.8"
  }
  points: number // Reward points for guide
  color: string // Hex color for display
  earnedAt?: Date
}

/**
 * User Badge (awarded to a guide)
 */
export interface GuideBadge {
  _id?: ObjectId
  guideId: ObjectId
  badgeId: string // Reference to badge definition
  badgeName: string
  badgeDescription: string
  badgeCategory: BadgeCategory
  badgeRarity: BadgeRarity
  badgeIcon: string
  badgeColor: string
  earnedAt: Date
  unlockedReason: string // Why badge was earned
  bookingId?: ObjectId // Which booking triggered the badge
  points: number
}

/**
 * Guide Badges Summary
 */
export interface GuideBadgesSummary {
  guideId: ObjectId
  totalBadges: number
  totalPoints: number
  badges: GuideBadge[]
  badgesByCategory: Record<BadgeCategory, number>
  latestBadges: GuideBadge[]
}

/**
 * Badge Achievement Record
 */
export interface BadgeAchievementLog {
  _id?: ObjectId
  guideId: ObjectId
  badgeId: string
  badgeName: string
  achievedAt: Date
  context: {
    tripsCompleted?: number
    averageRating?: number
    totalReviews?: number
    lastBookingId?: ObjectId
    specialization?: string
    month?: string // For seasonal badges
  }
}

/**
 * Predefined Badge Definitions
 */
export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // Milestones
  first_trip: {
    id: "first_trip",
    name: "First Step",
    description: "Completed your first trip as a guide",
    category: "milestones",
    rarity: "common",
    icon: "🌱",
    requirement: { type: "trips", value: 1 },
    points: 10,
    color: "#3B82F6",
  },
  five_trips: {
    id: "five_trips",
    name: "Rising Guide",
    description: "Completed 5 trips with travelers",
    category: "milestones",
    rarity: "common",
    icon: "📈",
    requirement: { type: "trips", value: 5 },
    points: 25,
    color: "#10B981",
  },
  ten_trips: {
    id: "ten_trips",
    name: "Seasoned Guide",
    description: "Completed 10 trips with travelers",
    category: "milestones",
    rarity: "rare",
    icon: "⭐",
    requirement: { type: "trips", value: 10 },
    points: 50,
    color: "#F59E0B",
  },
  twentyfive_trips: {
    id: "twentyfive_trips",
    name: "Master Guide",
    description: "Completed 25 trips - you're a pro!",
    category: "milestones",
    rarity: "epic",
    icon: "🏆",
    requirement: { type: "trips", value: 25 },
    points: 100,
    color: "#8B5CF6",
  },
  fifty_trips: {
    id: "fifty_trips",
    name: "Legend Guide",
    description: "50 completed trips - legendary status",
    category: "milestones",
    rarity: "legendary",
    icon: "👑",
    requirement: { type: "trips", value: 50 },
    points: 250,
    color: "#EC4899",
  },

  // Ratings
  four_star: {
    id: "four_star",
    name: "Well Liked",
    description: "Achieved 4+ star average rating",
    category: "ratings",
    rarity: "common",
    icon: "🌟",
    requirement: { type: "rating", value: 4.0, condition: "average_rating >= 4.0" },
    points: 30,
    color: "#FBBF24",
  },
  four_five_star: {
    id: "four_five_star",
    name: "Excellent Guide",
    description: "Achieved 4.5+ star average rating",
    category: "ratings",
    rarity: "rare",
    icon: "✨",
    requirement: { type: "rating", value: 4.5, condition: "average_rating >= 4.5" },
    points: 60,
    color: "#06B6D4",
  },
  five_star: {
    id: "five_star",
    name: "Perfect Guide",
    description: "Achieved 5.0 star perfect rating",
    category: "ratings",
    rarity: "epic",
    icon: "💎",
    requirement: { type: "rating", value: 5.0, condition: "average_rating >= 4.9" },
    points: 150,
    color: "#EF4444",
  },

  // Reviews
  ten_reviews: {
    id: "ten_reviews",
    name: "Reviewer Magnet",
    description: "Received 10 positive reviews",
    category: "community",
    rarity: "common",
    icon: "💬",
    requirement: { type: "reviews", value: 10 },
    points: 35,
    color: "#3B82F6",
  },
  twentyfive_reviews: {
    id: "twentyfive_reviews",
    name: "Community Favorite",
    description: "Received 25 positive reviews",
    category: "community",
    rarity: "rare",
    icon: "❤️",
    requirement: { type: "reviews", value: 25 },
    points: 75,
    color: "#EC4899",
  },

  // Reliability
  fast_responder: {
    id: "fast_responder",
    name: "Quick Replier",
    description: "Consistently respond to messages within 1 hour",
    category: "reliability",
    rarity: "common",
    icon: "⚡",
    requirement: { type: "response_time", value: 60 },
    points: 25,
    color: "#F59E0B",
  },
  instant_responder: {
    id: "instant_responder",
    name: "Always Available",
    description: "Respond to all messages within 30 minutes",
    category: "reliability",
    rarity: "rare",
    icon: "🚀",
    requirement: { type: "response_time", value: 30 },
    points: 50,
    color: "#06B6D4",
  },

  // Specializations
  trekking_expert: {
    id: "trekking_expert",
    name: "Trekking Expert",
    description: "Completed 10 trekking trips",
    category: "specialization",
    rarity: "rare",
    icon: "⛰️",
    requirement: { type: "specialty", value: 10, condition: "specialty: trekking" },
    points: 75,
    color: "#10B981",
  },
  mountaineering_master: {
    id: "mountaineering_master",
    name: "Mountain Master",
    description: "Completed 10 mountaineering trips",
    category: "specialization",
    rarity: "epic",
    icon: "🏔️",
    requirement: { type: "specialty", value: 10, condition: "specialty: mountaineering" },
    points: 150,
    color: "#8B5CF6",
  },
  photography_guide: {
    id: "photography_guide",
    name: "Photography Master",
    description: "5+ trips with photography focus",
    category: "specialization",
    rarity: "rare",
    icon: "📸",
    requirement: { type: "specialty", value: 5, condition: "specialty: photography" },
    points: 75,
    color: "#06B6D4",
  },
  culture_enthusiast: {
    id: "culture_enthusiast",
    name: "Culture Guide",
    description: "5+ cultural trips completed",
    category: "specialization",
    rarity: "rare",
    icon: "🎭",
    requirement: { type: "specialty", value: 5, condition: "specialty: culture" },
    points: 60,
    color: "#F59E0B",
  },

  // Seasonal
  spring_guide: {
    id: "spring_guide",
    name: "Spring Guide",
    description: "Completed 3 trips during spring",
    category: "seasonal",
    rarity: "common",
    icon: "🌸",
    requirement: { type: "seasonal", value: 3, condition: "season: spring" },
    points: 30,
    color: "#EC4899",
  },
  summer_warrior: {
    id: "summer_warrior",
    name: "Summer Warrior",
    description: "Completed 5 trips during summer",
    category: "seasonal",
    rarity: "common",
    icon: "☀️",
    requirement: { type: "seasonal", value: 5, condition: "season: summer" },
    points: 40,
    color: "#F59E0B",
  },
  autumn_adventurer: {
    id: "autumn_adventurer",
    name: "Autumn Adventurer",
    description: "Completed 3 trips during autumn",
    category: "seasonal",
    rarity: "common",
    icon: "🍂",
    requirement: { type: "seasonal", value: 3, condition: "season: autumn" },
    points: 35,
    color: "#D97706",
  },
  winter_warrior: {
    id: "winter_warrior",
    name: "Winter Warrior",
    description: "Completed 3 trips during winter",
    category: "seasonal",
    rarity: "epic",
    icon: "❄️",
    requirement: { type: "seasonal", value: 3, condition: "season: winter" },
    points: 80,
    color: "#06B6D4",
  },

  // Earnings
  thousand_earner: {
    id: "thousand_earner",
    name: "Earning Start",
    description: "Earned PKR 50,000+",
    category: "premium",
    rarity: "common",
    icon: "💰",
    requirement: { type: "earnings", value: 50000 },
    points: 50,
    color: "#10B981",
  },
  five_hundred_earner: {
    id: "five_hundred_earner",
    name: "Big Earner",
    description: "Earned PKR 250,000+",
    category: "premium",
    rarity: "rare",
    icon: "💵",
    requirement: { type: "earnings", value: 250000 },
    points: 100,
    color: "#F59E0B",
  },
}
