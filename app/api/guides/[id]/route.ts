import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch single guide
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const collection = db.collection("guides")

    let guide

    if (ObjectId.isValid(id)) {
      guide = await collection.findOne({ _id: new ObjectId(id) })
    }

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 })
    }

    return NextResponse.json({ guide })
  } catch (error) {
    console.error("Error fetching guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update guide
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json()

    const db = await getDatabase()
    const collection = db.collection("guides")

    const guide = await collection.findOne({ _id: new ObjectId(id) })

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (payload.role !== "admin" && guide.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    delete updateData.userId
    delete updateData._id

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedGuide = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: "Guide updated successfully",
      guide: updatedGuide,
    })
  } catch (error) {
    console.error("Error updating guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete guide
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

    const db = await getDatabase()
    const collection = db.collection("guides")

    const guide = await collection.findOne({ _id: new ObjectId(id) })

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 })
    }

    if (payload.role !== "admin" && guide.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Guide deleted successfully" })
  } catch (error) {
    console.error("Error deleting guide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
