import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Get provider's bank accounts for a booking
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

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bookingsCollection = db.collection("bookings")
    const usersCollection = db.collection("users")

    // Get booking
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) })
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Find the provider's user ID
    let providerUserId = null

    if (booking.guideId) {
      // Guide hiring booking
      const guide = await db.collection("guides").findOne({ _id: booking.guideId })
      if (guide) {
        providerUserId = guide.userId
      }
    } else if (booking.destinationId) {
      // Destination booking
      const destination = await db.collection("destinations").findOne({ _id: booking.destinationId })
      if (destination) {
        providerUserId = destination.userId
      }
    }

    if (!providerUserId) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    // Get provider's bank accounts
    const provider = await usersCollection.findOne({ _id: providerUserId })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    const bankAccounts = provider.bankAccounts || []

    return NextResponse.json({ 
      success: true,
      bankAccounts: bankAccounts.map((account: any) => ({
        _id: account._id?.toString(),
        bankName: account.bankName,
        accountTitle: account.accountTitle,
        accountNumber: account.accountNumber,
        iban: account.iban,
        branchCode: account.branchCode
      })),
      providerName: `${provider.firstName || ""} ${provider.lastName || ""}`.trim() || provider.email
    })
  } catch (error) {
    console.error("Error fetching provider bank accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
