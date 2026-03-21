import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch saved destinations for user
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

    const db = await getDatabase()
    const savedCollection = db.collection("saved_destinations")

    const savedItems = await savedCollection
      .find({ userId: new ObjectId(payload.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // Populate destination details
    const populatedSaved = await Promise.all(
      savedItems.map(async (item) => {
        const destination = await db.collection("destinations").findOne({ _id: item.destinationId })
        return {
          _id: item._id.toString(),
          destinationId: item.destinationId.toString(),
          userId: item.userId.toString(),
          createdAt: item.createdAt,
          destination: destination
            ? {
                ...destination,
                _id: destination._id.toString(),
              }
            : null,
        }
      })
    )

    return NextResponse.json({ saved: populatedSaved.filter((s) => s.destination !== null) })
  } catch (error) {
    console.error("Error fetching saved destinations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Save a destination
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
    const { destinationId } = body

    if (!destinationId) {
      return NextResponse.json({ error: "Destination ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const savedCollection = db.collection("saved_destinations")

    // Check if already saved
    const existing = await savedCollection.findOne({
      userId: new ObjectId(payload.userId),
      destinationId: new ObjectId(destinationId),
    })

    if (existing) {
      return NextResponse.json({ error: "Already saved" }, { status: 400 })
    }

    const saved = {
      userId: new ObjectId(payload.userId),
      destinationId: new ObjectId(destinationId),
      createdAt: new Date(),
    }

    const result = await savedCollection.insertOne(saved)

    return NextResponse.json(
      {
        message: "Destination saved successfully",
        saved: { ...saved, _id: result.insertedId },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error saving destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
