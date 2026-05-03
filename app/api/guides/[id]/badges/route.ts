import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"
import { getGuideBadges, getGuideBadgesSummary, getBadgeLeaderboard } from "@/lib/utils/badge-system"

/**
 * GET /api/guides/[id]/badges
 * Get badges for a specific guide
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()

    // Validate guide ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        createErrorResponse("Invalid guide ID", 400),
        { status: 400 }
      )
    }

    // Check if guide exists
    const guide = await db.collection("guides").findOne({
      _id: new ObjectId(id),
    })

    if (!guide) {
      return NextResponse.json(
        createErrorResponse("Guide not found", 404),
        { status: 404 }
      )
    }

    // Get badges
    const badges = await getGuideBadges(db, id)

    // Get summary
    const summary = await getGuideBadgesSummary(db, id)

    return NextResponse.json(
      createSuccessResponse({
        guideName: guide.name,
        badges,
        summary: {
          totalBadges: summary.totalBadges,
          totalPoints: summary.totalPoints,
          badgesByCategory: summary.badgesByCategory,
        },
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching guide badges:", error)
    return NextResponse.json(
      createErrorResponse("Internal server error", 500),
      { status: 500 }
    )
  }
}
