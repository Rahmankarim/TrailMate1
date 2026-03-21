"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Mountain, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function SignInContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { signIn, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log("🔐 SIGNIN PAGE: User already authenticated, redirecting...")
      const callbackUrl = searchParams.get("callbackUrl")
      
      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        // Redirect based on role
        const role = user.role
        let redirectPath = "/dashboard/user"
        if (role === "admin") {
          redirectPath = "/dashboard/admin"
        } else if (role === "guide") {
          redirectPath = "/dashboard/guide"
        } else if (role === "company") {
          redirectPath = "/dashboard/company"
        }
        router.push(redirectPath)
      }
    }
  }, [authLoading, isAuthenticated, user, searchParams, router])

  useEffect(() => {
    const oauthError = searchParams.get("error")
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        oauth_denied: "Google sign in was cancelled",
        oauth_error: "An error occurred with Google sign in",
        oauth_failed: "Failed to complete Google sign in",
        no_code: "Invalid OAuth response",
        invalid_state: "Invalid security state",
        account_disabled: "Your account has been disabled",
      }
      setError(errorMessages[oauthError] || "An error occurred during sign in")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("🔐 SIGNIN FORM: Starting signin...")
      const result = await signIn(email, password)
      console.log("🔐 SIGNIN FORM: Result:", { success: result.success, hasUser: !!result.user, role: result.user?.role })

      if (result.success && result.user) {
        // User is signed in successfully, redirect based on role
        const role = result.user.role
        
        let redirectPath = "/dashboard/user"
        if (role === "admin") {
          redirectPath = "/dashboard/admin"
        } else if (role === "guide") {
          redirectPath = "/dashboard/guide"
        } else if (role === "company") {
          redirectPath = "/dashboard/company"
        }
        
        console.log("🔐 SIGNIN FORM: Redirecting to:", redirectPath)
        
        // Use window.location.href for a full page reload to ensure auth state loads fresh
        window.location.href = redirectPath
        
        console.log("🔐 SIGNIN FORM: Redirect executed (you should not see this)")
        
        // Keep loading state active during redirect
        return
      } else {
        console.log("🔐 SIGNIN FORM: Signin failed:", result.message)
        setError(result.message || "Sign in failed")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("🔐 SIGNIN FORM: Exception:", error)
      setError("An error occurred during sign in")
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    window.location.href = "/api/auth/google"
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Mountain className="h-10 w-10 text-foreground" />
            <span className="text-2xl font-bold text-foreground">TrailMate</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your adventure</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/90 h-11"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full h-11 bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to Google...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {"Don't have an account? "}
              <Link href="/signup" className="text-foreground font-medium hover:underline">
                Sign up
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground mt-2">
              {"Didn't receive verification email? "}
              <Link href="/resend-verification" className="text-foreground hover:underline">
                Resend
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
