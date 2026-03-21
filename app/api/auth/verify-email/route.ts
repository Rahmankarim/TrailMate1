import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { sendWelcomeEmail } from "@/lib/auth/email"
import { isOTPExpired } from "@/lib/auth/otp"
import type { User, AuthResponse } from "@/lib/auth/types"
import type { PendingVerification } from "@/lib/db/models/pending-verification"

/**
 * POST /api/auth/verify-email
 * 
 * Verifies user email using OTP code.
 * Creates user account upon successful verification.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    // Validate required fields
    if (!email || !otp) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Email and OTP are required",
        },
        { status: 400 },
      )
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid OTP format. Please enter a 6-digit code.",
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

    if (!pendingVerification) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "No verification request found for this email. Please sign up again.",
        },
        { status: 404 },
      )
    }

    // Check if OTP has expired
    if (isOTPExpired(pendingVerification.expiresAt)) {
      // Delete expired verification
      await pendingVerificationsCollection.deleteOne({ email: email.toLowerCase() })
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Verification code has expired. Please sign up again.",
        },
        { status: 400 },
      )
    }

    // Verify OTP
    if (pendingVerification.otp !== otp) {
      // Increment failed attempts
      const attempts = (pendingVerification.attempts || 0) + 1
      
      // Delete if too many failed attempts (5 max)
      if (attempts >= 5) {
        await pendingVerificationsCollection.deleteOne({ email: email.toLowerCase() })
        return NextResponse.json<AuthResponse>(
          {
            success: false,
            message: "Too many failed attempts. Please sign up again.",
          },
          { status: 400 },
        )
      }

      // Update attempts
      await pendingVerificationsCollection.updateOne(
        { email: email.toLowerCase() },
        { $set: { attempts } }
      )

      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: `Invalid verification code. ${5 - attempts} attempts remaining.`,
        },
        { status: 400 },
      )
    }

    // OTP is valid - Create user account
    const usersCollection = await getCollection<User>("users")

    // Double-check user doesn't already exist
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      // Clean up pending verification
      await pendingVerificationsCollection.deleteOne({ email: email.toLowerCase() })
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "User already exists. Please sign in.",
        },
        { status: 409 },
      )
    }

    // Create user document
    const now = new Date()
    const newUser: User = {
      email: pendingVerification.email,
      password: pendingVerification.password, // Already hashed
      firstName: pendingVerification.firstName,
      lastName: pendingVerification.lastName,
      role: pendingVerification.role,
      phone: pendingVerification.phone,
      isVerified: true, // User is verified
      isActive: true,
      refreshTokens: [],
      authProvider: "local",
      createdAt: now,
      updatedAt: now,
    }

    // Add role-specific profile
    if (newUser.role === "guide") {
      newUser.guideProfile = {
        isApproved: false,
        rating: 0,
        totalReviews: 0,
      }
    } else if (newUser.role === "company") {
      newUser.companyProfile = {
        isApproved: false,
      }
    }

    // Insert user into database
    const result = await usersCollection.insertOne(newUser)

    // Delete pending verification
    await pendingVerificationsCollection.deleteOne({ email: email.toLowerCase() })

    // Send welcome email
    await sendWelcomeEmail(newUser.email, newUser.firstName)

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Email verified successfully! Your account has been created. Please sign in.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred during email verification",
      },
      { status: 500 },
    )
  }
}
