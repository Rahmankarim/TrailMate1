import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { generatePasswordResetToken, hashToken, sendPasswordResetEmail } from "@/lib/auth/email"
import type { User } from "@/lib/auth/types"

interface ForgotPasswordRequest {
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    const usersCollection = await getCollection<
      User & {
        resetPasswordToken?: string
        resetPasswordExpires?: Date
      }
    >("users")

    const user = await usersCollection.findOne({ email: email.toLowerCase() })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { success: true, message: "If an account exists with this email, you will receive a password reset link" },
        { status: 200 },
      )
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken()
    const resetTokenHash = hashToken(resetToken)
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store hashed token in database
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: resetExpires,
          updatedAt: new Date(),
        },
      },
    )

    await sendPasswordResetEmail(user.email, user.firstName, resetToken)

    return NextResponse.json(
      { success: true, message: "If an account exists with this email, you will receive a password reset link" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
