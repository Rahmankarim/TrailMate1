"use client"

import type { ReactNode } from "react"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function AdminAccessGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace(`/adminsignin?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, pathname, router, user?.role])

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return <>{children}</>
}