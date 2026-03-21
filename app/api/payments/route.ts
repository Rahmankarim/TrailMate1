import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { jazzCashService } from "@/lib/payment/jazzcash"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

// POST - Create payment for booking
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
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(createErrorResponse("Booking ID is required", 400), { status: 400 })
    }

    const db = await getDatabase()
    const bookingsCollection = db.collection("bookings")
    const paymentsCollection = db.collection("payments")

    // Get booking details
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) })

    if (!booking) {
      return NextResponse.json(createErrorResponse("Booking not found", 404), { status: 404 })
    }

    // Verify user owns this booking
    if (booking.userId.toString() !== payload.userId) {
      return NextResponse.json(createErrorResponse("Unauthorized", 403), { status: 403 })
    }

    // Check if booking is cancelled or completed
    if (booking.status === "cancelled") {
      return NextResponse.json(createErrorResponse("Cannot pay for cancelled booking", 400), { status: 400 })
    }

    if (booking.status === "completed") {
      return NextResponse.json(createErrorResponse("Booking already completed", 400), { status: 400 })
    }

    // Check if payment already exists
    const existingPayment = await paymentsCollection.findOne({ bookingId: booking._id })
    if (existingPayment && existingPayment.status === "completed") {
      return NextResponse.json(createErrorResponse("Payment already completed", 400), { status: 400 })
    }

    // Determine booking type and prepare payment data
    let paymentDescription = ""
    let paymentData: any = {
      amount: booking.totalPrice,
      currency: "PKR",
      bookingId: bookingId,
      userId: payload.userId,
    }

    if (booking.guideId) {
      // Guide hiring booking
      paymentDescription = `Payment for tour booking with ${booking.travelerName || "guide"}`
      paymentData.guideId = booking.guideId.toString()
      paymentData.description = paymentDescription
    } else if (booking.destinationId) {
      // Destination booking
      const destinationsCollection = db.collection("destinations")
      const destination = await destinationsCollection.findOne({ _id: booking.destinationId })
      paymentDescription = `Payment for destination booking: ${destination?.name || "destination"}`
      paymentData.destinationId = booking.destinationId.toString()
      paymentData.description = paymentDescription
    } else {
      return NextResponse.json(createErrorResponse("Invalid booking type", 400), { status: 400 })
    }

    // Create payment with JazzCash
    const paymentResult = await jazzCashService.createPayment(paymentData)

    if (!paymentResult.success) {
      return NextResponse.json(createErrorResponse(paymentResult.error || "Payment creation failed", 500), { status: 500 })
    }

    // Save or update payment record
    const payment: any = {
      bookingId: booking._id,
      userId: new ObjectId(payload.userId),
      amount: booking.totalPrice,
      currency: "PKR",
      transactionId: paymentResult.transactionId,
      status: "pending",
      paymentMethod: "jazzcash",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add guideId or destinationId based on booking type
    if (booking.guideId) {
      payment.guideId = booking.guideId
    } else if (booking.destinationId) {
      payment.destinationId = booking.destinationId
    }

    let paymentId
    if (existingPayment) {
      await paymentsCollection.updateOne(
        { _id: existingPayment._id },
        { $set: { ...payment, createdAt: existingPayment.createdAt } }
      )
      paymentId = existingPayment._id.toString()
    } else {
      const result = await paymentsCollection.insertOne(payment)
      paymentId = result.insertedId.toString()
    }

    // Update booking status
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          paymentStatus: "pending",
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json(createSuccessResponse({
      paymentId,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId
    }))
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}

// GET - Get payment status
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json(createErrorResponse("Booking ID is required", 400), { status: 400 })
    }

    const db = await getDatabase()
    const paymentsCollection = db.collection("payments")
    const bookingsCollection = db.collection("bookings")

    // Verify user owns this booking
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) })
    if (!booking) {
      return NextResponse.json(createErrorResponse("Booking not found", 404), { status: 404 })
    }

    if (booking.userId.toString() !== payload.userId && payload.role !== "admin") {
      return NextResponse.json(createErrorResponse("Unauthorized", 403), { status: 403 })
    }

    const payment = await paymentsCollection.findOne({ 
      bookingId: new ObjectId(bookingId) 
    })

    if (!payment) {
      return NextResponse.json(createSuccessResponse({ payment: null }))
    }

    const paymentResponse: any = {
      ...payment,
      _id: payment._id.toString(),
      bookingId: payment.bookingId.toString(),
      userId: payment.userId.toString(),
    }

    // Add guideId or destinationId if present
    if (payment.guideId) {
      paymentResponse.guideId = payment.guideId.toString()
    }
    if (payment.destinationId) {
      paymentResponse.destinationId = payment.destinationId.toString()
    }

    return NextResponse.json(createSuccessResponse({ payment: paymentResponse }))
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}
