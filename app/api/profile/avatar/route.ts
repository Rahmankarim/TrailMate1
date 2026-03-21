import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { getAuthCookies } from "@/lib/auth/cookies"
import { verifyAccessToken } from "@/lib/auth/jwt"
import type { User } from "@/lib/auth/types"
import { ObjectId } from "mongodb"

// POST - Upload avatar (expects base64 or URL)
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await getAuthCookies()

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const { avatar } = await request.json()

    if (!avatar) {
      return NextResponse.json({ success: false, message: "Avatar URL is required" }, { status: 400 })
    }

    // Validate avatar URL or base64
    const isValidUrl = /^https?:\/\/.+/.test(avatar)
    const isValidBase64 = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(avatar)

    if (!isValidUrl && !isValidBase64) {
      return NextResponse.json(
        { success: false, message: "Invalid avatar format. Must be a URL or base64 image" },
        { status: 400 },
      )
    }

    const usersCollection = await getCollection<User>("users")

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(payload.userId) },
      {
        $set: {
          avatar,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Avatar updated successfully",
      avatar: result.avatar,
    })
  } catch (error) {
    console.error("Upload avatar error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const { accessToken } = await getAuthCookies()

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const usersCollection = await getCollection<User>("users")

    await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId) },
      {
        $unset: { avatar: "" },
        $set: { updatedAt: new Date() },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully",
    })
  } catch (error) {
    console.error("Remove avatar error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
