"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/signin")
      } else {
        // Redirect to appropriate dashboard profile based on role
        const role = user.role
        if (role === "admin") {
          router.push("/dashboard/admin/profile")
        } else if (role === "guide") {
          router.push("/dashboard/guide/profile")
        } else if (role === "company") {
          router.push("/dashboard/company/profile")
        } else {
          router.push("/dashboard/user/profile")
        }
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
