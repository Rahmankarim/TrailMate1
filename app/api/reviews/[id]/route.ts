import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db/mongodb"

// GET /api/reviews/[id] - Get a single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      )
    }

    const reviewsCollection = await getCollection("reviews")
    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { rating, comment, userId } = body

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      )
    }

    const reviewsCollection = await getCollection("reviews")
    
    // Verify ownership
    const existingReview = await reviewsCollection.findOne({ _id: new ObjectId(id) })
    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    if ((existingReview as any).userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to update this review" },
        { status: 403 }
      )
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: "Rating must be between 1 and 5" },
          { status: 400 }
        )
      }
      updateData.rating = rating
    }

    if (comment !== undefined) {
      updateData.comment = comment
    }

    await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    // Update guide's average rating
    if (rating !== undefined) {
      try {
        const guidesCollection = await getCollection("guides")
        const guideId = (existingReview as any).guideId
        
        const allReviews = await reviewsCollection.find({ guideId }).toArray()
        const totalRating = allReviews.reduce((sum, review: any) => sum + review.rating, 0)
        const averageRating = totalRating / allReviews.length

        await guidesCollection.updateOne(
          { _id: new ObjectId(guideId) },
          {
            $set: {
              rating: Math.round(averageRating * 10) / 10,
              updatedAt: new Date()
            }
          }
        )
      } catch (error) {
        console.error("Error updating guide rating:", error)
      }
    }

    const updatedReview = await reviewsCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: "Review updated successfully",
      review: updatedReview
    })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      )
    }

    const reviewsCollection = await getCollection("reviews")
    
    // Verify ownership
    const existingReview = await reviewsCollection.findOne({ _id: new ObjectId(id) })
    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    if ((existingReview as any).userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this review" },
        { status: 403 }
      )
    }

    const guideId = (existingReview as any).guideId

    await reviewsCollection.deleteOne({ _id: new ObjectId(id) })

    // Update guide's rating and review count
    try {
      const guidesCollection = await getCollection("guides")
      const remainingReviews = await reviewsCollection.find({ guideId }).toArray()
      
      if (remainingReviews.length > 0) {
        const totalRating = remainingReviews.reduce((sum, review: any) => sum + review.rating, 0)
        const averageRating = totalRating / remainingReviews.length

        await guidesCollection.updateOne(
          { _id: new ObjectId(guideId) },
          {
            $set: {
              rating: Math.round(averageRating * 10) / 10,
              reviewCount: remainingReviews.length,
              updatedAt: new Date()
            }
          }
        )
      } else {
        // Reset rating if no reviews left
        await guidesCollection.updateOne(
          { _id: new ObjectId(guideId) },
          {
            $set: {
              rating: 0,
              reviewCount: 0,
              updatedAt: new Date()
            }
          }
        )
      }
    } catch (error) {
      console.error("Error updating guide rating:", error)
    }

    return NextResponse.json({
      message: "Review deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    )
  }
}
