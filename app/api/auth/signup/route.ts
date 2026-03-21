import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password"
import { sendOTPEmail } from "@/lib/auth/email"
import { generateOTP, getOTPExpiration } from "@/lib/auth/otp"
import type { User, SignUpRequest, AuthResponse } from "@/lib/auth/types"
import type { PendingVerification } from "@/lib/db/models/pending-verification"

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json()
    const { email, password, firstName, lastName, role, phone } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: passwordValidation.errors.join(", "),
        },
        { status: 400 },
      )
    }

    // Validate role
    const validRoles = ["traveler", "guide", "company", "admin"]
    if (!validRoles.includes(role)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid role specified",
        },
        { status: 400 },
      )
    }

    // Get users collection to check for existing users
    const usersCollection = await getCollection<User>("users")

    // Check if user already exists (verified user)
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 },
      )
    }

    // Get pending verifications collection
    const pendingVerificationsCollection = await getCollection<PendingVerification>("pending_verifications")

    // Check if there's already a pending verification for this email
    const existingPending = await pendingVerificationsCollection.findOne({ email: email.toLowerCase() })
    if (existingPending) {
      // Delete old pending verification
      await pendingVerificationsCollection.deleteOne({ email: email.toLowerCase() })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate 6-digit OTP
    const otp = generateOTP()
    const expiresAt = getOTPExpiration()

    // Create pending verification document
    const now = new Date()
    const pendingVerification: PendingVerification = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phone,
      otp,
      expiresAt,
      createdAt: now,
      attempts: 0,
    }

    // Store in pending_verifications collection
    await pendingVerificationsCollection.insertOne(pendingVerification)

    // Send OTP email
    try {
      await sendOTPEmail(email, firstName, otp)
    } catch (error) {
      console.error("Failed to send OTP email:", error)
      // Delete pending verification if email fails
      await pendingVerificationsCollection.deleteOne({ email: email.toLowerCase() })
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
        message: "Verification code sent to your email. Please check your inbox.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred during signup",
      },
      { status: 500 },
    )
  }
}
