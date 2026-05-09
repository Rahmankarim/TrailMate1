"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Lock, Mail, Shield, Mountain } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "rahmankarrim2468@gmail.com"

export function AdminSignInContent() {
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/admin"
      router.replace(callbackUrl)
    }
  }, [authLoading, isAuthenticated, router, searchParams, user?.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/adminsignin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.success && data.user?.role === "admin") {
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/admin"
        router.replace(callbackUrl)
        router.refresh()
        return
      }

      setError(data.message || "Admin sign in failed")
    } catch (error) {
      console.error("Admin sign in error:", error)
      setError("An error occurred during admin sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Mountain className="h-10 w-10 text-foreground" />
            <span className="text-2xl font-bold text-foreground">TrailMate</span>
          </Link>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Admin Sign In</CardTitle>
            <CardDescription>Restricted access for the TrailMate admin console</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Admin Login"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Admin access is restricted to the TrailMate platform administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}