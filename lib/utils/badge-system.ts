import type { Db } from "mongodb"
import { ObjectId } from "mongodb"
import { BADGE_DEFINITIONS } from "@/lib/db/models/badge"
import type { GuideBadge, BadgeAchievementLog } from "@/lib/db/models/badge"

/**
 * Badge System - Handles awarding and tracking guide badges
 */

/**
 * Get guide statistics for badge eligibility
 */
export async function getGuideStats(db: Db, guideId: string) {
  const guideObjId = new ObjectId(guideId)

  // Get total trips (completed bookings for this guide)
  const tripsCompleted = await db
    .collection("bookings")
    .countDocuments({
      guideId: guideObjId,
      status: "completed",
    })

  // Get guide profile for ratings and reviews
  const guide = await db.collection("guides").findOne({ _id: guideObjId })

  // Get reviews count and average rating
  const reviews = await db
    .collection("reviews")
    .find({
      $or: [{ guideId: guideObjId }, { "guide._id": guideObjId }],
    })
    .toArray()

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0

  // Get earnings
  const paidBookings = await db
    .collection("bookings")
    .find({
      guideId: guideObjId,
      status: "completed",
      paymentStatus: "paid",
    })
    .toArray()

  const totalEarnings = paidBookings.reduce((sum, b) => {
    const amount = b.totalAmount || b.price || 0
    return sum + amount
  }, 0)

  // Get specialty trips (trekking, mountaineering, etc.)
  const specialtyTrips: Record<string, number> = {}
  for (const booking of paidBookings) {
    const destination = await db.collection("destinations").findOne({
      _id: booking.destinationId,
    })

    if (destination?.activities) {
      for (const activity of destination.activities) {
        specialtyTrips[activity] = (specialtyTrips[activity] || 0) + 1
      }
    }
  }

  return {
    tripsCompleted,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewsCount: reviews.length,
    totalEarnings,
    specialtyTrips,
    guide,
  }
}

/**
 * Check if guide meets badge requirements
 */
export function checkBadgeRequirements(
  badgeId: string,
  stats: Awaited<ReturnType<typeof getGuideStats>>,
  existingBadgeIds: string[]
): boolean {
  // Don't award same badge twice
  if (existingBadgeIds.includes(badgeId)) {
    return false
  }

  const badge = BADGE_DEFINITIONS[badgeId]
  if (!badge) return false

  switch (badge.requirement.type) {
    case "trips":
      return stats.tripsCompleted >= badge.requirement.value

    case "rating":
      return stats.averageRating >= badge.requirement.value

    case "reviews":
      return stats.reviewsCount >= badge.requirement.value

    case "response_time":
      // This would require tracking message response times
      // For now, return false - can be enhanced later
      return false

    case "specialty":
      const specialty = badge.requirement.condition?.split(": ")[1]
      if (!specialty) return false
      return (stats.specialtyTrips[specialty] || 0) >= badge.requirement.value

    case "seasonal":
      // Will be checked in separate function
      return false

    case "earnings":
      return stats.totalEarnings >= badge.requirement.value

    default:
      return false
  }
}

/**
 * Determine seasonal badge eligibility
 */
export function checkSeasonalBadges(
  month: number,
  stats: Awaited<ReturnType<typeof getGuideStats>>,
  existingBadgeIds: string[]
): string[] {
  const eligibleBadges: string[] = []

  // Get season-specific trips (this is simplified - would need trip date tracking)
  // For now, return empty array - can be enhanced with date tracking
  return eligibleBadges
}

/**
 * Award badges to a guide when trip completes
 */
