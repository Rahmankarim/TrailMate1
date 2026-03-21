"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Heart, MapPin, DollarSign, Star, Trash2, Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface SavedDestination {
  _id: string
  destinationId: string
  userId: string
  createdAt: string
  destination: {
    _id: string
    name: string
    description: string
    location: string
    price: number
    images?: string[]
    rating?: number
    slug?: string
  }
}

export default function SavedDestinationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Redirect non-users to their proper dashboards
  useEffect(() => {
    if (user && user.role === "guide") {
      router.push("/dashboard/guide")
    }
    if (user && user.role === "company") {
      router.push("/dashboard/company")
    }
    if (user && user.role === "admin") {
      router.push("/dashboard/admin")
    }
  }, [user, router])

  useEffect(() => {
    if (user) {
      fetchSavedDestinations()
    }
  }, [user])

  const fetchSavedDestinations = async () => {
    try {
      const response = await fetch("/api/saved", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSavedDestinations(data.saved || [])
      }
    } catch (error) {
      console.error("Error fetching saved destinations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (savedId: string) => {
    setRemovingId(savedId)
    try {
      const response = await fetch(`/api/saved/${savedId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setSavedDestinations(savedDestinations.filter((s) => s._id !== savedId))
        toast({
          title: "Removed",
          description: "Destination removed from saved list",
        })
      } else {
        throw new Error("Failed to remove")
      }
    } catch (error) {
      console.error("Error removing saved destination:", error)
      toast({
        title: "Error",
        description: "Failed to remove destination",
        variant: "destructive",
      })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role="user"
        user={{
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User",
          email: user?.email || "",
          avatar: user?.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Saved Destinations" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedDestinations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Destinations</h3>
                  <p className="text-muted-foreground mb-6">
                    Start exploring and save your favorite destinations
                  </p>
                  <Link href="/destinations">
                    <Button>
                      <MapPin className="h-4 w-4 mr-2" />
                      Explore Destinations
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Your Saved Destinations</h2>
                  <p className="text-muted-foreground">
                    {savedDestinations.length} destination{savedDestinations.length !== 1 ? "s" : ""} saved
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedDestinations.map((saved) => {
                    const destination = saved.destination
                    const slug = destination.slug || destination.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")

                    return (
                      <Card key={saved._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48">
                          <img
                            src={destination.images?.[0] || "/placeholder.svg"}
                            alt={destination.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => handleRemove(saved._id)}
                              disabled={removingId === saved._id}
                            >
                              {removingId === saved._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {destination.rating && (
                            <Badge className="absolute top-3 left-3 bg-background/90 text-foreground">
                              <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                              {destination.rating.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{destination.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {destination.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {destination.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">PKR {destination.price.toLocaleString()}</span>
                            </div>
                            <Link href={`/destinations/${slug}`}>
                              <Button size="sm">
                                View Details
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
