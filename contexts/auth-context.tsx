"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "traveler" | "guide" | "company" | "admin"

export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  avatar?: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  guideProfile?: {
    bio?: string
    specialties?: string[]
    languages?: string[]
    experience?: number
    certifications?: string[]
    rating?: number
    totalReviews?: number
    isApproved?: boolean
  }
  companyProfile?: {
    companyName?: string
    description?: string
    license?: string
    address?: string
    isApproved?: boolean
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>
  signUp: (data: SignUpData) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      console.log("🔄 AUTH: Fetching user from /api/auth/me")
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      console.log("🔄 AUTH: /api/auth/me response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("🔄 AUTH: /api/auth/me data:", { success: data.success, hasUser: !!data.user, email: data.user?.email })
        if (data.success && data.user) {
          setUser(data.user)
          console.log("✅ AUTH: User set successfully")
          return
        }
      }

      console.log("⚠️ AUTH: /api/auth/me failed, trying to refresh token")
      // Try to refresh the token
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })

      if (refreshResponse.ok) {
        console.log("✅ AUTH: Token refreshed, retrying /api/auth/me")
        // Retry getting user
        const retryResponse = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (retryResponse.ok) {
          const data = await retryResponse.json()
          if (data.success && data.user) {
            setUser(data.user)
            console.log("✅ AUTH: User set after refresh")
            return
          }
        }
      }

      console.log("❌ AUTH: No user found, setting to null")
      setUser(null)
    } catch (error) {
      console.error("❌ AUTH: Error refreshing user:", error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 SIGNIN: Starting signin for", email)
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()
      console.log("🔐 SIGNIN: API response:", { 
        status: response.status, 
        success: data.success, 
        hasUser: !!data.user,
        email: data.user?.email 
      })

      if (data.success && data.user) {
        setUser(data.user)
        console.log("✅ SIGNIN: User set in context")
        return { success: true, message: data.message, user: data.user }
      }

      console.log("❌ SIGNIN: Failed -", data.message)
      return { success: false, message: data.message || "Sign in failed" }
    } catch (error) {
      console.error("❌ SIGNIN: Exception:", error)
      return { success: false, message: "An error occurred during sign in" }
    }
  }

  const signUp = async (data: SignUpData) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      const result = await response.json()

      // Signup now returns success without user (user created after verification)
      if (result.success) {
        return { success: true, message: result.message }
      }

      return { success: false, message: result.message || "Sign up failed" }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, message: "An error occurred during sign up" }
    }
  }

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setUser(null)
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
