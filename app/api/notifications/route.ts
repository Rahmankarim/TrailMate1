import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

// GET - Fetch notifications for user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json(createErrorResponse("Unauthorized", 401), { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(createErrorResponse("Invalid token", 401), { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const paginate = searchParams.get("paginate") !== "false"
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const db = await getDatabase()
    const collection = db.collection("notifications")

    const query: any = { userId: new ObjectId(payload.userId) }
    if (unreadOnly) {
      query.read = false
    }

    if (paginate) {
      const { page, limit, skip } = getPaginationParams(searchParams, 50)
      const totalCount = await collection.countDocuments(query)

      const notifications = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const formattedNotifications = notifications.map((n) => ({
        ...n,
        _id: n._id.toString(),
        userId: n.userId.toString(),
      }))

      return NextResponse.json(
        createPaginatedResponse(formattedNotifications, totalCount, page, limit)
      )
    } else {
      const notifications = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      return NextResponse.json({
        notifications: notifications.map((n) => ({
          ...n,
          _id: n._id.toString(),
          userId: n.userId.toString(),
        })),
      })
    }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}

// POST - Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, actionUrl } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(createErrorResponse("Missing required fields", 400), { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("notifications")

    const notification = {
      userId: new ObjectId(userId),
      type,
      title,
      message,
      read: false,
      actionUrl,
      createdAt: new Date(),
    }

    const result = await collection.insertOne(notification)

    return NextResponse.json(
      createSuccessResponse(
        { notification: { ...notification, _id: result.insertedId } },
        "Notification created"
      ),
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(createErrorResponse("Internal server error", 500), { status: 500 })
  }
}
