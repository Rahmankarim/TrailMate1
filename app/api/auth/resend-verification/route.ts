import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { sendOTPEmail } from "@/lib/auth/email"
import { generateOTP, getOTPExpiration } from "@/lib/auth/otp"
import type { User, AuthResponse } from "@/lib/auth/types"
import type { PendingVerification } from "@/lib/db/models/pending-verification"

/**
 * POST /api/auth/resend-verification
 * 
 * Resends OTP verification code to user's email.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      )
    }

    // Get pending verifications collection
    const pendingVerificationsCollection = await getCollection<PendingVerification>("pending_verifications")

    // Find pending verification
    const pendingVerification = await pendingVerificationsCollection.findOne({
      email: email.toLowerCase(),
    })

    // Check if user already exists (verified)
    const usersCollection = await getCollection<User>("users")
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "This email is already verified. Please sign in.",
        },
        { status: 400 },
      )
    }

    // If no pending verification, return generic message
    if (!pendingVerification) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "No pending verification found for this email. Please sign up first.",
        },
        { status: 404 },
      )
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = getOTPExpiration()

    // Update pending verification with new OTP
    await pendingVerificationsCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          otp,
          expiresAt,
          attempts: 0, // Reset attempts
        },
      },
    )

    // Send new OTP email
    try {
      await sendOTPEmail(email, pendingVerification.firstName, otp)
    } catch (error) {
      console.error("Failed to send OTP email:", error)
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Failed to send verification email. Please try again.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "A new verification code has been sent to your email.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred while resending verification code",
      },
      { status: 500 },
    )
  }
}
