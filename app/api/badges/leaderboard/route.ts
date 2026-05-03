import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"
import { getBadgeLeaderboard } from "@/lib/utils/badge-system"

/**
 * GET /api/badges/leaderboard
 * Get badge leaderboard - top guides by badges and points
 * Query params:
 * - limit: number (default 10, max 50)
 * - category: badge category filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)
    const category = searchParams.get("category") || undefined

    const db = await getDatabase()

    const leaderboard = await getBadgeLeaderboard(db, limit, category)

    // Format response
    const formattedLeaderboard = leaderboard.map((entry: any) => ({
      rank: leaderboard.indexOf(entry) + 1,
      guideId: entry._id,
      guideName: entry.guideInfo?.[0]?.name || "Unknown",
      guideImage: entry.guideInfo?.[0]?.profileImage,
      totalBadges: entry.totalBadges,
      totalPoints: entry.totalPoints,
      badgesPreview: entry.badges.slice(0, 5),
    }))

    return NextResponse.json(
      createSuccessResponse({
        leaderboard: formattedLeaderboard,
        category: category || "all",
        total: leaderboard.length,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching badge leaderboard:", error)
    return NextResponse.json(
      createErrorResponse("Internal server error", 500),
      { status: 500 }
    )
  }
}
