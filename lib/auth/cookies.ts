import { cookies } from "next/headers"

const ACCESS_TOKEN_NAME = "access_token"
const REFRESH_TOKEN_NAME = "refresh_token"

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  // Access token - short-lived, httpOnly
  cookieStore.set(ACCESS_TOKEN_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  })

  // Refresh token - longer-lived, httpOnly
  cookieStore.set(REFRESH_TOKEN_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })
}

export async function getAuthCookies() {
  const cookieStore = await cookies()
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_NAME)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_NAME)?.value,
  }
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_NAME)
  cookieStore.delete(REFRESH_TOKEN_NAME)
}
