import { Suspense } from "react"
import { GuidesContent } from "./guides-content"

export const metadata = {
  title: "Expert Local Guides | TrailMate",
  description: "Connect with certified guides who know every trail, peak, and hidden gem in Pakistan",
}

export default function GuidesPage() {
  return (
    <Suspense fallback={<GuidesLoading />}>
      <GuidesContent />
    </Suspense>
  )
}

function GuidesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-24 pb-12 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-12 w-64 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="h-12 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-muted rounded animate-pulse mb-4" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
