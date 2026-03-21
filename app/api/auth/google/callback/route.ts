import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/auth/google"
import { generateTokens } from "@/lib/auth/jwt"
import { setAuthCookies } from "@/lib/auth/cookies"
import type { User } from "@/lib/auth/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Check for errors from Google
    if (error) {
      console.error("Google OAuth error:", error)
      return NextResponse.redirect(`${baseUrl}/signin?error=oauth_denied`)
    }

    // Validate code
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/signin?error=no_code`)
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get("oauth_state")?.value
    if (state && storedState && state !== storedState) {
      return NextResponse.redirect(`${baseUrl}/signin?error=invalid_state`)
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code)

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokenResponse.access_token)

    // Get users collection
    const usersCollection = await getCollection<User>("users")

    // Check if user exists with this Google ID
    let user = await usersCollection.findOne({ googleId: googleUser.id })

    // Check if user exists with this email but different auth method
    if (!user) {
      const existingUser = await usersCollection.findOne({ email: googleUser.email.toLowerCase() })

      if (existingUser) {
        // User exists with email but not linked to Google
        if (existingUser.authProvider === "local") {
          // Link Google account to existing user
          await usersCollection.updateOne(
            { _id: existingUser._id },
            {
              $set: {
                googleId: googleUser.id,
                avatar: existingUser.avatar || googleUser.picture,
                isVerified: true, // Google email is verified
                updatedAt: new Date(),
              },
            },
          )
          user = { ...existingUser, googleId: googleUser.id, isVerified: true }
        }
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      const now = new Date()
      const newUser: User = {
        email: googleUser.email.toLowerCase(),
        firstName: googleUser.given_name || googleUser.name.split(" ")[0],
        lastName: googleUser.family_name || googleUser.name.split(" ").slice(1).join(" ") || "",
        googleId: googleUser.id,
        avatar: googleUser.picture,
        role: "traveler", // Default role, can be changed later
        authProvider: "google",
        isVerified: true, // Google emails are pre-verified
        isActive: true,
        refreshTokens: [],
        createdAt: now,
        updatedAt: now,
      }

      const result = await usersCollection.insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }

      // Redirect new users to role selection
      const tokens = generateTokens({
        userId: user._id!.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      })

      await usersCollection.updateOne({ _id: user._id }, { $push: { refreshTokens: tokens.refreshToken } })

      const response = NextResponse.redirect(`${baseUrl}/auth/select-role`)
      await setAuthCookies(tokens.accessToken, tokens.refreshToken)

      // Clear state cookie
      response.cookies.delete("oauth_state")

      return response
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.redirect(`${baseUrl}/signin?error=account_disabled`)
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    // Store refresh token
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

    // Set auth cookies
    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    // Redirect based on role
    let redirectUrl = baseUrl
    switch (user.role) {
      case "admin":
        redirectUrl = `${baseUrl}/dashboard/admin`
        break
      case "guide":
        redirectUrl = `${baseUrl}/dashboard/guide`
        break
      case "company":
        redirectUrl = `${baseUrl}/dashboard/company`
        break
      default:
        redirectUrl = `${baseUrl}/dashboard/user`
    }

    const response = NextResponse.redirect(redirectUrl)

    // Clear state cookie
    response.cookies.delete("oauth_state")

    return response
  } catch (error) {
    console.error("Google callback error:", error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(`${baseUrl}/signin?error=oauth_failed`)
  }
}
