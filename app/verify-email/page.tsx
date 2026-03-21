"use client"

import { Suspense } from "react"
import { VerifyEmailContent } from "./verify-email-content"

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
