import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// POST - Upload payment proof screenshot
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

    const body = await request.json()
    const { bookingId, screenshot, accountDetails } = body

    if (!bookingId || !screenshot) {
      return NextResponse.json({ 
        error: "Booking ID and screenshot are required" 
      }, { status: 400 })
    }

    const db = await getDatabase()
    const bookingsCollection = db.collection("bookings")
    const paymentsCollection = db.collection("payments")
    const notificationsCollection = db.collection("notifications")

    // Get booking
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) })
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Verify user owns this booking
    if (booking.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get provider details
    let providerId = null
    let providerType = null
    let bookingType = null

    if (booking.guideId) {
      const guide = await db.collection("guides").findOne({ _id: booking.guideId })
      if (guide) {
        providerId = guide.userId
        providerType = "guide"
        bookingType = "guide_hiring"
      }
    } else if (booking.destinationId) {
      const destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
      if (destination) {
        providerId = destination.userId
        providerType = "company"
        bookingType = "destination_booking"
      }
    }

    // Create or update payment proof with complete details
    const paymentProof = {
      bookingId: booking._id,
      userId: new ObjectId(payload.userId),
      providerId: providerId ? new ObjectId(providerId) : null,
      providerType,
      bookingType,
      amount: booking.totalPrice,
      screenshot,
      accountDetails,
      status: "pending_verification",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Update or create payment proof
    const existingProof = await paymentsCollection.findOne({ bookingId: booking._id })
    
    if (existingProof) {
      await paymentsCollection.updateOne(
        { bookingId: booking._id },
        { 
          $set: { 
            screenshot, 
            accountDetails,
            amount: booking.totalPrice,
            providerId: providerId ? new ObjectId(providerId) : null,
            providerType,
            bookingType,
            status: "pending_verification",
            updatedAt: new Date() 
          } 
        }
      )
    } else {
      await paymentsCollection.insertOne(paymentProof)
    }

    // Update booking payment status
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          paymentStatus: "pending",
          updatedAt: new Date()
        } 
      }
    )

    // Notify service provider (guide or company)
    if (providerId) {
      let actionUrl = `/dashboard/${providerType}/bookings`
      let destinationName = ""
      
      if (booking.destinationId) {
        const destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
        destinationName = destination?.name || "destination"
      }

      await notificationsCollection.insertOne({
        userId: new ObjectId(providerId),
        type: "payment_verification",
        title: "Payment Proof Received",
        message: destinationName 
          ? `Payment proof received for ${destinationName} booking worth $${booking.totalPrice}. Please verify.`
          : `Payment proof received for booking worth $${booking.totalPrice}. Please verify.`,
        actionUrl,
        metadata: { 
          bookingId: bookingId,
          paymentProofId: existingProof?._id?.toString() || null
        },
        read: false,
        createdAt: new Date()
      })
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment proof uploaded successfully. Awaiting verification."
    })
  } catch (error) {
    console.error("Error uploading payment proof:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get payment proof(s)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    const db = await getDatabase()
    const paymentsCollection = db.collection("payments")
    const bookingsCollection = db.collection("bookings")
    const usersCollection = db.collection("users")

    // If bookingId provided, return specific proof
    if (bookingId) {
      const paymentProof = await paymentsCollection.findOne({ 
        bookingId: new ObjectId(bookingId) 
      })

      if (!paymentProof) {
        return NextResponse.json({ success: true, paymentProof: null })
      }

      return NextResponse.json({ 
        success: true,
        paymentProof: {
          ...paymentProof,
          _id: paymentProof._id.toString(),
          bookingId: paymentProof.bookingId.toString(),
          userId: paymentProof.userId.toString()
        }
      })
    }

    // Otherwise, return all pending verifications for this provider
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let providerBookings: any[]

    if (user.role === "guide") {
      // Get guide's profile
      const guide = await db.collection("guides").findOne({ userId: new ObjectId(payload.userId) })
      if (guide) {
        // Get all bookings where this guide is the provider
        const bookings = await bookingsCollection.find({ 
          guideId: guide._id 
        }).toArray()
        providerBookings = bookings
      } else {
        providerBookings = []
      }
    } else if (user.role === "company") {
      // Get company's destinations
      const destinations = await db.collection("destinations").find({ 
        userId: new ObjectId(payload.userId) 
      }).toArray()
      
      const destinationIds = destinations.map(d => d._id)
      
      // Get all bookings for these destinations
      const bookings = await bookingsCollection.find({ 
        destinationId: { $in: destinationIds } 
      }).toArray()
      providerBookings = bookings
    } else {
      providerBookings = []
    }

    if (providerBookings.length === 0) {
      return NextResponse.json({ success: true, proofs: [] })
    }

    const bookingIds = providerBookings.map(b => b._id)

    // Get all pending payment proofs for these bookings
    const pendingProofs = await paymentsCollection.find({
      bookingId: { $in: bookingIds },
      status: "pending_verification"
    }).toArray()

    // Enrich with booking and customer details
    const enrichedProofs = await Promise.all(
      pendingProofs.map(async (proof) => {
        const booking = providerBookings.find(b => b._id.toString() === proof.bookingId.toString())
        const customer = booking ? await usersCollection.findOne({ _id: booking.userId }) : null
        
        let destination = null
        if (booking?.destinationId) {
          destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
        }

        return {
          _id: proof._id.toString(),
          bookingId: proof.bookingId.toString(),
          userId: proof.userId.toString(),
          screenshot: proof.screenshot,
          accountDetails: proof.accountDetails,
          status: proof.status,
          createdAt: proof.createdAt,
          updatedAt: proof.updatedAt,
          booking: booking ? {
            _id: booking._id.toString(),
            totalPrice: booking.totalPrice,
            guests: booking.guests,
            startDate: booking.startDate,
            endDate: booking.endDate,
            customerName: customer?.name || "Unknown",
            destination: destination ? {
              name: destination.name,
              coverImage: destination.coverImage
            } : null
          } : null
        }
      })
    )

    return NextResponse.json({ 
      success: true,
      proofs: enrichedProofs
    })
  } catch (error) {
    console.error("Error fetching payment proof:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Confirm or reject payment
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { proofId, bookingId, action } = body

    if ((!proofId && !bookingId) || !action || !["confirm", "reject"].includes(action)) {
      return NextResponse.json({ 
        error: "Proof ID or Booking ID and valid action (confirm/reject) are required" 
      }, { status: 400 })
    }

    const db = await getDatabase()
    const bookingsCollection = db.collection("bookings")
    const paymentsCollection = db.collection("payments")
    const notificationsCollection = db.collection("notifications")

    // Get payment proof
    let paymentProof
    if (proofId) {
      paymentProof = await paymentsCollection.findOne({ _id: new ObjectId(proofId) })
    } else {
      paymentProof = await paymentsCollection.findOne({ bookingId: new ObjectId(bookingId) })
    }

    if (!paymentProof) {
      return NextResponse.json({ error: "Payment proof not found" }, { status: 404 })
    }

    // Get booking
    const booking = await bookingsCollection.findOne({ _id: paymentProof.bookingId })
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Verify user is the service provider
    let isAuthorized = false
    if (booking.guideId) {
      const guide = await db.collection("guides").findOne({ _id: booking.guideId })
      if (guide && guide.userId.toString() === payload.userId) {
        isAuthorized = true
      }
    } else if (booking.destinationId) {
      const destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
      if (destination && destination.userId.toString() === payload.userId) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (action === "confirm") {
      // Get verifier details
      const verifier = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) })
      
      // Confirm payment
      await paymentsCollection.updateOne(
        { _id: paymentProof._id },
        { 
          $set: { 
            status: "completed",
            verifiedBy: new ObjectId(payload.userId),
            verifiedByName: verifier?.name || "Unknown",
            verifiedAt: new Date(),
            updatedAt: new Date()
          } 
        }
      )

      await bookingsCollection.updateOne(
        { _id: booking._id },
        { 
          $set: { 
            paymentStatus: "paid",
            paymentVerifiedAt: new Date(),
            paymentVerifiedBy: new ObjectId(payload.userId),
            updatedAt: new Date()
          } 
        }
      )

      // Notify customer
      await notificationsCollection.insertOne({
        userId: booking.userId,
        type: "payment",
        title: "Payment Confirmed ✅",
        message: `Your payment of $${booking.totalPrice} has been verified and confirmed.`,
        actionUrl: `/dashboard/user/bookings`,
        read: false,
        createdAt: new Date()
      })

      return NextResponse.json({ 
        success: true,
        message: "Payment confirmed successfully"
      })
    } else {
      // Get rejector details
      const rejector = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) })
      
      // Reject payment
      await paymentsCollection.updateOne(
        { _id: paymentProof._id },
        { 
          $set: { 
            status: "rejected",
            rejectedBy: new ObjectId(payload.userId),
            rejectedByName: rejector?.name || "Unknown",
            rejectedAt: new Date(),
            rejectionReason: body.reason || "Screenshot not clear or invalid",
            updatedAt: new Date()
          } 
        }
      )

      await bookingsCollection.updateOne(
        { _id: booking._id },
        { 
          $set: { 
            paymentStatus: "unpaid",
            updatedAt: new Date()
          } 
        }
      )

      // Notify customer
      await notificationsCollection.insertOne({
        userId: booking.userId,
        type: "payment",
        title: "Payment Rejected ❌",
        message: `Your payment proof for $${booking.totalPrice} was rejected. Please upload a clear screenshot or contact support.`,
        actionUrl: `/dashboard/user/bookings`,
        metadata: {
          bookingId: booking._id.toString(),
          reason: body.reason || "Screenshot not clear or invalid"
        },
        read: false,
        createdAt: new Date()
      })

      return NextResponse.json({ 
        success: true,
        message: "Payment rejected"
      })
    }
  } catch (error) {
    console.error("Error processing payment verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
