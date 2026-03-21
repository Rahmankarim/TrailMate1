import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { jazzCashService } from "@/lib/payment/jazzcash"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

// POST - Verify and complete payment
export async function POST(request: NextRequest) {
  try {
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
    const { transactionId, bookingId } = body

    if (!transactionId || !bookingId) {
      return NextResponse.json(createErrorResponse("Transaction ID and Booking ID are required", 400), { status: 400 })
    }

    const db = await getDatabase()
    const paymentsCollection = db.collection("payments")
    const bookingsCollection = db.collection("bookings")
    const notificationsCollection = db.collection("notifications")
    const usersCollection = db.collection("users")

    // Get booking
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) })
    
    if (!booking) {
      return NextResponse.json(createErrorResponse("Booking not found", 404), { status: 404 })
    }

    // Verify user owns this booking
    if (booking.userId.toString() !== payload.userId) {
      return NextResponse.json(createErrorResponse("Unauthorized", 403), { status: 403 })
    }

    // Check if booking is cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json(createErrorResponse("Cannot complete payment for cancelled booking", 400), { status: 400 })
    }

    // Get payment record
    const payment = await paymentsCollection.findOne({ transactionId })
    
    if (!payment) {
      return NextResponse.json(createErrorResponse("Payment not found", 404), { status: 404 })
    }

    // Check if already completed
    if (payment.status === "completed") {
      return NextResponse.json(createErrorResponse("Payment already completed", 400), { status: 400 })
    }

    // Verify payment with JazzCash
    const verificationResult = await jazzCashService.verifyPayment(transactionId)

    if (!verificationResult.verified) {
      // Mark payment as failed
      await paymentsCollection.updateOne(
        { transactionId },
        { 
          $set: { 
            status: "failed",
            failureReason: "Payment verification failed",
            updatedAt: new Date()
          } 
        }
      )

      return NextResponse.json(createErrorResponse("Payment verification failed", 400), { status: 400 })
    }

    // Update payment status
    await paymentsCollection.updateOne(
      { transactionId },
      { 
        $set: { 
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    // Update booking status - only set to confirmed if it's currently pending
    const bookingUpdate: any = {
      paymentStatus: "paid",
      updatedAt: new Date()
    }

    if (booking.status === "pending") {
      bookingUpdate.status = "confirmed"
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: bookingUpdate }
    )

    // Create notification for user
    await notificationsCollection.insertOne({
      userId: booking.userId,
      type: "payment",
      title: "Payment Successful",
      message: `Your payment of PKR ${booking.totalPrice} has been processed successfully.`,
      actionUrl: `/dashboard/user/bookings/${bookingId}`,
      read: false,
      createdAt: new Date()
    })

    // Create notification for guide or company based on booking type
    if (booking.guideId) {
      // Guide hiring booking - notify the guide
      const guide = await db.collection("guides").findOne({ _id: booking.guideId })
      
      if (guide && guide.userId) {
        await notificationsCollection.insertOne({
          userId: guide.userId,
          type: "booking",
          title: "New Paid Booking",
          message: `You have received a new paid booking worth PKR ${booking.totalPrice}.`,
          actionUrl: `/dashboard/guide/bookings/${bookingId}`,
          read: false,
          createdAt: new Date()
        })
      }
    } else if (booking.destinationId) {
      // Destination booking - notify the company owner
      const destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
      
      if (destination && destination.userId) {
        await notificationsCollection.insertOne({
          userId: destination.userId,
          type: "booking",
          title: "Booking Payment Received",
          message: `Payment of PKR ${booking.totalPrice} received for ${destination.name}.`,
          actionUrl: `/dashboard/company/bookings`,
          read: false,
          createdAt: new Date()
        })
      }
    }

    return NextResponse.json(createSuccessResponse(undefined, "Payment completed successfully"))
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}
