import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password"
import { hashToken } from "@/lib/auth/email"
import type { User } from "@/lib/auth/types"

interface ResetPasswordRequest {
  token: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ success: false, message: "Token and password are required" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ success: false, message: passwordValidation.errors.join(", ") }, { status: 400 })
    }

    // Hash the token to compare with stored hash
    const tokenHash = hashToken(token)

    const usersCollection = await getCollection<
      User & {
        resetPasswordToken?: string
        resetPasswordExpires?: Date
      }
    >("users")

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired reset token" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          refreshTokens: [],
          updatedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
      },
    )

    return NextResponse.json(
      { success: true, message: "Password reset successfully. Please sign in with your new password." },
      { status: 200 },
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