export async function awardBadgesToGuide(
  db: Db,
  guideId: string,
  bookingId?: string,
  reason: string = "Trip completed"
): Promise<GuideBadge[]> {
  const guideObjId = new ObjectId(guideId)

  // Get existing badges
  const existingBadges = await db
    .collection<GuideBadge>("guide_badges")
    .find({ guideId: guideObjId })
    .toArray()

  const existingBadgeIds = existingBadges.map(b => b.badgeId)

  // Get guide stats
  const stats = await getGuideStats(db, guideId)

  // Check all badges for eligibility
  const newBadges: GuideBadge[] = []

  for (const [badgeId, badgeDef] of Object.entries(BADGE_DEFINITIONS)) {
    const isBadgeEligible = checkBadgeRequirements(badgeId, stats, existingBadgeIds)

    if (isBadgeEligible) {
      const newBadge: GuideBadge = {
        guideId: guideObjId,
        badgeId,
        badgeName: badgeDef.name,
        badgeDescription: badgeDef.description,
        badgeCategory: badgeDef.category,
        badgeRarity: badgeDef.rarity,
        badgeIcon: badgeDef.icon,
        badgeColor: badgeDef.color,
        earnedAt: new Date(),
        unlockedReason: `${reason} - ${badgeDef.name} unlocked!`,
        bookingId: bookingId ? new ObjectId(bookingId) : undefined,
        points: badgeDef.points,
      }

      // Save badge to database
      await db.collection<GuideBadge>("guide_badges").insertOne(newBadge)
      newBadges.push(newBadge)

      // Log achievement
      const log: BadgeAchievementLog = {
        guideId: guideObjId,
        badgeId,
        badgeName: badgeDef.name,
        achievedAt: new Date(),
        context: {
          tripsCompleted: stats.tripsCompleted,
          averageRating: stats.averageRating,
          totalReviews: stats.reviewsCount,
          lastBookingId: bookingId ? new ObjectId(bookingId) : undefined,
        },
      }

      await db.collection<BadgeAchievementLog>("badge_achievements").insertOne(log)
    }
  }

  // Update guide profile with badge count and points
  const totalBadges = await db
    .collection<GuideBadge>("guide_badges")
    .countDocuments({ guideId: guideObjId })

  const totalPoints = await db
    .collection<GuideBadge>("guide_badges")
    .aggregate([
      { $match: { guideId: guideObjId } },
      { $group: { _id: null, totalPoints: { $sum: "$points" } } },
    ])
    .toArray()

  const points = totalPoints[0]?.totalPoints || 0

  await db.collection("guides").updateOne(
    { _id: guideObjId },
    {
      $set: {
        totalBadges,
        totalBadgePoints: points,
        updatedAt: new Date(),
      },
    }
  )

  return newBadges
}

/**
 * Get all badges for a guide
 */
export async function getGuideBadges(db: Db, guideId: string) {
  const guideObjId = new ObjectId(guideId)

  const badges = await db
    .collection<GuideBadge>("guide_badges")
    .find({ guideId: guideObjId })
    .sort({ earnedAt: -1 })
    .toArray()

  return badges
}

/**
 * Get badge summary for a guide
 */
export async function getGuideBadgesSummary(db: Db, guideId: string) {
  const guideObjId = new ObjectId(guideId)

  const badges = await getGuideBadges(db, guideId)

  const totalPoints = badges.reduce((sum, b) => sum + b.points, 0)

  const byCategory = badges.reduce(
    (acc, badge) => {
      acc[badge.badgeCategory] = (acc[badge.badgeCategory] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    guideId: guideObjId,
    totalBadges: badges.length,
    totalPoints,
    badges,
    badgesByCategory: byCategory,
    latestBadges: badges.slice(0, 5),
  }
}

/**
 * Get badge leaderboard (top guides by badges)
 */
export async function getBadgeLeaderboard(
  db: Db,
  limit: number = 10,
  category?: string
) {
  const matchStage: any = {}
  if (category) {
    matchStage.badgeCategory = category
  }

  const leaderboard = await db
    .collection<GuideBadge>("guide_badges")
    .aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$guideId",
          totalBadges: { $sum: 1 },
          totalPoints: { $sum: "$points" },
          badges: { $push: "$$ROOT" },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "guides",
          localField: "_id",
          foreignField: "_id",
          as: "guideInfo",
        },
      },
    ])
    .toArray()

  return leaderboard
}

/**
 * Check if guide earned new badges on booking completion
 * This is called when a booking status changes to "completed"
 */
export async function checkAndAwardBadgesOnBookingComplete(
  db: Db,
  bookingId: string
): Promise<{
  newBadges: GuideBadge[]
  guideId?: string
  message: string
}> {
  try {
    // Get booking details
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    })

    if (!booking) {
      return {
        newBadges: [],
        message: "Booking not found",
      }
    }

    if (!booking.guideId) {
      return {
        newBadges: [],
        message: "No guide assigned to booking",
      }
    }

    // Award badges
    const newBadges = await awardBadgesToGuide(db, booking.guideId.toString(), bookingId)

    return {
      newBadges,
      guideId: booking.guideId.toString(),
      message:
        newBadges.length > 0
          ? `${newBadges.length} new badge(s) earned!`
          : "No new badges earned this time",
    }
  } catch (error) {
    console.error("Error awarding badges:", error)
    return {
      newBadges: [],
      message: "Error processing badges",
    }
  }
}

/**
 * Get badge definition by ID
 */
export function getBadgeDefinition(badgeId: string) {
  return BADGE_DEFINITIONS[badgeId] || null
}

/**
 * Get all badge definitions
 */
export function getAllBadgeDefinitions() {
  return Object.values(BADGE_DEFINITIONS)
}

/**
 * Format badge for display
 */
export function formatBadge(badge: GuideBadge) {
  return {
    id: badge.badgeId,
    name: badge.badgeName,
    icon: badge.badgeIcon,
    color: badge.badgeColor,
    rarity: badge.badgeRarity,
    description: badge.badgeDescription,
    earnedAt: badge.earnedAt,
    points: badge.points,
  }
}
