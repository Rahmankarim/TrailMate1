import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch team members for a company
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

    // Only company users can access team members
    if (payload.role !== "company") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const db = await getDatabase()
    const collection = db.collection("team_members")

    const teamMembers = await collection
      .find({ companyId: new ObjectId(payload.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, teamMembers })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Add a new team member
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

    // Only company users can add team members
    if (payload.role !== "company") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("team_members")

    const teamMember = {
      companyId: new ObjectId(payload.userId),
      name: body.name,
      email: body.email,
      role: body.role,
      phone: body.phone || "",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(teamMember)

    return NextResponse.json(
      {
        success: true,
        message: "Team member added successfully",
        teamMember: { ...teamMember, _id: result.insertedId },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
