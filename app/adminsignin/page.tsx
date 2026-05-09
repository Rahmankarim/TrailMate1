import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { AdminSignInContent } from "./signin-content"

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
      }
    >
      <AdminSignInContent />
    </Suspense>
  )
}