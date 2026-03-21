import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"

// GET - Fetch all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    const collection = db.collection("users")

    const users = await collection
      .find({})
      .sort({ createdAt: -1 })
      .project({ password: 0 }) // Exclude password
      .toArray()

    return NextResponse.json({
      users: users.map((u) => ({ ...u, _id: u._id.toString() })),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
