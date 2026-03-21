import { NextResponse } from "next/server"
import { getGoogleOAuthUrl } from "@/lib/auth/google"

export async function GET() {
  try {
    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(7)

    const authUrl = getGoogleOAuthUrl(state)

    const response = NextResponse.redirect(authUrl)

    // Store state in cookie for verification
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signin?error=oauth_error`,
    )
  }
}
