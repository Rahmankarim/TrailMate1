import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import type { CreateGuideInput } from "@/lib/db/models/guide"
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"
import { buildRegexSearchQuery, getSortParams, buildFilterQuery } from "@/lib/utils/search"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

// GET - Fetch guides (public or user-specific)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userOnly = searchParams.get("userOnly") === "true"
    const published = searchParams.get("published") !== "false"
    const paginate = searchParams.get("paginate") !== "false"
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const minRating = searchParams.get("minRating")
    const maxPrice = searchParams.get("maxPrice")
    const minPrice = searchParams.get("minPrice")
    const languages = searchParams.get("languages")
    const specialties = searchParams.get("specialties")

    const db = await getDatabase()
    const collection = db.collection("guides")

    const query: Record<string, unknown> = {}

    if (userOnly) {
      const cookieStore = await cookies()
      const token = cookieStore.get("access_token")?.value

      if (!token) {
        return NextResponse.json(createErrorResponse("Unauthorized", 401), { status: 401 })
      }

      const payload = await verifyAccessToken(token)
      if (!payload) {
        return NextResponse.json(createErrorResponse("Invalid token", 401), { status: 401 })
      }

      query.userId = new ObjectId(payload.userId)
    } else if (published) {
      query.isPublished = true
    }

    // Search across name, bio, location, specialties
    if (search) {
      const searchQuery = buildRegexSearchQuery(search, ["name", "bio", "location", "specialties"])
      Object.assign(query, searchQuery)
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) }
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {}
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice)
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice)
    }

    // Languages filter (array contains)
    if (languages) {
      const langArray = languages.split(",").map(l => l.trim())
      query.languages = { $in: langArray }
    }

    // Specialties filter (array contains)
    if (specialties) {
      const specArray = specialties.split(",").map(s => s.trim())
      query.specialties = { $in: specArray }
    }

    console.log("Fetching guides with query:", query)

    const { sortBy, sortOrder } = getSortParams(searchParams, "createdAt", "desc")
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 }

    if (paginate && !userOnly) {
      const { page, limit, skip } = getPaginationParams(searchParams, 20)
      const totalCount = await collection.countDocuments(query)
      
      const guides = await collection
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray()

      console.log(`Found ${guides.length} guides (page ${page}, total ${totalCount})`)

      const response = createPaginatedResponse(guides, totalCount, page, limit)
      return NextResponse.json({
        success: true,
        guides: response.data,
        pagination: response.pagination
      })
    } else {
      const guides = await collection.find(query).sort(sortOptions).toArray()
      console.log(`Found ${guides.length} guides`)

      return NextResponse.json({ success: true, guides })
    }
  } catch (error) {
    console.error("Error fetching guides:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}

// POST - Create new guide profile
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only guides can create guide profiles
    if (payload.role !== "guide" && payload.role !== "admin") {
      return NextResponse.json({ error: "Only guides can create guide profiles" }, { status: 403 })
    }

    const body: CreateGuideInput = await request.json()

    // Validate required fields
    if (!body.name || !body.bio || !body.location || !body.pricePerDay) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("guides")

    // Check if guide profile already exists for this user
    const existingGuide = await collection.findOne({ userId: new ObjectId(payload.userId) })
    if (existingGuide) {
      return NextResponse.json({ error: "Guide profile already exists" }, { status: 400 })
    }

    const guide = {
      ...body,
      userId: new ObjectId(payload.userId),
      email: body.email || payload.email,
      availability: { available: true },
      rating: 0,
      reviewCount: 0,
      totalTours: 0,
      isVerified: false,
      isPublished: body.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(guide)

    return NextResponse.json(
      {
        message: "Guide profile created successfully",
        guide: { ...guide, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update guide profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only guides can update their profiles
    if (payload.role !== "guide" && payload.role !== "admin") {
      return NextResponse.json({ error: "Only guides can update guide profiles" }, { status: 403 })
    }

    const body = await request.json()
    const db = await getDatabase()
    const collection = db.collection("guides")

    // Find the guide profile
    const guide = await collection.findOne({ userId: new ObjectId(payload.userId) })
    if (!guide) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    // Update the profile
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    // Don't allow changing userId or _id
    delete updateData.userId
    delete updateData._id

    await collection.updateOne({ userId: new ObjectId(payload.userId) }, { $set: updateData })

    const updatedGuide = await collection.findOne({ userId: new ObjectId(payload.userId) })

    return NextResponse.json({
      message: "Guide profile updated successfully",
      guide: updatedGuide,
    })
  } catch (error) {
    console.error("Error updating guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
