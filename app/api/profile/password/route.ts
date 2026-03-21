import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { getAuthCookies } from "@/lib/auth/cookies"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password"
import type { User } from "@/lib/auth/types"
import { ObjectId } from "mongodb"

// PUT - Change password
export async function PUT(request: NextRequest) {
  try {
    const { accessToken } = await getAuthCookies()

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "All password fields are required" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "New passwords do not match" }, { status: 400 })
    }

    // Validate password strength
    const strengthValidation = validatePasswordStrength(newPassword)
    if (!strengthValidation.isValid) {
      return NextResponse.json({ success: false, message: strengthValidation.message }, { status: 400 })
    }

    const usersCollection = await getCollection<User>("users")
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // OAuth users cannot change password
    if (user.authProvider !== "local" || !user.password) {
      return NextResponse.json(
        { success: false, message: "Password change not available for OAuth accounts" },
        { status: 400 },
      )
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.password)
    if (!isCurrentValid) {
      return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 })
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword)

    await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        // Invalidate all refresh tokens for security
        $unset: { refreshTokens: "" },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
