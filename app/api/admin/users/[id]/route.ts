import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// PATCH - Update user (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()

    const db = await getDatabase()
    const collection = db.collection("users")

    const updateData: any = {}
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive
    if (body.role) updateData.role = body.role

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove user and related records (admin only)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
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

    if (payload.userId === params.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const bookingsCollection = db.collection("bookings")
    const destinationsCollection = db.collection("destinations")
    const guidesCollection = db.collection("guides")

    const userId = new ObjectId(params.id)
    const targetUser = await usersCollection.findOne({ _id: userId })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const cleanupTasks: Promise<unknown>[] = []

    if (targetUser.role === "guide") {
      const guideDocs = await guidesCollection.find({ userId }).toArray()
      const guideIds = guideDocs.map((guide: any) => guide._id)

      if (guideIds.length > 0) {
        cleanupTasks.push(bookingsCollection.deleteMany({ guideId: { $in: guideIds } }))
      }

      cleanupTasks.push(guidesCollection.deleteMany({ userId }))
      cleanupTasks.push(usersCollection.updateOne({ _id: userId }, { $set: { isActive: false, updatedAt: new Date() } }))
    }

    if (targetUser.role === "company") {
      const companyDestinations = await destinationsCollection.find({ userId }).toArray()
      const destinationIds = companyDestinations.map((destination: any) => destination._id)

      if (destinationIds.length > 0) {
        cleanupTasks.push(bookingsCollection.deleteMany({ destinationId: { $in: destinationIds } }))
      }

      cleanupTasks.push(bookingsCollection.deleteMany({ userId }))
      cleanupTasks.push(destinationsCollection.deleteMany({ userId }))
      cleanupTasks.push(usersCollection.updateOne({ _id: userId }, { $set: { isActive: false, updatedAt: new Date() } }))
    }

    if (targetUser.role !== "guide" && targetUser.role !== "company") {
      cleanupTasks.push(usersCollection.deleteOne({ _id: userId }))
    }

    await Promise.all(cleanupTasks)

    // Remove the core user record for guides/companies after cleanup.
    if (targetUser.role === "guide" || targetUser.role === "company") {
      await usersCollection.deleteOne({ _id: userId })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
