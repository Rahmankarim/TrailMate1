import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { getAuthCookies } from "@/lib/auth/cookies"
import { verifyAccessToken } from "@/lib/auth/jwt"
import type { User, AuthResponse } from "@/lib/auth/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { accessToken } = await getAuthCookies()

    if (!accessToken) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 },
      )
    }

    // Verify access token
    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: 401 },
      )
    }

    // Get user from database
    const usersCollection = await getCollection<User>("users")
    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    })

    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      )
    }

    if (!user.isActive) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Account deactivated",
        },
        { status: 403 },
      )
    }

    // Return user without sensitive data
    const { password: _, refreshTokens: __, ...userWithoutSensitive } = user

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "User retrieved successfully",
        user: userWithoutSensitive,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred",
      },
      { status: 500 },
    )
  }
}
