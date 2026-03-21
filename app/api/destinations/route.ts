import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { type CreateDestinationInput, generateSlug } from "@/lib/db/models/destination"
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"
import { buildRegexSearchQuery, getSortParams, buildFilterQuery } from "@/lib/utils/search"

// GET - Fetch destinations with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userOnly = searchParams.get("userOnly") === "true"
    const publishedParam = searchParams.get("published")
    const slug = searchParams.get("slug")
    const search = searchParams.get("search") || searchParams.get("q")

    const db = await getDatabase()
    const collection = db.collection("destinations")

    let query: Record<string, unknown> = {}

    // If slug is provided, fetch by slug
    if (slug) {
      query.slug = slug
      const destination = await collection.findOne(query)
      
      if (!destination) {
        return NextResponse.json({ 
          success: false, 
          message: "Destination not found" 
        }, { status: 404 })
      }
      
      // Increment view count
      await collection.updateOne(
        { _id: destination._id },
        { $inc: { views: 1 } }
      )
      
      return NextResponse.json({ 
        success: true, 
        destinations: [destination] 
      })
    }

    if (userOnly) {
      // Get user from token
      const cookieStore = await cookies()
      const token = cookieStore.get("access_token")?.value

      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const payload = await verifyAccessToken(token)
      if (!payload) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      query.userId = new ObjectId(payload.userId)
    } else if (publishedParam !== null) {
      // Only filter by published status if the parameter is explicitly provided
      query.isPublished = publishedParam === "true"
    }

    // Add search functionality
    if (search) {
      const searchQuery = buildRegexSearchQuery(search, ["name", "description", "location"])
      query = { ...query, ...searchQuery }
    }

    // Add filter support
    const filterParams = buildFilterQuery(searchParams, ["difficulty", "category"])
    query = { ...query, ...filterParams }

    // Count total for pagination
    const total = await collection.countDocuments(query)

    // Get pagination params
    const { page, limit, skip } = getPaginationParams(searchParams, 20)

    // Get sort params
    const sort = getSortParams(searchParams)

    // Fetch destinations with pagination
    const destinations = await collection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // If userOnly is false (public listing), return paginated response
    if (!userOnly) {
      const response = createPaginatedResponse(destinations, total, page, limit)
      return NextResponse.json({ 
        success: true, 
        destinations: response.data,
        pagination: response.pagination
      })
    }

    // For userOnly, return all destinations (no pagination)
    return NextResponse.json({ success: true, destinations })
  } catch (error) {
    console.error("Error fetching destinations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new destination
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    console.log("POST /api/destinations - Token exists:", !!token)

    if (!token) {
      console.log("POST /api/destinations - No token found in cookies")
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    console.log("POST /api/destinations - Token payload:", payload)

    if (!payload) {
      console.log("POST /api/destinations - Token verification failed")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only guides and admins can create destinations
    console.log("POST /api/destinations - User role:", payload.role)
    if (!["guide", "company", "admin"].includes(payload.role)) {
      console.log("POST /api/destinations - Permission denied for role:", payload.role)
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const body: CreateDestinationInput = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.location || !body.price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("destinations")

    // Generate unique slug
    let slug = generateSlug(body.name)
    const existingSlug = await collection.findOne({ slug })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const destination = {
      ...body,
      slug,
      userId: new ObjectId(payload.userId),
      isPublished: body.isPublished ?? false,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(destination)
    
    console.log("POST /api/destinations - Destination created successfully:", result.insertedId)

    return NextResponse.json(
      {
        success: true,
        message: "Destination created successfully",
        destination: { ...destination, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
