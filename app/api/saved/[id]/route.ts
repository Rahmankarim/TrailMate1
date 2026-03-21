import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// DELETE - Remove saved destination
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const result = await savedCollection.deleteOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(payload.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Saved destination not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Removed from saved" })
  } catch (error) {
    console.error("Error removing saved destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
