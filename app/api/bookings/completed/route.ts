import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"

// GET - Fetch completed bookings for a guide (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guideId = searchParams.get("guideId")

    if (!guideId || !ObjectId.isValid(guideId)) {
      return NextResponse.json({ error: "Valid guide ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("bookings")

    const bookings = await collection
      .find({
        guideId: new ObjectId(guideId),
        status: "completed",
      })
      .sort({ endDate: -1 })
      .limit(10)
      .toArray()

    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id.toString(),
      travelerName: booking.travelerName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests,
      destination: booking.destination,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error("Error fetching completed bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
