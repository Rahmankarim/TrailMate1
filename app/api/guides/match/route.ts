import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"
import { matchGuidesForTraveler, getTopMatchingGuides } from "@/lib/utils/guide-matching"
import type { GuideMatchingPreferences } from "@/lib/db/models/guide-matching"

/**
 * GET /api/guides/match
 * Find matching guides based on traveler preferences
 * Query params can include: interests, languages, skillLevel, location, maxPrice, minPrice, limit
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json(
        createErrorResponse("Unauthorized - sign in to access guide matching", 401),
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        createErrorResponse("Invalid token", 401),
        { status: 401 }
      )
    }

    // Only travelers can use guide matching
    if (payload.role !== "traveler") {
      return NextResponse.json(
        createErrorResponse("Only travelers can access guide matching", 403),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const db = await getDatabase()

    // Get or create user preferences
    let preferences = await db.collection("guide_matching_preferences").findOne({
      userId: new ObjectId(payload.userId),
    })

    // If no saved preferences, try to build from query params
    if (!preferences) {
      const interests = searchParams.get("interests")?.split(",").map(s => s.trim()) || []
      const languages = searchParams.get("languages")?.split(",").map(s => s.trim()) || ["English", "Urdu"]
      const skillLevel = (searchParams.get("skillLevel") as any) || "intermediate"
      const location = searchParams.get("location")?.split(",").map(s => s.trim())
      const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined
      const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined
      const experience = (searchParams.get("experience") as any) || "all"
      const certifications = searchParams.get("certifications")?.split(",").map(s => s.trim())

      preferences = {
        userId: new ObjectId(payload.userId),
        interests: interests.length > 0 ? interests : ["Trekking", "Sightseeing", "Culture"],
        languages,
        skillLevel,
        location,
        maxPricePerDay: maxPrice,
        minPricePerDay: minPrice,
        experience,
        certifications,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Fetch all published guides
    const guides = await db
      .collection("guides")
      .find({ isPublished: true })
      .toArray()

    if (guides.length === 0) {
      return NextResponse.json(
        createSuccessResponse({
          matches: [],
          preferences,
          message: "No guides available",
        }),
        { status: 200 }
      )
    }

    // Run matching algorithm
    const matchResults = matchGuidesForTraveler({
      preferences,
      guides,
    })

    // Get limit from query params (default 10)
    const limit = parseInt(searchParams.get("limit") || "10")
    const topMatches = getTopMatchingGuides(matchResults, limit)

    // Save preferences for future use
    await db.collection("guide_matching_preferences").updateOne(
      { userId: new ObjectId(payload.userId) },
      {
        $set: {
          ...preferences,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json(
      createSuccessResponse({
        matches: topMatches,
        totalMatches: matchResults.length,
        preferences,
        message: `Found ${topMatches.length} matching guides`,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in guide matching:", error)
    return NextResponse.json(
      createErrorResponse("Internal server error in guide matching", 500),
      { status: 500 }
    )
  }
}

/**
 * POST /api/guides/match
 * Save traveler's matching preferences for future use
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json(
        createErrorResponse("Unauthorized", 401),
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        createErrorResponse("Invalid token", 401),
        { status: 401 }
      )
    }

    if (payload.role !== "traveler") {
      return NextResponse.json(
        createErrorResponse("Only travelers can save matching preferences", 403),
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      interests,
      languages,
      skillLevel,
      location,
      maxPricePerDay,
      minPricePerDay,
      experience,
      certifications,
    } = body

    // Validate required fields
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        createErrorResponse("Interests array is required and must not be empty", 400),
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const preferences: GuideMatchingPreferences = {
      userId: new ObjectId(payload.userId),
      interests,
      languages: languages || ["English", "Urdu"],
      skillLevel: skillLevel || "intermediate",
      location,
      maxPricePerDay,
      minPricePerDay,
      experience: experience || "all",
      certifications,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("guide_matching_preferences").updateOne(
      { userId: new ObjectId(payload.userId) },
      {
        $set: preferences,
      },
      { upsert: true }
    )

    return NextResponse.json(
      createSuccessResponse({
        preferences,
        message: "Matching preferences saved successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error saving guide matching preferences:", error)
    return NextResponse.json(
      createErrorResponse("Internal server error", 500),
      { status: 500 }
    )
  }
}
