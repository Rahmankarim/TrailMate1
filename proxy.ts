import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessToken } from "@/lib/auth/jwt"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/api/bookings", "/api/profile", "/api/saved", "/api/notifications", "/api/messages", "/api/team"]

// Routes that are public
const publicRoutes = ["/", "/about", "/contact", "/destinations", "/guides", "/blog", "/signin", "/signup", "/verify-email", "/forgot-password", "/reset-password"]

// API routes that are public
const publicApiRoutes = ["/api/auth", "/api/destinations", "/api/guides", "/api/stories", "/api/reviews"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // Protect private routes
  if (isProtectedRoute) {
    if (!accessToken) {
      // Redirect to signin for dashboard routes
      if (pathname.startsWith("/dashboard")) {
        const signinUrl = new URL("/signin", request.url)
        signinUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(signinUrl)
      }
      
      // Return 401 for API routes
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Verify token
    const payload = verifyAccessToken(accessToken!)
    if (!payload) {
      // Token invalid or expired
      if (pathname.startsWith("/dashboard")) {
        const signinUrl = new URL("/signin", request.url)
        signinUrl.searchParams.set("callbackUrl", pathname)
        const response = NextResponse.redirect(signinUrl)
        // Clear invalid cookies
        response.cookies.delete("access_token")
        response.cookies.delete("refresh_token")
        return response
      }
      
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }
    }

    // Check role-based access for dashboard routes
    if (pathname.startsWith("/dashboard") && payload) {
      const role = payload.role
      
      // Admin can access all dashboards
      if (role === "admin") {
        return NextResponse.next()
      }

      // For non-admin users, redirect to their own dashboard if they try to access others
      // traveler uses /dashboard/user
      const userDefaultDashboard = role === "traveler" ? "user" : role
      
      if (pathname.startsWith("/dashboard/admin")) {
        return NextResponse.redirect(new URL(`/dashboard/${userDefaultDashboard}`, request.url))
      }
      
      if (pathname.startsWith("/dashboard/company") && role !== "company") {
        return NextResponse.redirect(new URL(`/dashboard/${userDefaultDashboard}`, request.url))
      }
      
      if (pathname.startsWith("/dashboard/guide") && role !== "guide") {
        return NextResponse.redirect(new URL(`/dashboard/${userDefaultDashboard}`, request.url))
      }
      
      if (pathname.startsWith("/dashboard/user") && role !== "traveler") {
        return NextResponse.redirect(new URL(`/dashboard/${userDefaultDashboard}`, request.url))
      }
    }
  }

  // Redirect authenticated users from signin/signup
  if ((pathname === "/signin" || pathname === "/signup") && accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) {
      const role = payload.role
      const dashboardPath = role === "traveler" ? "user" : role
      return NextResponse.redirect(new URL(`/dashboard/${dashboardPath}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
