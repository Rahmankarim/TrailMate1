import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/mongodb"
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

// GET /api/reviews - Get reviews for a guide or by a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const guideId = searchParams.get("guideId")
    const userId = searchParams.get("userId")
    const paginate = searchParams.get("paginate") !== "false"

    const reviewsCollection = await getCollection("reviews")
    
    let query: any = {}
    
    if (guideId) {
      query.guideId = guideId
    }
    
    if (userId) {
      query.userId = userId
    }

    // Calculate average rating for the guide
    let averageRating = 0
    const totalReviews = await reviewsCollection.countDocuments(query)
    
    if (guideId && totalReviews > 0) {
      const allReviews = await reviewsCollection.find(query).toArray()
      const sum = allReviews.reduce((acc, review: any) => acc + review.rating, 0)
      averageRating = sum / totalReviews
    }

    if (paginate) {
      const { page, limit, skip } = getPaginationParams(searchParams)
      
      const reviews = await reviewsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const paginated = createPaginatedResponse(reviews, totalReviews, page, limit, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
      })

      return NextResponse.json({
        ...paginated,
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
      })
    } else {
      const reviews = await reviewsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()

      return NextResponse.json({
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      })
    }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      createErrorResponse("Failed to fetch reviews", 500),
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      guideId,
      guideName,
      guideAvatar,
      userId,
      userName,
      userAvatar,
      rating,
      comment,
      tourDate
    } = body

    console.log('=== REVIEW SUBMISSION ===')
    console.log('Body:', JSON.stringify(body, null, 2))

    // Validation
    if (!guideId || !userId || !rating) {
      console.log('Missing required fields:', { guideId, userId, rating })
      return NextResponse.json(
        { error: "Missing required fields: guideId, userId, and rating are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      console.log('Invalid rating:', rating)
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    const reviewsCollection = await getCollection("reviews")

    // Check if user has already reviewed this guide
    const existingReview = await reviewsCollection.findOne({
      guideId,
      userId
    })

    if (existingReview) {
      console.log('Duplicate review detected:', { guideId, userId, existingReviewId: existingReview._id })
      return NextResponse.json(
        { error: "You have already reviewed this guide. You can edit your existing review instead." },
        { status: 400 }
      )
    }

    const newReview = {
      guideId,
      guideName: guideName || "Unknown Guide",
      guideAvatar: guideAvatar || "",
      userId,
      userName: userName || "Anonymous",
      userAvatar: userAvatar || "",
      rating,
      comment: comment || "",
      tourDate: tourDate ? new Date(tourDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await reviewsCollection.insertOne(newReview as any)

    // Update guide's rating and review count
    try {
      const guidesCollection = await getCollection("guides")
      
      // Get all reviews for this guide
      const allReviews = await reviewsCollection.find({ guideId }).toArray()
      const totalRating = allReviews.reduce((sum, review: any) => sum + review.rating, 0)
      const averageRating = totalRating / allReviews.length

      await guidesCollection.updateOne(
        { _id: new ObjectId(guideId) },
        {
          $set: {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviewCount: allReviews.length,
            updatedAt: new Date()
          }
        }
      )
    } catch (error) {
      console.error("Error updating guide rating:", error)
      // Continue even if guide update fails
    }

    return NextResponse.json({
      message: "Review created successfully",
      review: { ...newReview, _id: result.insertedId }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}
