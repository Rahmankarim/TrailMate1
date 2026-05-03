import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"
import { checkAndAwardBadgesOnBookingComplete } from "@/lib/utils/badge-system"

// PUT - Update booking status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json(createErrorResponse("Unauthorized", 401), { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(createErrorResponse("Invalid token", 401), { status: 401 })
    }

    const body = await request.json()

    const db = await getDatabase()
    const collection = db.collection("bookings")

    const booking = await collection.findOne({ _id: new ObjectId(id) })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user is the booking owner or the guide or the company (destination owner)
    const isOwner = booking.userId.toString() === payload.userId

    let isGuide = false
    if (booking.guideId) {
      const guidesCollection = db.collection("guides")
      const guideProfile = await guidesCollection.findOne({
        _id: booking.guideId,
        userId: new ObjectId(payload.userId),
      })
      isGuide = !!guideProfile
    }

    // Check if user is the company that owns the destination
    let isCompany = false
    if (booking.destinationId) {
      const destinationsCollection = db.collection("destinations")
      const destination = await destinationsCollection.findOne({
        _id: booking.destinationId,
        userId: new ObjectId(payload.userId),
      })
      isCompany = !!destination
    }

    if (!isOwner && !isGuide && !isCompany && payload.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (body.status) {
      // Validate status
      const validStatuses = ["pending", "confirmed", "completed", "cancelled"]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(createErrorResponse("Invalid status value", 400), { status: 400 })
      }
      updateData.status = body.status
      
      // Auto-update payment status based on booking status
      if (body.status === "confirmed" && !booking.paymentStatus) {
        updateData.paymentStatus = "unpaid"
      }
      if (body.status === "cancelled" && booking.paymentStatus === "paid") {
        updateData.paymentStatus = "refunded"
      }
    }
    
    if (body.paymentStatus) {
      // Validate payment status
      const validPaymentStatuses = ["unpaid", "pending", "paid", "refunded"]
      if (!validPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json(createErrorResponse("Invalid payment status value", 400), { status: 400 })
      }
      
      // Only guide/company/admin can update payment status
      if (payload.role !== "admin" && payload.role !== "company" && !isGuide) {
        return NextResponse.json(createErrorResponse("You don't have permission to update payment status", 403), { status: 403 })
      }
      
      updateData.paymentStatus = body.paymentStatus
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    // If booking is being confirmed and it has a guide, block the dates
    if (body.status === "confirmed" && body.blockDates && booking.guideId) {
      const guidesCollection = db.collection("guides")
      
      // Add blocked dates to guide's unavailable dates
      const blockedDateRange = {
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingId: booking._id
      }

      await guidesCollection.updateOne(
        { _id: booking.guideId },
        { 
          $push: { 
            blockedDates: blockedDateRange 
          } 
        }
      )

      console.log('=== BLOCKED DATES ===')
      console.log('Guide ID:', booking.guideId.toString())
      console.log('Date Range:', blockedDateRange)
    }

    // If booking is being cancelled or completed, remove blocked dates
    if ((body.status === "cancelled" || body.status === "completed") && booking.guideId) {
      const guidesCollection = db.collection("guides")
      
      await guidesCollection.updateOne(
        { _id: booking.guideId },
        { 
          $pull: { 
            blockedDates: { bookingId: booking._id } 
          } 
        }
      )

      console.log('=== REMOVED BLOCKED DATES ===')
      console.log('Guide ID:', booking.guideId.toString())
      console.log('Booking ID:', booking._id.toString())
    }

    // Award badges if booking is being completed and has a guide
    let badgesAwarded = null
    if (body.status === "completed" && booking.guideId) {
      try {
        badgesAwarded = await checkAndAwardBadgesOnBookingComplete(db, id)
        console.log('=== BADGES AWARDED ===')
        console.log('Guide ID:', booking.guideId.toString())
        console.log('Badges:', badgesAwarded)
      } catch (badgeError) {
        console.error("Error awarding badges:", badgeError)
        // Don't fail the booking update if badges fail
      }
    }

    const updatedBooking = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(createSuccessResponse(
      { 
        booking: updatedBooking,
        badgesAwarded: badgesAwarded?.newBadges || [],
        badgeMessage: badgesAwarded?.message,
      },
      "Booking updated successfully"
    ))
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}

// DELETE - Cancel booking
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json(createErrorResponse("Unauthorized", 401), { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(createErrorResponse("Invalid token", 401), { status: 401 })
    }

    const db = await getDatabase()
    const collection = db.collection("bookings")

    const booking = await collection.findOne({ _id: new ObjectId(id) })

    if (!booking) {
      return NextResponse.json(createErrorResponse("Booking not found", 404), { status: 404 })
    }

    if (booking.userId.toString() !== payload.userId && payload.role !== "admin") {
      return NextResponse.json(createErrorResponse("Permission denied", 403), { status: 403 })
    }

    // Soft delete - just mark as cancelled
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: { status: "cancelled", updatedAt: new Date() } })

    // Remove blocked dates if guide booking
    if (booking.guideId) {
      const guidesCollection = db.collection("guides")
      await guidesCollection.updateOne(
        { _id: booking.guideId },
        { $pull: { blockedDates: { bookingId: booking._id } } }
      )
    }

    return NextResponse.json(createSuccessResponse(undefined, "Booking cancelled successfully"))
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}
