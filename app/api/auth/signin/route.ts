import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { verifyPassword } from "@/lib/auth/password"
import { generateTokens } from "@/lib/auth/jwt"
import { setAuthCookies } from "@/lib/auth/cookies"
import type { User, SignInRequest, AuthResponse } from "@/lib/auth/types"

export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Get users collection
    const usersCollection = await getCollection<User>("users")

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Your account has been deactivated. Please contact support.",
        },
        { status: 403 },
      )
    }

    // Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Please verify your email address before signing in. Check your inbox for the verification code.",
        },
        { status: 403 },
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    // Store refresh token (keep only last 5 tokens)
    const refreshTokens = [...(user.refreshTokens || []), tokens.refreshToken].slice(-5)

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          refreshTokens,
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    // Set cookies
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    // Return response without sensitive data
    const { password: _, refreshTokens: __, ...userWithoutSensitive } = user

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Signed in successfully",
        user: userWithoutSensitive,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred during signin",
      },
      { status: 500 },
    )
  }
}
