import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch single destination
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const collection = db.collection("destinations")

    let destination

    // Try to find by slug first, then by ID
    destination = await collection.findOne({ slug: id })

    if (!destination && ObjectId.isValid(id)) {
      destination = await collection.findOne({ _id: new ObjectId(id) })
    }

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    return NextResponse.json({ destination })
  } catch (error) {
    console.error("Error fetching destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update destination
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
    const collection = db.collection("destinations")

    // Find the destination
    const destination = await collection.findOne({ _id: new ObjectId(id) })

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (payload.role !== "admin" && destination.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Update destination
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    // Don't allow changing userId or _id
    delete updateData.userId
    delete updateData._id

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedDestination = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: "Destination updated successfully",
      destination: updatedDestination,
    })
  } catch (error) {
    console.error("Error updating destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Partially update destination
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

    const body = await request.json()

    const db = await getDatabase()
    const collection = db.collection("destinations")

    // Find the destination
    const destination = await collection.findOne({ _id: new ObjectId(id) })

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (payload.role !== "admin" && destination.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Update only the fields provided
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    // Don't allow changing userId or _id
    delete updateData.userId
    delete updateData._id

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedDestination = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: "Destination updated successfully",
      destination: updatedDestination,
    })
  } catch (error) {
    console.error("Error updating destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete destination
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
    const collection = db.collection("destinations")

    // Find the destination
    const destination = await collection.findOne({ _id: new ObjectId(id) })

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    // Check ownership (unless admin)
    if (payload.role !== "admin" && destination.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Destination deleted successfully" })
  } catch (error) {
    console.error("Error deleting destination:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
