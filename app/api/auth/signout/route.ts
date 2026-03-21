import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { getAuthCookies, clearAuthCookies } from "@/lib/auth/cookies"
import { verifyAccessToken } from "@/lib/auth/jwt"
import type { User, AuthResponse } from "@/lib/auth/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getAuthCookies()

    if (accessToken) {
      const payload = verifyAccessToken(accessToken)
      if (payload) {
        // Remove refresh token from user's stored tokens
        const usersCollection = await getCollection<User>("users")
        await usersCollection.updateOne(
          { _id: new ObjectId(payload.userId) },
          { $pull: { refreshTokens: refreshToken } },
        )
      }
    }

    // Clear cookies
    await clearAuthCookies()

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Signed out successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Signout error:", error)
    // Still clear cookies even if there's an error
    await clearAuthCookies()

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Signed out",
      },
      { status: 200 },
    )
  }
}
