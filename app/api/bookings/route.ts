import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"

// GET - Fetch bookings for user with pagination
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
    const status = searchParams.get("status")
    const type = searchParams.get("type") // "traveler" or "guide" or "company"
    const bookingType = searchParams.get("bookingType") // "destination_booking" or "guide_hiring"
    const paginate = searchParams.get("paginate") !== "false"

    const db = await getDatabase()
    const collection = db.collection("bookings")
    const guidesCollection = db.collection("guides")

    const query: Record<string, unknown> = {}

    if (type === "guide") {
      // For guides, find bookings where they are the guide
      const guidesCollection = db.collection("guides")
      const guideProfile = await guidesCollection.findOne({ userId: new ObjectId(payload.userId) })
      if (guideProfile) {
        query.guideId = guideProfile._id
      }
    } else if (type === "company") {
      // For companies viewing destination bookings, find bookings for their destinations
      const destinationsCollection = db.collection("destinations")
      const companyDestinations = await destinationsCollection
        .find({ userId: new ObjectId(payload.userId) })
        .toArray()
      
      const destinationIds = companyDestinations.map(d => d._id)
      
      if (destinationIds.length > 0) {
        query.destinationId = { $in: destinationIds }
      } else {
        // No destinations, return empty results
        query.destinationId = new ObjectId("000000000000000000000000") // Non-existent ID
      }
    } else {
      // For travelers, find their bookings
      query.userId = new ObjectId(payload.userId)
    }

    if (status) {
      query.status = status
    }

    if (bookingType) {
      query.bookingType = bookingType
    }

    // Auto-complete past confirmed bookings and release blocked guide dates
    const bookingsToComplete = await collection
      .find({
        ...query,
        status: "confirmed",
        endDate: { $lt: new Date() },
      })
      .toArray()

    if (bookingsToComplete.length > 0) {
      const bookingIdsToComplete = bookingsToComplete.map((booking) => booking._id)

      await collection.updateMany(
        { _id: { $in: bookingIdsToComplete } },
        {
          $set: {
            status: "completed",
            updatedAt: new Date(),
          },
        }
      )

      const guideIds = [
        ...new Set(
          bookingsToComplete
            .filter((booking) => booking.guideId)
            .map((booking) => booking.guideId.toString())
        ),
      ]

      await Promise.all(
        guideIds.map((guideId) =>
          guidesCollection.updateOne(
            { _id: new ObjectId(guideId) },
            {
              $pull: {
                blockedDates: {
                  bookingId: { $in: bookingIdsToComplete },
                },
              },
            }
          )
        )
      )
    }

    // Count total for pagination
    const total = await collection.countDocuments(query)

    let bookings
    let bookingsResult

    if (paginate) {
      // Get pagination params
      const { page, limit, skip } = getPaginationParams(searchParams, 20)

      // Fetch bookings with pagination
      bookings = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      bookingsResult = { bookings, pagination: createPaginatedResponse(bookings, page, limit, total).pagination }
    } else {
      // Fetch all bookings
      bookings = await collection.find(query).sort({ createdAt: -1 }).toArray()
      bookingsResult = { bookings }
    }

    // Populate destination and guide info
    const populatedBookings = await Promise.all(
      bookingsResult.bookings.map(async (booking) => {
        let destination = null
        let guide = null
        let guideName = ""
        let guideEmail = ""
        let userName = ""
        let userEmail = ""

        if (booking.destinationId) {
          destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
        }
        if (booking.guideId) {
          guide = await db.collection("guides").findOne({ _id: booking.guideId })
          if (guide && guide.userId) {
            const guideUser = await db.collection("users").findOne({ _id: guide.userId })
            if (guideUser) {
              guideName = `${guideUser.firstName || ""} ${guideUser.lastName || ""}`.trim()
              guideEmail = guideUser.email || ""
            }
          }
        }
        
        // Get user (traveler) information
        if (booking.userId) {
          const user = await db.collection("users").findOne({ _id: booking.userId })
          if (user) {
            userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
            userEmail = user.email || ""
          }
        }

        return { 
          ...booking, 
          _id: booking._id.toString(),
          userId: booking.userId?.toString(),
          guideId: booking.guideId?.toString(),
          guideName,
          guideEmail,
          userName,
          userEmail,
          destination, 
          guide 
        }
      }),
    )

    if (paginate) {
      return NextResponse.json({ 
        bookings: populatedBookings,
        pagination: bookingsResult.pagination
      })
    }

    return NextResponse.json({ bookings: populatedBookings })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new booking
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

    const db = await getDatabase()
    const collection = db.collection("bookings")

    const booking = {
      userId: new ObjectId(payload.userId),
      destinationId: body.destinationId ? new ObjectId(body.destinationId) : null,
      guideId: body.guideId ? new ObjectId(body.guideId) : null,
      type: body.type || "destination",
      bookingType: body.bookingType || "destination_booking", // "destination_booking" or "guide_hiring"
      status: "pending",
      paymentStatus: "unpaid", // Initial status - user hasn't paid yet
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      guests: body.guests || 1,
      employees: body.employees, // For company guide hiring
      totalPrice: body.totalPrice,
      notes: body.notes,
      travelerName: body.travelerName || payload.name,
      travelerEmail: body.travelerEmail || payload.email,
      travelerPhone: body.travelerPhone,
      tourName: body.tourName, // For guide hiring
      tourDescription: body.tourDescription, // For guide hiring
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('=== CREATING BOOKING ===')
    console.log('Body guideId:', body.guideId)
    console.log('Booking object:', JSON.stringify(booking, null, 2))

    const result = await collection.insertOne(booking)

    console.log('Booking created with ID:', result.insertedId)

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: { ...booking, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
