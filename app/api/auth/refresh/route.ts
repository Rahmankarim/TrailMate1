import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { verifyRefreshToken, generateTokens } from "@/lib/auth/jwt"
import { getAuthCookies, setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies"
import type { User, AuthResponse } from "@/lib/auth/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await getAuthCookies()

    if (!refreshToken) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "No refresh token provided",
        },
        { status: 401 },
      )
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      await clearAuthCookies()
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid or expired refresh token",
        },
        { status: 401 },
      )
    }

    // Get user from database
    const usersCollection = await getCollection<User>("users")
    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
      refreshTokens: refreshToken,
    })

    if (!user) {
      await clearAuthCookies()
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "User not found or token revoked",
        },
        { status: 401 },
      )
    }

    if (!user.isActive) {
      await clearAuthCookies()
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Account deactivated",
        },
        { status: 403 },
      )
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    // Rotate refresh token (remove old, add new)
    const newRefreshTokens = user.refreshTokens
      .filter((t) => t !== refreshToken)
      .concat(tokens.refreshToken)
      .slice(-5)

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          refreshTokens: newRefreshTokens,
          updatedAt: new Date(),
        },
      },
    )

    // Set new cookies
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Tokens refreshed successfully",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Refresh token error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred while refreshing tokens",
      },
      { status: 500 },
    )
  }
}
