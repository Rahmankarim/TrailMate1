import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// DELETE - Remove a team member
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only company users can delete team members
    if (payload.role !== "company") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const db = await getDatabase()
    const collection = db.collection("team_members")

    // Verify ownership
    const teamMember = await collection.findOne({ _id: new ObjectId(id) })
    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    if (teamMember.companyId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update team member status or details
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only company users can update team members
    if (payload.role !== "company") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const body = await request.json()
    const db = await getDatabase()
    const collection = db.collection("team_members")

    // Verify ownership
    const teamMember = await collection.findOne({ _id: new ObjectId(id) })
    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    if (teamMember.companyId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    // Don't allow changing companyId or _id
    delete updateData.companyId
    delete updateData._id

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedMember = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully",
      teamMember: updatedMember,
    })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
