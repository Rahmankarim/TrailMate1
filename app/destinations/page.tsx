import { Suspense } from "react"
import { DestinationsContent } from "./destinations-content"

export const metadata = {
  title: "Explore Destinations | TrailMate",
  description: "Discover breathtaking locations for your next sustainable adventure in Pakistan",
}

export default function DestinationsPage() {
  return (
    <Suspense fallback={<DestinationsLoading />}>
      <DestinationsContent />
    </Suspense>
  )
}

function DestinationsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-24 pb-12 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-12 w-80 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
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
              <div key={i} className="bg-card rounded-xl overflow-hidden border border-border">
                <div className="h-64 bg-muted animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
